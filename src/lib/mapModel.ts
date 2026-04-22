import {
  CellCoordinate,
  CellIcon,
  CellState,
  EdgeCoordinate,
  EdgeIcon,
  EdgeState,
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

export function createDemoFloorState(
  id: string,
  name: string,
  dimensions: GridDimensions,
): FloorState {
  let floor = createEmptyFloorState(id, name, dimensions);

  const roomA = [
    { x: 4, y: 4 },
    { x: 5, y: 4 },
    { x: 6, y: 4 },
    { x: 4, y: 5 },
    { x: 5, y: 5 },
    { x: 6, y: 5 },
    { x: 4, y: 6 },
    { x: 5, y: 6 },
    { x: 6, y: 6 },
  ];
  const corridor = [
    { x: 7, y: 5 },
    { x: 8, y: 5 },
    { x: 9, y: 5 },
    { x: 9, y: 6 },
    { x: 9, y: 7 },
    { x: 9, y: 8 },
  ];
  const roomB = [
    { x: 8, y: 8 },
    { x: 9, y: 8 },
    { x: 10, y: 8 },
    { x: 11, y: 8 },
    { x: 8, y: 9 },
    { x: 9, y: 9 },
    { x: 10, y: 9 },
    { x: 11, y: 9 },
    { x: 8, y: 10 },
    { x: 9, y: 10 },
    { x: 10, y: 10 },
    { x: 11, y: 10 },
  ];

  const knownCells = [...roomA, ...corridor, ...roomB];

  for (const cell of knownCells) {
    floor = updateFloorCellState(floor, cell, 'floor');
  }

  floor = reconcileEdgesFromCells(floor);
  floor = updateFloorPlayer(floor, { x: 9, y: 8, facing: 'east' });
  floor = updateFloorCellIcons(floor, [
    { id: 'chest-01', kind: 'chest', position: { x: 5, y: 5 } },
    { id: 'marker-01', kind: 'marker', position: { x: 9, y: 6 } },
    { id: 'stairs-01', kind: 'stairs', position: { x: 10, y: 9 } },
  ]);
  floor = updateFloorEdgeIcons(floor, [
    { id: 'door-01', kind: 'door', edge: { axis: 'vertical', x: 7, y: 5 } },
    { id: 'secret-01', kind: 'secret-door', edge: { axis: 'vertical', x: 12, y: 9 } },
  ]);

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
