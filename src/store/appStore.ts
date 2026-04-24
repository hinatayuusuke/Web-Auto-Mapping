import { create } from 'zustand';
import {
  applyCanvasPrimaryEdit,
  applyCanvasSecondaryEdit,
  applyForwardEdgeEdit,
  createExploreSeedFloorState,
  expandFloorGrid,
  getCoordinateInDirection,
  movePlayerInExploreMode,
  movePlayerInMapMode,
  placeSelectedCellIconAtPlayer,
  placeSelectedCellIconInFront,
  removeCellIconAt,
  updateMarkerMessageAt,
  updateFloorCellState,
  updateFloorEdgeState,
  updateFloorPlayer,
} from '../lib/mapModel';
import {
  createPersistedDocument,
  parsePersistedDocument,
} from '../lib/persistence';
import { loadDocument, saveDocument } from '../lib/storageAdapter';
import {
  AppMode,
  AutoMappingLevel,
  CellCoordinate,
  CellIconKind,
  CellState,
  EditTool,
  EdgeCoordinate,
  EdgeEditIntent,
  EdgeState,
  Facing,
  FloorState,
  GridDimensions,
  MapInteractionTarget,
  PersistedDocument,
  ViewportState,
} from '../types/map';

type HistoryState = {
  redoStack: PersistedDocument[];
  undoStack: PersistedDocument[];
};

type AppState = {
  autoMapping: AutoMappingLevel;
  floors: FloorState[];
  history: HistoryState;
  mapTitle: string;
  mode: AppMode;
  persistenceReady: boolean;
  selectedCellIconKind: CellIconKind;
  selectedFloorId: string;
  selectedTool: EditTool;
  viewport: ViewportState;
};

type AppActions = {
  addFloor: () => void;
  applyCanvasPrimaryInteraction: (target: MapInteractionTarget) => void;
  applyCanvasPrimaryInteractionPreview: (target: MapInteractionTarget) => void;
  applyCanvasSecondaryInteraction: (target: MapInteractionTarget) => void;
  applyCanvasSecondaryInteractionPreview: (target: MapInteractionTarget) => void;
  applyForwardEdgeShortcut: (intent: EdgeEditIntent) => void;
  commitCanvasInteractionSession: (snapshot: PersistedDocument) => void;
  cycleSelectedCellIcon: (direction: 1 | -1) => void;
  duplicateSelectedFloor: () => void;
  expandSelectedFloorLeft: (amount?: number) => void;
  expandSelectedFloorUp: (amount?: number) => void;
  expandSelectedFloorDown: (amount?: number) => void;
  expandSelectedFloorRight: (amount?: number) => void;
  hydratePersistedState: () => Promise<boolean>;
  loadPersistedDocument: (document: PersistedDocument) => boolean;
  moveInDirection: (facing: Facing) => void;
  placeSelectedIconAtCurrentCell: () => void;
  placeSelectedIconAtForwardCell: () => void;
  redo: () => void;
  removeCurrentCellIcon: () => void;
  removeFloor: (floorId: string) => void;
  renameFloor: (floorId: string, name: string) => void;
  resetViewport: () => void;
  setAutoMapping: (level: AutoMappingLevel) => void;
  setMapTitle: (title: string) => void;
  setMode: (mode: AppMode) => void;
  setPlayerFacing: (facing: Facing) => void;
  setSelectedMarkerMessage: (coordinate: CellCoordinate, message: string) => void;
  setPlayerPosition: (coordinate: CellCoordinate) => void;
  setSelectedCellIconKind: (kind: CellIconKind) => void;
  setSelectedFloor: (floorId: string) => void;
  setSelectedFloorCellState: (coordinate: CellCoordinate, state: CellState) => void;
  setSelectedFloorEdgeState: (coordinate: EdgeCoordinate, state: EdgeState) => void;
  setSelectedTool: (tool: EditTool) => void;
  setViewport: (viewport: Partial<ViewportState>) => void;
  toggleMode: () => void;
  undo: () => void;
};

type AppStore = AppState & AppActions;

const DEFAULT_GRID: GridDimensions = {
  width: 16,
  height: 16,
};

