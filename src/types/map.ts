export type AppMode = 'explore' | 'map';

export type AutoMappingLevel = 'off' | 'basic' | 'corridor';

export type Facing = 'north' | 'east' | 'south' | 'west';

export type CellState = 'unknown' | 'floor';

export type EdgeState = 'unknown' | 'open' | 'wall';

export type CellIconKind = 'stairs' | 'pit' | 'chest' | 'marker';

export type EdgeIconKind = 'door' | 'secret-door' | 'one-way';

export type EdgeAxis = 'horizontal' | 'vertical';

export type EdgeEditIntent = 'wall' | 'door' | 'open' | 'unknown';

export type EditTool =
  | 'cell-floor'
  | 'cell-unknown'
  | 'edge-wall'
  | 'edge-door'
  | 'edge-open'
  | 'edge-unknown'
  | 'cell-icon';

export type GridDimensions = {
  width: number;
  height: number;
};

export type CellCoordinate = {
  x: number;
  y: number;
};

export type EdgeCoordinate = CellCoordinate & {
  axis: EdgeAxis;
};

export type MapInteractionTarget =
  | {
      kind: 'cell';
      coordinate: CellCoordinate;
    }
  | {
      kind: 'edge';
      coordinate: EdgeCoordinate;
    };

export type PlayerState = {
  x: number;
  y: number;
  facing: Facing;
};

export type CellIcon = {
  id: string;
  kind: CellIconKind;
  position: CellCoordinate;
};

export type EdgeIcon = {
  id: string;
  kind: EdgeIconKind;
  edge: EdgeCoordinate;
};

export type FloorState = GridDimensions & {
  id: string;
  name: string;
  player: PlayerState;
  cells: CellState[][];
  hEdges: EdgeState[][];
  vEdges: EdgeState[][];
  cellIcons: CellIcon[];
  edgeIcons: EdgeIcon[];
};

export type ViewportState = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};

export type FloorStats = {
  knownCells: number;
  openEdges: number;
  wallEdges: number;
  cellIcons: number;
  edgeIcons: number;
};

export type PersistedSettings = {
  autoMapping: AutoMappingLevel;
  mode: AppMode;
  selectedCellIconKind: CellIconKind;
  selectedTool: EditTool;
};

export type PersistedDocument = {
  version: number;
  title: string;
  settings: PersistedSettings;
  floors: FloorState[];
  selectedFloorId: string;
  viewport: ViewportState;
};
