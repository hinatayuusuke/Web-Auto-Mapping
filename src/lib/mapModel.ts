import {
  AutoMappingLevel,
  CellCoordinate,
  CellIcon,
  CellState,
  EdgeCoordinate,
  EdgeIcon,
  EdgeState,
  Facing,
  FloorState,
  FloorStats,
  GridDimensions,
  PlayerState,
} from '../types/map';

const UNKNOWN_CELL: CellState = 'unknown';
const UNKNOWN_EDGE: EdgeState = 'unknown';

export function createEmptyFloorState(
  id: string,
  name: string,
  dimensions: GridDimensions,
): FloorState {
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
    cells: createMatrix(dimensions.height, dimensions.width, UNKNOWN_CELL),
    // WHY: 壁はセル内部ではなく境界線に乗るため、水平・垂直を別配列で持つ。
    hEdges: createMatrix(dimensions.height + 1, dimensions.width, UNKNOWN_EDGE),
    vEdges: createMatrix(dimensions.height, dimensions.width + 1, UNKNOWN_EDGE),
    cellIcons: [],
    edgeIcons: [],
  };
}

export function createExploreSeedFloorState(
  id: string,
  name: string,
  dimensions: GridDimensions,
  autoMapping: AutoMappingLevel,
): FloorState {
  let floor = createEmptyFloorState(id, name, dimensions);
  const start = {
    x: floor.player.x,
    y: floor.player.y,
  };

  floor = updateFloorCellState(floor, start, 'floor');

  if (autoMapping !== 'off') {
    floor = applyBasicAutoMapping(floor, start);
  }

  return floor;
}

export function updateFloorCellState(
  floor: FloorState,
  coordinate: CellCoordinate,
  nextState: CellState,
): FloorState {
  if (!isCellInBounds(floor, coordinate)) {
    return floor;
  }

  const cells = floor.cells.map((row, rowIndex) =>
    rowIndex === coordinate.y
      ? row.map((value, columnIndex) => (columnIndex === coordinate.x ? nextState : value))
      : [...row],
  );

  return {
    ...floor,
    cells,
  };
}

export function updateFloorEdgeState(
  floor: FloorState,
  coordinate: EdgeCoordinate,
  nextState: EdgeState,
): FloorState {
  if (!isEdgeInBounds(floor, coordinate)) {
    return floor;
  }

  if (coordinate.axis === 'horizontal') {
    const hEdges = floor.hEdges.map((row, rowIndex) =>
      rowIndex === coordinate.y
        ? row.map((value, columnIndex) => (columnIndex === coordinate.x ? nextState : value))
        : [...row],
    );

    return {
      ...floor,
      hEdges,
    };
  }

  const vEdges = floor.vEdges.map((row, rowIndex) =>
    rowIndex === coordinate.y
      ? row.map((value, columnIndex) => (columnIndex === coordinate.x ? nextState : value))
      : [...row],
  );

  return {
    ...floor,
    vEdges,
  };
}

export function updateFloorPlayer(
  floor: FloorState,
  patch: Partial<PlayerState>,
): FloorState {
  const nextX = patch.x ?? floor.player.x;
  const nextY = patch.y ?? floor.player.y;

  if (!isCellInBounds(floor, { x: nextX, y: nextY })) {
    return floor;
  }

  return {
    ...floor,
    player: {
      ...floor.player,
      ...patch,
      x: nextX,
      y: nextY,
    },
  };
}

export function updateFloorCellIcons(floor: FloorState, icons: CellIcon[]): FloorState {
  return {
    ...floor,
    cellIcons: icons.filter((icon) => isCellInBounds(floor, icon.position)),
  };
}

export function updateFloorEdgeIcons(floor: FloorState, icons: EdgeIcon[]): FloorState {
  return {
    ...floor,
    edgeIcons: icons.filter((icon) => isEdgeInBounds(floor, icon.edge)),
  };
}

