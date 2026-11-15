export type AppMode = 'explore' | 'map';

export type AutoMappingLevel = 'off' | 'basic' | 'corridor';

export type Facing = 'north' | 'east' | 'south' | 'west';

export type CellState = 'unknown' | 'floor';

export type EdgeState = 'unknown' | 'open' | 'wall';

export type CellIconKind = 'stairs' | 'stairs-down' | 'pit' | 'chest' | 'marker';

export type EdgeIconKind = 'door' | 'closed-door' | 'secret-door' | 'one-way';

export type EdgeAxis = 'horizontal' | 'vertical';

export type EdgeEditIntent = 'wall' | 'door' | 'closed-door' | 'open' | 'unknown';

export type EditTool =
  | 'cell-floor'
  | 'cell-unknown'
  | 'cell-dark-zone'
  | 'edge-wall'
  | 'edge-door'
  | 'edge-closed-door'
  | 'edge-one-way-positive'
  | 'edge-one-way-negative'
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

export type CellRect = {
  x: number;
  y: number;
  width: number;
  height: number;
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
  message?: string;
  position: CellCoordinate;
};

export type EdgeIcon = {
  id: string;
  edge: EdgeCoordinate;
} & (
  | { kind: 'one-way'; direction: Facing }
  | { kind: Exclude<EdgeIconKind, 'one-way'> }
);

export type FloorState = GridDimensions & {
  id: string;
  name: string;
  // COMPAT: v1 の既存保存データはこの項目を持たず、その場合は端ループ無効として扱う。
  edgeWrapEnabled?: boolean;
  // COMPAT: v1 で省略された場合は暗闇なし。床アイコンと独立させ、同じマスで共存させる。
  darkZones?: CellCoordinate[];
  player: PlayerState;
  cells: CellState[][];
  hEdges: EdgeState[][];
  vEdges: EdgeState[][];
  cellIcons: CellIcon[];
  edgeIcons: EdgeIcon[];
};

export type MapClipboardPayload = {
  width: number;
  height: number;
  cells: CellState[][];
  darkZones: CellCoordinate[];
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