const DEFAULT_AUTO_MAPPING: AutoMappingLevel = 'basic';
const DEFAULT_VIEWPORT: ViewportState = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};
const DEFAULT_TITLE = 'Untitled Map';
const CELL_ICON_ORDER: CellIconKind[] = ['stairs', 'stairs-down', 'pit', 'chest', 'marker'];
const HISTORY_LIMIT = 80;
const GRID_EXPAND_STEP = 4;

const initialState: AppState = {
  ...toAppState(createDefaultDocument()),
  history: createEmptyHistory(),
};

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  addFloor: () =>
    set((state) =>
      applyTrackedMutation(state, () => {
        const nextIndex = state.floors.length + 1;
        const nextFloor = createExploreSeedFloorState(
          createFloorId(),
          `B${nextIndex}F`,
          DEFAULT_GRID,
          state.autoMapping,
        );

        return {
          floors: [...state.floors, nextFloor],
          selectedFloorId: nextFloor.id,
        };
      }),
    ),
  applyCanvasPrimaryInteraction: (target) =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) =>
          state.mode === 'map'
            ? applyCanvasPrimaryEdit(floor, state.selectedTool, state.selectedCellIconKind, target)
            : floor,
        ),
      })),
    ),
  applyCanvasPrimaryInteractionPreview: (target) =>
    set((state) =>
      applyUntrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) =>
          state.mode === 'map'
            ? applyCanvasPrimaryEdit(floor, state.selectedTool, state.selectedCellIconKind, target)
            : floor,
        ),
      })),
    ),
  applyCanvasSecondaryInteraction: (target) =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) =>
          state.mode === 'map' ? applyCanvasSecondaryEdit(floor, target) : floor,
        ),
      })),
    ),
  applyCanvasSecondaryInteractionPreview: (target) =>
    set((state) =>
      applyUntrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) =>
          state.mode === 'map' ? applyCanvasSecondaryEdit(floor, target) : floor,
        ),
      })),
    ),
  applyForwardEdgeShortcut: (intent) =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) => applyForwardEdgeEdit(floor, intent)),
      })),
    ),
  commitCanvasInteractionSession: (snapshot) =>
    set((state) => {
      const currentDocument = createPersistedDocument(state);

      if (!hasTrackableDocumentChanged(snapshot, currentDocument)) {
        return {};
      }

      return {
        history: {
          undoStack: trimHistory([...state.history.undoStack, clonePersistedDocument(snapshot)]),
          redoStack: [],
        },
      };
    }),
  cycleSelectedCellIcon: (direction) =>
    set((state) => ({
      selectedCellIconKind: cycleIconKind(state.selectedCellIconKind, direction),
    })),
  duplicateSelectedFloor: () =>
    set((state) =>
      applyTrackedMutation(state, () => {
        const selectedFloor = getSelectedFloorFromState(state);

        if (!selectedFloor) {
          return null;
        }

        const duplicate = cloneFloorState(
          selectedFloor,
          createFloorId(),
          `${selectedFloor.name} Copy`,
        );

        return {
          floors: [...state.floors, duplicate],
          selectedFloorId: duplicate.id,
        };
      }),
    ),
  expandSelectedFloorLeft: (amount = GRID_EXPAND_STEP) =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) => expandFloorGrid(floor, { left: amount })),
      })),
    ),
  expandSelectedFloorUp: (amount = GRID_EXPAND_STEP) =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) => expandFloorGrid(floor, { up: amount })),
      })),
    ),
  expandSelectedFloorDown: (amount = GRID_EXPAND_STEP) =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) => expandFloorGrid(floor, { down: amount })),
      })),
    ),
  expandSelectedFloorRight: (amount = GRID_EXPAND_STEP) =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) => expandFloorGrid(floor, { right: amount })),
      })),
    ),
  hydratePersistedState: async () => {
    const document = await loadDocument();

    if (!document) {
      set({ persistenceReady: true });
      return false;
    }

    set({
      ...toAppState(clonePersistedDocument(document)),
      history: createEmptyHistory(),
      persistenceReady: true,
    });

    return true;
  },
  loadPersistedDocument: (document) => {
    const parsed = parsePersistedDocument(document);

    if (!parsed) {
      return false;
    }

    set({
      ...toAppState(clonePersistedDocument(parsed)),
      history: createEmptyHistory(),
      persistenceReady: true,
    });

    return true;
  },
  moveInDirection: (facing) =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) =>
          state.mode === 'explore'
            ? movePlayerInExploreMode(
                expandFloorForExploreMove(floor, facing),
                facing,
                state.autoMapping,
              )
            : movePlayerInMapMode(floor, facing),
        ),
      })),
    ),
  placeSelectedIconAtCurrentCell: () =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) =>
          placeSelectedCellIconAtPlayer(floor, state.selectedCellIconKind),
        ),
      })),
    ),
  placeSelectedIconAtForwardCell: () =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) =>
          placeSelectedCellIconInFront(floor, state.selectedCellIconKind),
        ),
      })),
    ),
  redo: () =>
    set((state) => {
      const snapshot = state.history.redoStack[state.history.redoStack.length - 1];

      if (!snapshot) {
        return {};
      }

      return {
        ...toAppState(clonePersistedDocument(snapshot)),
        persistenceReady: state.persistenceReady,
        history: {
          undoStack: trimHistory([
            ...state.history.undoStack,
            clonePersistedDocument(createPersistedDocument(state)),
          ]),
          redoStack: state.history.redoStack.slice(0, -1),
        },
      };
    }),
  removeCurrentCellIcon: () =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) =>
          removeCellIconAt(floor, { x: floor.player.x, y: floor.player.y }),
        ),
      })),
    ),
  removeFloor: (floorId) =>
    set((state) =>
      applyTrackedMutation(state, () => {
        if (state.floors.length <= 1) {
          return null;
        }

        const nextFloors = state.floors.filter((floor) => floor.id !== floorId);

        if (nextFloors.length === state.floors.length) {
          return null;
        }

        return {
          floors: nextFloors,
          selectedFloorId:
            state.selectedFloorId === floorId ? nextFloors[0].id : state.selectedFloorId,
        };
      }),
    ),
  renameFloor: (floorId, name) =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateFloorById(state.floors, floorId, (floor) => {
          const nextName = sanitizeFloorName(name, floor.name);

          return nextName === floor.name ? floor : { ...floor, name: nextName };
        }),
      })),
    ),
  resetViewport: () =>
    set((state) => ({
      viewport: isSameViewport(state.viewport, DEFAULT_VIEWPORT)
        ? state.viewport
        : DEFAULT_VIEWPORT,
    })),
  setAutoMapping: (level) =>
    set((state) => (state.autoMapping === level ? {} : { autoMapping: level })),
  setMapTitle: (title) =>
    set((state) =>
      applyTrackedMutation(state, () => {
        const nextTitle = sanitizeDocumentTitle(title);

        return nextTitle === state.mapTitle ? null : { mapTitle: nextTitle };
      }),
    ),
  setMode: (mode) => set((state) => (state.mode === mode ? {} : { mode })),
  setPlayerFacing: (facing) =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) => updateFloorPlayer(floor, { facing })),
      })),
    ),
  setSelectedMarkerMessage: (coordinate, message) =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) =>
          updateMarkerMessageAt(floor, coordinate, message),
        ),
      })),
    ),
  setPlayerPosition: (coordinate) =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) =>
          updateFloorPlayer(floor, {
            x: coordinate.x,
            y: coordinate.y,
          }),
        ),
      })),
    ),
  setSelectedCellIconKind: (kind) =>
    set((state) => ({
      selectedCellIconKind: kind,
      selectedTool: state.selectedTool === 'cell-icon' && state.selectedCellIconKind === kind
        ? state.selectedTool
        : 'cell-icon',
    })),
  setSelectedFloor: (floorId) =>
    set((state) => ({
      selectedFloorId: state.floors.some((floor) => floor.id === floorId)
        ? floorId
        : state.selectedFloorId,
    })),
  setSelectedFloorCellState: (coordinate, nextState) =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) =>
          updateFloorCellState(floor, coordinate, nextState),
        ),
      })),
    ),
  setSelectedFloorEdgeState: (coordinate, nextState) =>
    set((state) =>
      applyTrackedMutation(state, () => ({
        floors: updateSelectedFloor(state, (floor) =>
          updateFloorEdgeState(floor, coordinate, nextState),
        ),
      })),
    ),
  setSelectedTool: (tool) => set((state) => (state.selectedTool === tool ? {} : { selectedTool: tool })),
  setViewport: (viewport) =>
    set((state) => {
      const nextViewport = sanitizeViewport({
        ...state.viewport,
        ...viewport,
      });

      return isSameViewport(state.viewport, nextViewport) ? {} : { viewport: nextViewport };
    }),
  toggleMode: () =>
    set((state) => ({
      mode: state.mode === 'explore' ? 'map' : 'explore',
    })),
  undo: () =>
    set((state) => {
      const snapshot = state.history.undoStack[state.history.undoStack.length - 1];

      if (!snapshot) {
        return {};
      }

      return {
        ...toAppState(clonePersistedDocument(snapshot)),
        persistenceReady: state.persistenceReady,
        history: {
          undoStack: state.history.undoStack.slice(0, -1),
          redoStack: trimHistory([
            ...state.history.redoStack,
            clonePersistedDocument(createPersistedDocument(state)),
          ]),
        },
      };
    }),
}));