export function movePlayerInExploreMode(
  floor: FloorState,
  facing: Facing,
  autoMapping: AutoMappingLevel,
): FloorState {
  const origin = {
    x: floor.player.x,
    y: floor.player.y,
  };
  const nextPosition = getCoordinateInDirection(origin, facing);
  let nextFloor = updateFloorPlayer(floor, { facing });

  if (!isCellInBounds(nextFloor, nextPosition)) {
    return nextFloor;
  }

  nextFloor = updateFloorCellState(nextFloor, origin, 'floor');
  nextFloor = updateFloorCellState(nextFloor, nextPosition, 'floor');
  nextFloor = updateFloorEdgeState(nextFloor, getEdgeBetweenCells(origin, nextPosition), 'open');
  nextFloor = updateFloorPlayer(nextFloor, {
    x: nextPosition.x,
    y: nextPosition.y,
    facing,
  });

  if (autoMapping === 'basic' || autoMapping === 'corridor') {
    nextFloor = applyBasicAutoMapping(nextFloor, nextPosition);
  }

  if (autoMapping === 'corridor') {
    nextFloor = applyCorridorAutoMapping(nextFloor, origin, nextPosition);
  }

  return nextFloor;
}

export function reconcileEdgesFromCells(floor: FloorState): FloorState {
  let nextFloor = {
    ...floor,
    hEdges: createMatrix(floor.height + 1, floor.width, UNKNOWN_EDGE),
    vEdges: createMatrix(floor.height, floor.width + 1, UNKNOWN_EDGE),
  };

  for (let y = 0; y < floor.height; y += 1) {
    for (let x = 0; x < floor.width; x += 1) {
      if (floor.cells[y][x] !== 'floor') {
        continue;
      }

      const left = x > 0 ? floor.cells[y][x - 1] : null;
      const right = x < floor.width - 1 ? floor.cells[y][x + 1] : null;
      const top = y > 0 ? floor.cells[y - 1][x] : null;
      const bottom = y < floor.height - 1 ? floor.cells[y + 1][x] : null;

      nextFloor = updateFloorEdgeState(
        nextFloor,
        { axis: 'vertical', x, y },
        left === 'floor' ? 'open' : 'wall',
      );
      nextFloor = updateFloorEdgeState(
        nextFloor,
        { axis: 'vertical', x: x + 1, y },
        right === 'floor' ? 'open' : 'wall',
      );
      nextFloor = updateFloorEdgeState(
        nextFloor,
        { axis: 'horizontal', x, y },
        top === 'floor' ? 'open' : 'wall',
      );
      nextFloor = updateFloorEdgeState(
        nextFloor,
        { axis: 'horizontal', x, y: y + 1 },
        bottom === 'floor' ? 'open' : 'wall',
      );
    }
  }

  return nextFloor;
}

export function getFloorStats(floor: FloorState): FloorStats {
  return {
    knownCells: floor.cells.flat().filter((state) => state === 'floor').length,
    openEdges: [...floor.hEdges.flat(), ...floor.vEdges.flat()].filter((state) => state === 'open')
      .length,
    wallEdges: [...floor.hEdges.flat(), ...floor.vEdges.flat()].filter((state) => state === 'wall')
      .length,
    cellIcons: floor.cellIcons.length,
    edgeIcons: floor.edgeIcons.length,
  };
}

export function getCoordinateInDirection(
  coordinate: CellCoordinate,
  facing: Facing,
): CellCoordinate {
  const vector = getVectorForFacing(facing);

  return {
    x: coordinate.x + vector.x,
    y: coordinate.y + vector.y,
  };
}

function applyBasicAutoMapping(floor: FloorState, coordinate: CellCoordinate): FloorState {
  let nextFloor = floor;

  for (const edge of getEdgesAroundCell(coordinate)) {
    nextFloor = updateUnknownEdge(nextFloor, edge, 'wall');
  }

  return nextFloor;
}

