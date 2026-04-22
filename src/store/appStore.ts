import { create } from 'zustand';
import {
  applyCanvasPrimaryEdit,
  applyCanvasSecondaryEdit,
  applyForwardEdgeEdit,
  createExploreSeedFloorState,
  getFloorStats,
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
  ViewportState,
} from '../types/map';

type AppState = {
  autoMapping: AutoMappingLevel;
  floors: FloorState[];
  mode: AppMode;
  selectedCellIconKind: CellIconKind;
  selectedFloorId: string;
  selectedTool: EditTool;
  viewport: ViewportState;
};

type AppActions = {
  applyCanvasPrimaryInteraction: (target: MapInteractionTarget) => void;
  applyCanvasSecondaryInteraction: (target: MapInteractionTarget) => void;
  applyForwardEdgeShortcut: (intent: EdgeEditIntent) => void;
  cycleSelectedCellIcon: (direction: 1 | -1) => void;
  moveInDirection: (facing: Facing) => void;
  placeSelectedIconAtCurrentCell: () => void;
  placeSelectedIconAtForwardCell: () => void;
  removeCurrentCellIcon: () => void;
  setAutoMapping: (level: AutoMappingLevel) => void;
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
const CELL_ICON_ORDER: CellIconKind[] = ['stairs', 'pit', 'chest', 'marker'];
const initialFloor = createExploreSeedFloorState(
  'floor-01',
  'B1F',
  DEFAULT_GRID,
  DEFAULT_AUTO_MAPPING,
);

export const useAppStore = create<AppStore>((set) => ({
  autoMapping: DEFAULT_AUTO_MAPPING,
  floors: [initialFloor],
  mode: 'explore',
  selectedCellIconKind: 'stairs',
  selectedFloorId: initialFloor.id,
  selectedTool: 'cell-floor',
  viewport: {
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  },
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
  setAutoMapping: (level) => set({ autoMapping: level }),
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
  setSelectedCellIconKind: (kind) => set({ selectedCellIconKind: kind, selectedTool: 'cell-icon' }),
  setSelectedFloor: (floorId) => set({ selectedFloorId: floorId }),
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

export function useSelectedFloor() {
  return useAppStore((state) => state.floors.find((floor) => floor.id === state.selectedFloorId));
}

export function useSelectedFloorStats() {
  return useAppStore((state) => {
    const selectedFloor = state.floors.find((floor) => floor.id === state.selectedFloorId);

    return selectedFloor ? getFloorStats(selectedFloor) : null;
  });
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