initializeAutoSave();

export function useSelectedFloor() {
  return useAppStore((state) => state.floors.find((floor) => floor.id === state.selectedFloorId));
}

function updateSelectedFloor(
  state: Pick<AppState, 'floors' | 'selectedFloorId'>,
  updater: (floor: FloorState) => FloorState,
): FloorState[] {
  return updateFloorById(state.floors, state.selectedFloorId, updater);
}

function updateFloorById(
  floors: FloorState[],
  floorId: string,
  updater: (floor: FloorState) => FloorState,
): FloorState[] {
  let changed = false;

  const nextFloors = floors.map((floor) => {
    if (floor.id !== floorId) {
      return floor;
    }

    const nextFloor = updater(floor);

    if (nextFloor !== floor) {
      changed = true;
    }

    return nextFloor;
  });

  return changed ? nextFloors : floors;
}

function applyTrackedMutation(
  state: AppState,
  mutate: (state: AppState) => Partial<AppState> | null,
): Partial<AppStore> {
  const patch = mutate(state);

  if (!patch) {
    return {};
  }

  const nextState: AppState = {
    ...state,
    ...patch,
  };

  if (!hasTrackableStateChanged(state, nextState)) {
    return patch;
  }

  return {
    ...patch,
    history: {
      undoStack: trimHistory([
        ...state.history.undoStack,
        clonePersistedDocument(createPersistedDocument(state)),
      ]),
      redoStack: [],
    },
  };
}