function applyCorridorAutoMapping(
  floor: FloorState,
  origin: CellCoordinate,
  destination: CellCoordinate,
): FloorState {
  let nextFloor = floor;

  for (const edge of getCorridorSideEdges(origin, destination)) {
    nextFloor = updateUnknownEdge(nextFloor, edge, 'wall');
  }

  return nextFloor;
}

function updateUnknownEdge(
  floor: FloorState,
  coordinate: EdgeCoordinate,
  nextState: EdgeState,
): FloorState {
  const currentState = getEdgeState(floor, coordinate);

  if (currentState !== 'unknown') {
    return floor;
  }

  return updateFloorEdgeState(floor, coordinate, nextState);
}

function getEdgesAroundCell(coordinate: CellCoordinate): EdgeCoordinate[] {
  return [
    { axis: 'horizontal', x: coordinate.x, y: coordinate.y },
    { axis: 'horizontal', x: coordinate.x, y: coordinate.y + 1 },
    { axis: 'vertical', x: coordinate.x, y: coordinate.y },
    { axis: 'vertical', x: coordinate.x + 1, y: coordinate.y },
  ];
}

function getCorridorSideEdges(
  origin: CellCoordinate,
  destination: CellCoordinate,
): EdgeCoordinate[] {
  const horizontalMove = destination.x !== origin.x;

  if (horizontalMove) {
    return [
      { axis: 'horizontal', x: origin.x, y: origin.y },
      { axis: 'horizontal', x: origin.x, y: origin.y + 1 },
      { axis: 'horizontal', x: destination.x, y: destination.y },
      { axis: 'horizontal', x: destination.x, y: destination.y + 1 },
    ];
  }

  return [
    { axis: 'vertical', x: origin.x, y: origin.y },
    { axis: 'vertical', x: origin.x + 1, y: origin.y },
    { axis: 'vertical', x: destination.x, y: destination.y },
    { axis: 'vertical', x: destination.x + 1, y: destination.y },
  ];
}

function getEdgeBetweenCells(from: CellCoordinate, to: CellCoordinate): EdgeCoordinate {
  if (from.x !== to.x) {
    return {
      axis: 'vertical',
      x: Math.max(from.x, to.x),
      y: from.y,
    };
  }

  return {
    axis: 'horizontal',
    x: from.x,
    y: Math.max(from.y, to.y),
  };
}

function getEdgeState(floor: FloorState, coordinate: EdgeCoordinate): EdgeState | null {
  if (!isEdgeInBounds(floor, coordinate)) {
    return null;
  }

  return coordinate.axis === 'horizontal'
    ? floor.hEdges[coordinate.y][coordinate.x]
    : floor.vEdges[coordinate.y][coordinate.x];
}

function getVectorForFacing(facing: Facing) {
  switch (facing) {
    case 'north':
      return { x: 0, y: -1 };
    case 'east':
      return { x: 1, y: 0 };
    case 'south':
      return { x: 0, y: 1 };
    case 'west':
      return { x: -1, y: 0 };
  }
}

function createMatrix<T>(height: number, width: number, initialValue: T): T[][] {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => initialValue));
}

function isCellInBounds(floor: FloorState, coordinate: CellCoordinate): boolean {
  return (
    coordinate.x >= 0 &&
    coordinate.x < floor.width &&
    coordinate.y >= 0 &&
    coordinate.y < floor.height
  );
}

function isEdgeInBounds(floor: FloorState, coordinate: EdgeCoordinate): boolean {
  if (coordinate.axis === 'horizontal') {
    return (
      coordinate.x >= 0 &&
      coordinate.x < floor.width &&
      coordinate.y >= 0 &&
      coordinate.y <= floor.height
    );
  }

  return (
    coordinate.x >= 0 &&
    coordinate.x <= floor.width &&
    coordinate.y >= 0 &&
    coordinate.y < floor.height
  );
}
