import { create } from 'zustand';
import {
  AppMode,
  AutoMappingLevel,
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
};

type AppStore = AppState & AppActions;

const DEFAULT_GRID: GridDimensions = {
  width: 16,
  height: 16,
};

function createFloorState(id: string, name: string, dimensions: GridDimensions): FloorState {
  return {
    id,
    name,
    width: dimensions.width,
    height: dimensions.height,
    player: {
      x: Math.floor(dimensions.width / 2),
      y: Math.floor(dimensions.height / 2),
      facing: 'north',
    },
  };
}

const initialFloor = createFloorState('floor-01', 'B1F', DEFAULT_GRID);

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
}));