function applyUntrackedMutation(
  state: AppState,
  mutate: (state: AppState) => Partial<AppState> | null,
): Partial<AppStore> {
  const patch = mutate(state);

  return patch ?? {};
}

function hasTrackableStateChanged(previous: AppState, next: AppState) {
  return (
    previous.floors !== next.floors ||
    previous.mapTitle !== next.mapTitle ||
    previous.selectedFloorId !== next.selectedFloorId
  );
}

function hasTrackableDocumentChanged(previous: PersistedDocument, next: PersistedDocument) {
  return (
    previous.title !== next.title ||
    previous.selectedFloorId !== next.selectedFloorId ||
    JSON.stringify(previous.floors) !== JSON.stringify(next.floors)
  );
}

function cycleIconKind(current: CellIconKind, direction: 1 | -1): CellIconKind {
  const currentIndex = CELL_ICON_ORDER.indexOf(current);
  const nextIndex =
    (currentIndex + direction + CELL_ICON_ORDER.length) % CELL_ICON_ORDER.length;

  return CELL_ICON_ORDER[nextIndex];
}

function initializeAutoSave() {
  if (typeof window === 'undefined') {
    return;
  }

  const guardedWindow = window as Window & {
    __wam_auto_save_initialized__?: boolean;
  };

  if (guardedWindow.__wam_auto_save_initialized__) {
    return;
  }

  guardedWindow.__wam_auto_save_initialized__ = true;

  useAppStore.subscribe((state) => {
    if (!state.persistenceReady) {
      return;
    }

    // WHY: 非同期 hydrate 前に既定状態を書き戻すと、既存の保存内容を上書きし得る。
    void saveDocument(createPersistedDocument(state));
  });
}

