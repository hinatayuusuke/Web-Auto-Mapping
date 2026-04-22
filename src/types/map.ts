export type AppMode = 'explore' | 'map';

export type AutoMappingLevel = 'off' | 'basic' | 'corridor';

export type Facing = 'north' | 'east' | 'south' | 'west';

export type CellState = 'unknown' | 'floor';

export type EdgeState = 'unknown' | 'open' | 'wall';

export type CellIconKind = 'stairs' | 'pit' | 'chest' | 'marker';

export type EdgeIconKind = 'door' | 'secret-door' | 'one-way';

export type GridDimensions = {
  width: number;
  height: number;
};

export type CellCoordinate = {
  x: number;
  y: number;
};

export type PlayerState = {
  x: number;
  y: number;
  facing: Facing;
};

export type FloorState = GridDimensions & {
  id: string;
  name: string;
  player: PlayerState;
};

export type ViewportState = {
  zoom: number;
  offsetX: number;
  offsetY: number;
};
