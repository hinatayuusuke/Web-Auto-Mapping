import { expandFloorGrid } from './mapModel';
import {
  CellCoordinate,
  CellIcon,
  CellIconKind,
  CellRect,
  EdgeCoordinate,
  EdgeIcon,
  EdgeIconKind,
  FloorState,
  MapClipboardPayload,
} from '../types/map';

const UNKNOWN_CELL = 'unknown';
const UNKNOWN_EDGE = 'unknown';

export function copyMapRect(
  floor: FloorState,
  rect: CellRect,
): MapClipboardPayload | null {
  const normalizedRect = normalizeCellRect(floor, rect);

  if (!normalizedRect) {
    return null;
  }

  const { x, y, width, height } = normalizedRect;

  return {
    width,
    height,
    cells: floor.cells.slice(y, y + height).map((row) => row.slice(x, x + width)),
    hEdges: floor.hEdges.slice(y, y + height + 1).map((row) => row.slice(x, x + width)),
    vEdges: floor.vEdges.slice(y, y + height).map((row) => row.slice(x, x + width + 1)),
    cellIcons: floor.cellIcons
      .filter((icon) => isCellInRect(icon.position, normalizedRect))
      .map((icon) => {
        const position = {
          x: icon.position.x - x,
          y: icon.position.y - y,
        };

        return {
          ...icon,
          id: createCellIconId(icon.kind, position),
          position,
        };
      }),
    edgeIcons: floor.edgeIcons
      .filter((icon) => isEdgeInRect(icon.edge, normalizedRect))
      .map((icon) => {
        const edge = {
          ...icon.edge,
          x: icon.edge.x - x,
          y: icon.edge.y - y,
        };

        return {
          ...icon,
          id: createEdgeIconId(icon.kind, edge),
          edge,
        };
      }),
  };
}

export function clearMapRect(floor: FloorState, rect: CellRect): FloorState {
  const normalizedRect = normalizeCellRect(floor, rect);

  if (!normalizedRect) {
    return floor;
  }

  const cells = floor.cells.map((row) => [...row]);
  const hEdges = floor.hEdges.map((row) => [...row]);
  const vEdges = floor.vEdges.map((row) => [...row]);
  const { x, y, width, height } = normalizedRect;

  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      cells[row][column] = UNKNOWN_CELL;
    }
  }

  for (let row = y; row <= y + height; row += 1) {
    for (let column = x; column < x + width; column += 1) {
      hEdges[row][column] = UNKNOWN_EDGE;
    }
  }

  for (let row = y; row < y + height; row += 1) {
    for (let column = x; column <= x + width; column += 1) {
      vEdges[row][column] = UNKNOWN_EDGE;
    }
  }

  return {
    ...floor,
    cells,
    hEdges,
    vEdges,
    cellIcons: floor.cellIcons.filter((icon) => !isCellInRect(icon.position, normalizedRect)),
    edgeIcons: floor.edgeIcons.filter((icon) => !isEdgeInRect(icon.edge, normalizedRect)),
  };
}