function toAppState(document: PersistedDocument): Omit<AppState, 'history'> {
  const fallbackFloor = document.floors[0] ?? createDefaultDocument().floors[0];
  const selectedFloorId = document.floors.some((floor) => floor.id === document.selectedFloorId)
    ? document.selectedFloorId
    : fallbackFloor.id;

  return {
    autoMapping: document.settings.autoMapping,
    floors: document.floors.length > 0 ? document.floors : [fallbackFloor],
    mapTitle: sanitizeDocumentTitle(document.title),
    mode: document.settings.mode,
    persistenceReady: false,
    selectedCellIconKind: document.settings.selectedCellIconKind,
    selectedFloorId,
    selectedTool: document.settings.selectedTool,
    viewport: sanitizeViewport(document.viewport),
  };
}

function createDefaultDocument(): PersistedDocument {
  const floor = createExploreSeedFloorState(
    createFloorId(),
    'B1F',
    DEFAULT_GRID,
    DEFAULT_AUTO_MAPPING,
  );

  return {
    version: 1,
    title: DEFAULT_TITLE,
    settings: {
      autoMapping: DEFAULT_AUTO_MAPPING,
      mode: 'explore',
      selectedCellIconKind: 'stairs',
      selectedTool: 'cell-floor',
    },
    floors: [floor],
    selectedFloorId: floor.id,
    viewport: DEFAULT_VIEWPORT,
  };
}

function createFloorId() {
  return `floor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cloneFloorState(floor: FloorState, nextId: string, nextName: string): FloorState {
  return {
    ...structuredClone(floor),
    id: nextId,
    name: nextName,
  };
}

function clonePersistedDocument(document: PersistedDocument): PersistedDocument {
  return structuredClone(document);
}

function createEmptyHistory(): HistoryState {
  return {
    redoStack: [],
    undoStack: [],
  };
}

function getSelectedFloorFromState(state: Pick<AppState, 'floors' | 'selectedFloorId'>) {
  return state.floors.find((floor) => floor.id === state.selectedFloorId);
}

function expandFloorForExploreMove(floor: FloorState, facing: Facing) {
  // WHY: 上/左拡張時はプレイヤーやアイコン座標もシフトするため、既存の拡張処理を先に通してから通常移動させる。
  const destination = getCoordinateInDirection(
    {
      x: floor.player.x,
      y: floor.player.y,
    },
    facing,
  );

  if (destination.x < 0) {
    return expandFloorGrid(floor, { left: GRID_EXPAND_STEP });
  }

  if (destination.x >= floor.width) {
    return expandFloorGrid(floor, { right: GRID_EXPAND_STEP });
  }

  if (destination.y < 0) {
    return expandFloorGrid(floor, { up: GRID_EXPAND_STEP });
  }

  if (destination.y >= floor.height) {
    return expandFloorGrid(floor, { down: GRID_EXPAND_STEP });
  }

  return floor;
}

function trimHistory(history: PersistedDocument[]) {
  return history.slice(-HISTORY_LIMIT);
}

function sanitizeDocumentTitle(title: string) {
  // WHY: 入力中に trim すると単語間や末尾のスペースが即時消えて、通常のタイトル編集を妨げる。
  return title.trim().length > 0 ? title : DEFAULT_TITLE;
}

function sanitizeFloorName(name: string, fallback: string) {
  const normalized = name.trim();

  return normalized.length > 0 ? normalized : fallback;
}

function sanitizeViewport(viewport: ViewportState): ViewportState {
  return {
    zoom: Math.min(3, Math.max(0.25, Number.isFinite(viewport.zoom) ? viewport.zoom : DEFAULT_VIEWPORT.zoom)),
    offsetX: Number.isFinite(viewport.offsetX) ? viewport.offsetX : DEFAULT_VIEWPORT.offsetX,
    offsetY: Number.isFinite(viewport.offsetY) ? viewport.offsetY : DEFAULT_VIEWPORT.offsetY,
  };
}

function isSameViewport(left: ViewportState, right: ViewportState) {
  return (
    left.zoom === right.zoom &&
    left.offsetX === right.offsetX &&
    left.offsetY === right.offsetY
  );
}
