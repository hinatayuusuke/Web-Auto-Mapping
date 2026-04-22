import { create } from 'zustand';
import {
  applyCanvasPrimaryEdit,
  applyCanvasSecondaryEdit,
  applyForwardEdgeEdit,
  createExploreSeedFloorState,
  movePlayerInExploreMode,
  movePlayerInMapMode,
  placeSelectedCellIconAtPlayer,
  placeSelectedCellIconInFront,
  removeCellIconAt,
  updateFloorCellState,
  updateFloorEdgeState,
  updateFloorPlayer,
} from '../lib/mapModel';
import {
  createPersistedDocument,
  loadPersistedDocumentFromStorage,
  parsePersistedDocument,
  savePersistedDocumentToStorage,
} from '../lib/persistence';
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

type AppState = {
  autoMapping: AutoMappingLevel;
  floors: FloorState[];
  mapTitle: string;
  mode: AppMode;
  selectedCellIconKind: CellIconKind;
  selectedFloorId: string;
  selectedTool: EditTool;
  viewport: ViewportState;
};

type AppActions = {
  addFloor: () => void;
  applyCanvasPrimaryInteraction: (target: MapInteractionTarget) => void;
  applyCanvasSecondaryInteraction: (target: MapInteractionTarget) => void;
  applyForwardEdgeShortcut: (intent: EdgeEditIntent) => void;
  cycleSelectedCellIcon: (direction: 1 | -1) => void;
  duplicateSelectedFloor: () => void;
  loadPersistedDocument: (document: PersistedDocument) => boolean;
  moveInDirection: (facing: Facing) => void;
  placeSelectedIconAtCurrentCell: () => void;
  placeSelectedIconAtForwardCell: () => void;
  removeCurrentCellIcon: () => void;
  removeFloor: (floorId: string) => void;
  renameFloor: (floorId: string, name: string) => void;
  setAutoMapping: (level: AutoMappingLevel) => void;
  setMapTitle: (title: string) => void;
  setMode: (mode: AppMode) => void;
  setPlayerFacing: (facing: Facing) => void;
  setPlayerPosition: (coordinate: CellCoordinate) => void;
  setSelectedCellIconKind: (kind: CellIconKind) => void;
  setSelectedFloor: (floorId: string) => void;
  setSelectedFloorCellState: (coordinate: CellCoordinate, state: CellState) => void;
  setSelectedFloorEdgeState: (coordinate: EdgeCoordinate, state: EdgeState) => void;
  setSelectedTool: (tool: EditTool) => void;
  setViewport: (viewport: Partial<ViewportState>) => void;
  toggleMode: () => void;
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
const CELL_ICON_ORDER: CellIconKind[] = ['stairs', 'pit', 'chest', 'marker'];

const initialDocument = loadPersistedDocumentFromStorage() ?? createDefaultDocument();
const initialState = toAppState(initialDocument);

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  addFloor: () =>
    set((state) => {
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
  applyCanvasPrimaryInteraction: (target) =>
    set((state) => ({
      floors: updateSelectedFloor(state, (floor) =>
        state.mode === 'map'
          ? applyCanvasPrimaryEdit(floor, state.selectedTool, state.selectedCellIconKind, target)
          : floor,
      ),
    })),
  applyCanvasSecondaryInteraction: (target) =>
    set((state) => ({
      floors: updateSelectedFloor(state, (floor) =>
        state.mode === 'map' ? applyCanvasSecondaryEdit(floor, target) : floor,
      ),
    })),
  applyForwardEdgeShortcut: (intent) =>
    set((state) => ({
      floors: updateSelectedFloor(state, (floor) => applyForwardEdgeEdit(floor, intent)),
    })),
  cycleSelectedCellIcon: (direction) =>
    set((state) => ({
      selectedCellIconKind: cycleIconKind(state.selectedCellIconKind, direction),
    })),
  duplicateSelectedFloor: () =>
    set((state) => {
      const selectedFloor = getSelectedFloorFromState(state);

      if (!selectedFloor) {
        return {};
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
  loadPersistedDocument: (document) => {
    const parsed = parsePersistedDocument(document);

    if (!parsed) {
      return false;
    }

    set(toAppState(parsed));

    return true;
  },
  moveInDirection: (facing) =>
    set((state) => ({
      floors: updateSelectedFloor(state, (floor) =>
        state.mode === 'explore'
          ? movePlayerInExploreMode(floor, facing, state.autoMapping)
          : movePlayerInMapMode(floor, facing),
      ),
    })),
  placeSelectedIconAtCurrentCell: () =>
    set((state) => ({
      floors: updateSelectedFloor(state, (floor) =>
        placeSelectedCellIconAtPlayer(floor, state.selectedCellIconKind),
      ),
    })),
  placeSelectedIconAtForwardCell: () =>
    set((state) => ({
      floors: updateSelectedFloor(state, (floor) =>
        placeSelectedCellIconInFront(floor, state.selectedCellIconKind),
      ),
    })),
  removeCurrentCellIcon: () =>
    set((state) => ({
      floors: updateSelectedFloor(state, (floor) =>
        removeCellIconAt(floor, { x: floor.player.x, y: floor.player.y }),
      ),
    })),
  removeFloor: (floorId) =>
    set((state) => {
      if (state.floors.length <= 1) {
        return {};
      }

      const nextFloors = state.floors.filter((floor) => floor.id !== floorId);

      if (nextFloors.length === state.floors.length) {
        return {};
      }

      const nextSelectedFloorId =
        state.selectedFloorId === floorId ? nextFloors[0].id : state.selectedFloorId;

      return {
        floors: nextFloors,
        selectedFloorId: nextSelectedFloorId,
      };
    }),
  renameFloor: (floorId, name) =>
    set((state) => ({
      floors: state.floors.map((floor) =>
        floor.id === floorId ? { ...floor, name: sanitizeFloorName(name, floor.name) } : floor,
      ),
    })),
  setAutoMapping: (level) => set({ autoMapping: level }),
  setMapTitle: (title) => set({ mapTitle: sanitizeDocumentTitle(title) }),
  setMode: (mode) => set({ mode }),
  setPlayerFacing: (facing) =>
    set((state) => ({
      floors: updateSelectedFloor(state, (floor) => updateFloorPlayer(floor, { facing })),
    })),
  setPlayerPosition: (coordinate) =>
    set((state) => ({
      floors: updateSelectedFloor(state, (floor) =>
        updateFloorPlayer(floor, {
          x: coordinate.x,
          y: coordinate.y,
        }),
      ),
    })),
  setSelectedCellIconKind: (kind) =>
    set({ selectedCellIconKind: kind, selectedTool: 'cell-icon' }),
  setSelectedFloor: (floorId) =>
    set((state) => ({
      selectedFloorId: state.floors.some((floor) => floor.id === floorId)
        ? floorId
        : state.selectedFloorId,
    })),
  setSelectedFloorCellState: (coordinate, nextState) =>
    set((state) => ({
      floors: updateSelectedFloor(state, (floor) =>
        updateFloorCellState(floor, coordinate, nextState),
      ),
    })),
  setSelectedFloorEdgeState: (coordinate, nextState) =>
    set((state) => ({
      floors: updateSelectedFloor(state, (floor) =>
        updateFloorEdgeState(floor, coordinate, nextState),
      ),
    })),
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setViewport: (viewport) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        ...viewport,
      },
    })),
  toggleMode: () =>
    set((state) => ({
      mode: state.mode === 'explore' ? 'map' : 'explore',
    })),
}));

