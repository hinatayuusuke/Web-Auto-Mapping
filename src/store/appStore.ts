import { create } from 'zustand';
import {
  createDemoFloorState,
  getFloorStats,
  updateFloorCellState,
  updateFloorEdgeState,
  updateFloorPlayer,
} from '../lib/mapModel';
import {
  AppMode,
  AutoMappingLevel,
  CellCoordinate,
  CellState,
  EdgeCoordinate,
  EdgeState,
  Facing,
  FloorState,
  GridDimensions,
  ViewportState,
} from '../types/map';

type AppState = {
  autoMapping: AutoMappingLevel;
  floors: FloorState[];
  mode: AppMode;
  selectedFloorId: string;
  viewport: ViewportState;
};

type AppActions = {
  setAutoMapping: (level: AutoMappingLevel) => void;
  setMode: (mode: AppMode) => void;
  setSelectedFloor: (floorId: string) => void;
  setViewport: (viewport: Partial<ViewportState>) => void;
  setPlayerPosition: (coordinate: CellCoordinate) => void;
  setPlayerFacing: (facing: Facing) => void;
  setSelectedFloorCellState: (coordinate: CellCoordinate, state: CellState) => void;
  setSelectedFloorEdgeState: (coordinate: EdgeCoordinate, state: EdgeState) => void;
};

type AppStore = AppState & AppActions;

const DEFAULT_GRID: GridDimensions = {
  width: 16,
  height: 16,
};

const initialFloor = createDemoFloorState('floor-01', 'B1F', DEFAULT_GRID);

export const useAppStore = create<AppStore>((set) => ({
  autoMapping: 'basic',
  floors: [initialFloor],
  mode: 'explore',
  selectedFloorId: initialFloor.id,
  viewport: {
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
  },
  setAutoMapping: (level) => set({ autoMapping: level }),
  setMode: (mode) => set({ mode }),
  setSelectedFloor: (floorId) => set({ selectedFloorId: floorId }),
  setViewport: (viewport) =>
    set((state) => ({
      viewport: {
        ...state.viewport,
        ...viewport,
      },
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
  setPlayerFacing: (facing) =>
    set((state) => ({
      floors: updateSelectedFloor(state, (floor) => updateFloorPlayer(floor, { facing })),
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