export function pasteMapClipboard(
  floor: FloorState,
  payload: MapClipboardPayload,
  destination: CellCoordinate,
): FloorState {
  if (
    !isValidPayload(payload) ||
    !Number.isFinite(destination.x) ||
    !Number.isFinite(destination.y) ||
    destination.x < 0 ||
    destination.y < 0
  ) {
    return floor;
  }

  const destinationX = Math.floor(destination.x);
  const destinationY = Math.floor(destination.y);
  const rightOverflow = destinationX + payload.width - floor.width;
  const downOverflow = destinationY + payload.height - floor.height;
  let nextFloor = expandFloorGrid(floor, {
    right: Math.max(0, rightOverflow),
    down: Math.max(0, downOverflow),
  });
  const destinationRect: CellRect = {
    x: destinationX,
    y: destinationY,
    width: payload.width,
    height: payload.height,
  };
  const cells = nextFloor.cells.map((row) => [...row]);
  const hEdges = nextFloor.hEdges.map((row) => [...row]);
  const vEdges = nextFloor.vEdges.map((row) => [...row]);

  for (let row = 0; row < payload.height; row += 1) {
    for (let column = 0; column < payload.width; column += 1) {
      cells[destinationY + row][destinationX + column] = payload.cells[row][column];
    }
  }

  for (let row = 0; row <= payload.height; row += 1) {
    for (let column = 0; column < payload.width; column += 1) {
      hEdges[destinationY + row][destinationX + column] = payload.hEdges[row][column];
    }
  }

  for (let row = 0; row < payload.height; row += 1) {
    for (let column = 0; column <= payload.width; column += 1) {
      vEdges[destinationY + row][destinationX + column] = payload.vEdges[row][column];
    }
  }

  nextFloor = {
    ...nextFloor,
    cells,
    hEdges,
    vEdges,
    cellIcons: nextFloor.cellIcons.filter((icon) => !isCellInRect(icon.position, destinationRect)),
    edgeIcons: nextFloor.edgeIcons.filter((icon) => !isEdgeInRect(icon.edge, destinationRect)),
  };

  return {
    ...nextFloor,
    cellIcons: [
      ...nextFloor.cellIcons,
      ...payload.cellIcons.map((icon): CellIcon => {
        const position = {
          x: destinationX + icon.position.x,
          y: destinationY + icon.position.y,
        };

        return {
          ...icon,
          id: createCellIconId(icon.kind, position),
          position,
        };
      }),
    ],
    edgeIcons: [
      ...nextFloor.edgeIcons,
      ...payload.edgeIcons.map((icon): EdgeIcon => {
        const edge = {
          ...icon.edge,
          x: destinationX + icon.edge.x,
          y: destinationY + icon.edge.y,
        };

        return {
          ...icon,
          id: createEdgeIconId(icon.kind, edge),
          edge,
        };
      }),
    ],
  };
}

function normalizeCellRect(floor: FloorState, rect: CellRect): CellRect | null {
  const x = Math.floor(rect.x);
  const y = Math.floor(rect.y);
  const width = Math.floor(rect.width);
  const height = Math.floor(rect.height);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0 ||
    x + width > floor.width ||
    y + height > floor.height
  ) {
    return null;
  }

  return { x, y, width, height };
}

function isValidPayload(payload: MapClipboardPayload) {
  if (payload.width <= 0 || payload.height <= 0) {
    return false;
  }

  return (
    payload.cells.length === payload.height &&
    payload.cells.every((row) => row.length === payload.width) &&
    payload.hEdges.length === payload.height + 1 &&
    payload.hEdges.every((row) => row.length === payload.width) &&
    payload.vEdges.length === payload.height &&
    payload.vEdges.every((row) => row.length === payload.width + 1)
  );
}

function isCellInRect(coordinate: CellCoordinate, rect: CellRect) {
  return (
    coordinate.x >= rect.x &&
    coordinate.x < rect.x + rect.width &&
    coordinate.y >= rect.y &&
    coordinate.y < rect.y + rect.height
  );
}

function isEdgeInRect(edge: EdgeCoordinate, rect: CellRect) {
  if (edge.axis === 'horizontal') {
    return (
      edge.x >= rect.x &&
      edge.x < rect.x + rect.width &&
      edge.y >= rect.y &&
      edge.y <= rect.y + rect.height
    );
  }

  return (
    edge.x >= rect.x &&
    edge.x <= rect.x + rect.width &&
    edge.y >= rect.y &&
    edge.y < rect.y + rect.height
  );
}

function createCellIconId(kind: CellIconKind, position: CellCoordinate): string {
  return `cell-${kind}-${position.x}-${position.y}`;
}

function createEdgeIconId(kind: EdgeIconKind, edge: EdgeCoordinate): string {
  return `edge-${kind}-${edge.axis}-${edge.x}-${edge.y}`;
}