initializeAutoSave();

export function useSelectedFloor() {
  return useAppStore((state) => state.floors.find((floor) => floor.id === state.selectedFloorId));
}

function updateSelectedFloor(
  state: AppState,
  updater: (floor: FloorState) => FloorState,
): FloorState[] {
  return state.floors.map((floor) =>
    floor.id === state.selectedFloorId ? updater(floor) : floor,
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
    savePersistedDocumentToStorage(createPersistedDocument(state));
  });
}

function toAppState(document: PersistedDocument): AppState {
  const fallbackFloor = document.floors[0] ?? createDefaultDocument().floors[0];
  const selectedFloorId = document.floors.some((floor) => floor.id === document.selectedFloorId)
    ? document.selectedFloorId
    : fallbackFloor.id;

  return {
    autoMapping: document.settings.autoMapping,
    floors: document.floors.length > 0 ? document.floors : [fallbackFloor],
    mapTitle: sanitizeDocumentTitle(document.title),
    mode: document.settings.mode,
    selectedCellIconKind: document.settings.selectedCellIconKind,
    selectedFloorId,
    selectedTool: document.settings.selectedTool,
    viewport: document.viewport,
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

function getSelectedFloorFromState(state: AppState) {
  return state.floors.find((floor) => floor.id === state.selectedFloorId);
}

function sanitizeDocumentTitle(title: string) {
  const normalized = title.trim();

  return normalized.length > 0 ? normalized : DEFAULT_TITLE;
}

function sanitizeFloorName(name: string, fallback: string) {
  const normalized = name.trim();

  return normalized.length > 0 ? normalized : fallback;
}
