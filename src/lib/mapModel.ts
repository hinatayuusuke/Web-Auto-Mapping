import {
  AutoMappingLevel,
  CellCoordinate,
  CellIcon,
  CellIconKind,
  CellState,
  EdgeCoordinate,
  EdgeEditIntent,
  EdgeIcon,
  EdgeIconKind,
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

export function expandFloorGrid(
  floor: FloorState,
  expansion: {
    right?: number;
    down?: number;
  },
): FloorState {
  const right = Math.max(0, Math.floor(expansion.right ?? 0));
  const down = Math.max(0, Math.floor(expansion.down ?? 0));

  if (right === 0 && down === 0) {
    return floor;
  }

  const width = floor.width + right;
  const height = floor.height + down;

  return {
    ...floor,
    width,
    height,
    cells: [
      ...floor.cells.map((row) => [...row, ...createRow(right, UNKNOWN_CELL)]),
      ...Array.from({ length: down }, () => createRow(width, UNKNOWN_CELL)),
    ],
    // WHY: 右 / 下方向拡張では既存座標をずらさず、末尾だけ unknown を足して履歴や保存データの整合を保つ。
    hEdges: [
      ...floor.hEdges.map((row) => [...row, ...createRow(right, UNKNOWN_EDGE)]),
      ...Array.from({ length: down }, () => createRow(width, UNKNOWN_EDGE)),
    ],
    vEdges: [
      ...floor.vEdges.map((row) => [...row, ...createRow(right, UNKNOWN_EDGE)]),
      ...Array.from({ length: down }, () => createRow(width + 1, UNKNOWN_EDGE)),
    ],
  };
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

  let nextFloor: FloorState = {
    ...floor,
    cells,
  };

  if (nextState === 'unknown') {
    nextFloor = removeCellIconAt(nextFloor, coordinate);
  }

  return nextFloor;
}

export function updateFloorEdgeState(
  floor: FloorState,
  coordinate: EdgeCoordinate,
  nextState: EdgeState,
): FloorState {
  if (!isEdgeInBounds(floor, coordinate)) {
    return floor;
  }

  let nextFloor: FloorState;

  if (coordinate.axis === 'horizontal') {
    const hEdges = floor.hEdges.map((row, rowIndex) =>
      rowIndex === coordinate.y
        ? row.map((value, columnIndex) => (columnIndex === coordinate.x ? nextState : value))
        : [...row],
    );

    nextFloor = {
      ...floor,
      hEdges,
    };
  } else {
    const vEdges = floor.vEdges.map((row, rowIndex) =>
      rowIndex === coordinate.y
        ? row.map((value, columnIndex) => (columnIndex === coordinate.x ? nextState : value))
        : [...row],
    );

    nextFloor = {
      ...floor,
      vEdges,
    };
  }

  if (nextState !== 'open') {
    nextFloor = removeEdgeIconsAt(nextFloor, coordinate);
  }

  return nextFloor;
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

export function movePlayerInMapMode(floor: FloorState, facing: Facing): FloorState {
  const origin = {
    x: floor.player.x,
    y: floor.player.y,
  };
  const destination = getCoordinateInDirection(origin, facing);
  const edge = getEdgeBetweenCells(origin, destination);
  let nextFloor = updateFloorPlayer(floor, { facing });

  if (!isCellInBounds(nextFloor, destination)) {
    return nextFloor;
  }

  if (getEdgeState(nextFloor, edge) === 'wall') {
    return nextFloor;
  }

  if (nextFloor.cells[destination.y][destination.x] !== 'floor') {
    return nextFloor;
  }

  return updateFloorPlayer(nextFloor, {
    x: destination.x,
    y: destination.y,
  });
}

export function applyForwardEdgeEdit(
  floor: FloorState,
  intent: EdgeEditIntent,
): FloorState {
  return applyEdgeEditIntent(floor, getFrontEdgeCoordinate(floor), intent);
}

export function applyEdgeEditIntent(
  floor: FloorState,
  coordinate: EdgeCoordinate,
  intent: EdgeEditIntent,
): FloorState {
  switch (intent) {
    case 'wall':
      return updateFloorEdgeState(floor, coordinate, 'wall');
    case 'open':
      return removeEdgeIconsAt(updateFloorEdgeState(floor, coordinate, 'open'), coordinate);
    case 'unknown':
      return removeEdgeIconsAt(updateFloorEdgeState(floor, coordinate, 'unknown'), coordinate);
    case 'door':
      return upsertEdgeIconAt(updateFloorEdgeState(floor, coordinate, 'open'), coordinate, 'door');
  }
}

export function placeCellIconAt(
  floor: FloorState,
  coordinate: CellCoordinate,
  kind: CellIconKind,
): FloorState {
  if (!isCellInBounds(floor, coordinate)) {
    return floor;
  }

  const nextFloor = updateFloorCellState(floor, coordinate, 'floor');

  return {
    ...nextFloor,
    cellIcons: [
      ...nextFloor.cellIcons.filter((icon) => !isSameCell(icon.position, coordinate)),
      {
        id: `cell-${kind}-${coordinate.x}-${coordinate.y}`,
        kind,
        position: coordinate,
      },
    ],
  };
}

export function removeCellIconAt(
  floor: FloorState,
  coordinate: CellCoordinate,
): FloorState {
  return {
    ...floor,
    cellIcons: floor.cellIcons.filter((icon) => !isSameCell(icon.position, coordinate)),
  };
}

export function placeSelectedCellIconAtPlayer(
  floor: FloorState,
  kind: CellIconKind,
): FloorState {
  return placeCellIconAt(floor, { x: floor.player.x, y: floor.player.y }, kind);
}

export function placeSelectedCellIconInFront(
  floor: FloorState,
  kind: CellIconKind,
): FloorState {
  return placeCellIconAt(
    floor,
    getCoordinateInDirection(
      {
        x: floor.player.x,
        y: floor.player.y,
      },
      floor.player.facing,
    ),
    kind,
  );
}

export function applyCanvasPrimaryEdit(
  floor: FloorState,
  tool: string,
  selectedCellIconKind: CellIconKind,
  target:
    | {
        kind: 'cell';
        coordinate: CellCoordinate;
      }
    | {
        kind: 'edge';
        coordinate: EdgeCoordinate;
      },
): FloorState {
  if (target.kind === 'cell') {
    if (tool === 'cell-floor') {
      return updateFloorCellState(floor, target.coordinate, 'floor');
    }

    if (tool === 'cell-unknown') {
      return updateFloorCellState(floor, target.coordinate, 'unknown');
    }

    if (tool === 'cell-icon') {
      return placeCellIconAt(floor, target.coordinate, selectedCellIconKind);
    }

    return floor;
  }

  switch (tool) {
    case 'edge-wall':
      return applyEdgeEditIntent(floor, target.coordinate, 'wall');
    case 'edge-door':
      return applyEdgeEditIntent(floor, target.coordinate, 'door');
    case 'edge-open':
      return applyEdgeEditIntent(floor, target.coordinate, 'open');
    case 'edge-unknown':
      return applyEdgeEditIntent(floor, target.coordinate, 'unknown');
    default:
      return floor;
  }
}

export function applyCanvasSecondaryEdit(
  floor: FloorState,
  target:
    | {
        kind: 'cell';
        coordinate: CellCoordinate;
      }
    | {
        kind: 'edge';
        coordinate: EdgeCoordinate;
      },
): FloorState {
  if (target.kind === 'cell') {
    return removeCellIconAt(updateFloorCellState(floor, target.coordinate, 'unknown'), target.coordinate);
  }

  return applyEdgeEditIntent(floor, target.coordinate, 'unknown');
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

export function getFrontEdgeCoordinate(floor: FloorState): EdgeCoordinate {
  switch (floor.player.facing) {
    case 'north':
      return { axis: 'horizontal', x: floor.player.x, y: floor.player.y };
    case 'east':
      return { axis: 'vertical', x: floor.player.x + 1, y: floor.player.y };
    case 'south':
      return { axis: 'horizontal', x: floor.player.x, y: floor.player.y + 1 };
    case 'west':
      return { axis: 'vertical', x: floor.player.x, y: floor.player.y };
  }
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

function upsertEdgeIconAt(
  floor: FloorState,
  coordinate: EdgeCoordinate,
  kind: EdgeIconKind,
): FloorState {
  return {
    ...floor,
    edgeIcons: [
      ...floor.edgeIcons.filter((icon) => !isSameEdge(icon.edge, coordinate)),
      {
        id: `edge-${kind}-${coordinate.axis}-${coordinate.x}-${coordinate.y}`,
        kind,
        edge: coordinate,
      },
    ],
  };
}

function removeEdgeIconsAt(
  floor: FloorState,
  coordinate: EdgeCoordinate,
): FloorState {
  return {
    ...floor,
    edgeIcons: floor.edgeIcons.filter((icon) => !isSameEdge(icon.edge, coordinate)),
  };
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

function createRow<T>(width: number, initialValue: T): T[] {
  return Array.from({ length: width }, () => initialValue);
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

function isSameCell(left: CellCoordinate, right: CellCoordinate): boolean {
  return left.x === right.x && left.y === right.y;
}

function isSameEdge(left: EdgeCoordinate, right: EdgeCoordinate): boolean {
  return left.axis === right.axis && left.x === right.x && left.y === right.y;
}
