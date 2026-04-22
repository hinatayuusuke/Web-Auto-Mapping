import { MouseEvent, WheelEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore, useSelectedFloor } from '../store/appStore';
import {
  EdgeAxis,
  Facing,
  FloorState,
  MapInteractionTarget,
  ViewportState,
} from '../types/map';

const GRID_PADDING = 0;
const GRID_TOP_PADDING = 0;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const MIN_CELL_SIZE = 4;

type PanState = {
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
};

export function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef<PanState | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const mode = useAppStore((state) => state.mode);
  const viewport = useAppStore((state) => state.viewport);
  const setViewport = useAppStore((state) => state.setViewport);
  const selectedFloor = useSelectedFloor();
  const applyCanvasPrimaryInteraction = useAppStore((state) => state.applyCanvasPrimaryInteraction);
  const applyCanvasSecondaryInteraction = useAppStore(
    (state) => state.applyCanvasSecondaryInteraction,
  );

  const layout = useMemo(() => {
    if (!selectedFloor || size.width === 0 || size.height === 0) {
      return null;
    }

    return calculateLayout({
      width: size.width,
      height: size.height,
      floorWidth: selectedFloor.width,
      floorHeight: selectedFloor.height,
      viewport,
    });
  }, [selectedFloor, size.height, size.width, viewport]);

  useEffect(() => {
    const frame = frameRef.current;

    if (!frame) {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const nextEntry = entries[0];

      if (!nextEntry) {
        return;
      }

      setSize({
        width: nextEntry.contentRect.width,
        height: nextEntry.contentRect.height,
      });
    });

    observer.observe(frame);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || !selectedFloor || !layout) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const ratio = window.devicePixelRatio || 1;
    const cssWidth = size.width;
    const cssHeight = size.height;

    canvas.width = Math.floor(cssWidth * ratio);
    canvas.height = Math.floor(cssHeight * ratio);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, cssWidth, cssHeight);

    drawScene({
      context,
      width: cssWidth,
      height: cssHeight,
      floor: selectedFloor,
      layout,
    });
  }, [layout, selectedFloor, size.height, size.width]);

  const handleMouseDown = (event: MouseEvent<HTMLCanvasElement>) => {
    if (!selectedFloor || !layout) {
      return;
    }

    if (shouldStartPan(event)) {
      event.preventDefault();
      panStateRef.current = {
        offsetX: viewport.offsetX,
        offsetY: viewport.offsetY,
        startX: event.clientX,
        startY: event.clientY,
      };
      return;
    }

    const target = getInteractionTarget(event, selectedFloor, layout);

    if (!target) {
      return;
    }

    if (event.button === 2) {
      event.preventDefault();
      applyCanvasSecondaryInteraction(target);
      return;
    }

    if (event.button === 0) {
      applyCanvasPrimaryInteraction(target);
    }
  };

  const handleMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    const panState = panStateRef.current;

    if (!panState) {
      return;
    }

    event.preventDefault();
    setViewport({
      offsetX: panState.offsetX + (event.clientX - panState.startX),
      offsetY: panState.offsetY + (event.clientY - panState.startY),
    });
  };

  const handleMouseUp = () => {
    panStateRef.current = null;
  };

  const handleWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    if (!selectedFloor || !layout) {
      return;
    }

    event.preventDefault();

    const nextZoom = clampZoom(viewport.zoom + (event.deltaY < 0 ? 0.12 : -0.12));

    if (nextZoom === viewport.zoom) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - rect.left;
    const pointerY = event.clientY - rect.top;
    const cellX = (pointerX - layout.originX) / layout.cellSize;
    const cellY = (pointerY - layout.originY) / layout.cellSize;
    const nextCellSize = calculateCellSize({
      width: size.width,
      height: size.height,
      floorWidth: selectedFloor.width,
      floorHeight: selectedFloor.height,
      zoom: nextZoom,
    });
    const centeredOriginX = Math.floor((size.width - selectedFloor.width * nextCellSize) / 2);
    const centeredOriginY = GRID_TOP_PADDING;

    setViewport({
      zoom: nextZoom,
      offsetX: Math.round(pointerX - centeredOriginX - cellX * nextCellSize),
      offsetY: Math.round(pointerY - centeredOriginY - cellY * nextCellSize),
    });
  };

  return (
    <div
      ref={frameRef}
      className="relative h-full min-h-[360px] overflow-hidden border-x border-b border-[var(--color-border)] bg-[radial-gradient(circle_at_top,_rgba(87,159,255,0.12),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0))]"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        onContextMenu={(event) => event.preventDefault()}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(9,15,24,0.82)] px-2 py-0.5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Canvas Status
          </p>
          <p className="text-xs text-[var(--color-text-soft)]">
            Zoom {Math.round(viewport.zoom * 100)}%
          </p>
        </div>
        <p className="mt-0.5 text-sm leading-5 text-[var(--color-text-soft)]">
          {mode === 'map'
            ? 'Map モードでは左クリックで配置、右クリックで削除します。ホイールでズーム、Alt+drag または middle drag でパンできます。'
            : 'Explore モードでは移動で床と通路が更新されます。ホイールでズーム、Alt+drag または middle drag で表示位置を調整できます。'}
        </p>
      </div>
    </div>
  );
}

type DrawSceneArgs = {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  floor: FloorState;
  layout: GridLayout;
};

function drawScene({ context, width, height, floor, layout }: DrawSceneArgs) {
  context.fillStyle = '#0b1320';
  context.fillRect(0, 0, width, height);

  drawGridBackground(context, layout.originX, layout.originY, layout.gridWidth, layout.gridHeight);
  drawCells(context, floor, layout);
  drawCellGrid(context, floor, layout);
  drawEdges(context, floor, layout, 'horizontal');
  drawEdges(context, floor, layout, 'vertical');
  drawIcons(context, floor, layout);
  drawPlayerFocus(context, floor, layout);
  drawPlayer(context, floor, layout);
}

type LayoutArgs = {
  width: number;
  height: number;
  floorWidth: number;
  floorHeight: number;
  viewport: ViewportState;
};

type CellSizeArgs = {
  width: number;
  height: number;
  floorWidth: number;
  floorHeight: number;
  zoom: number;
};

type GridLayout = {
  cellSize: number;
  gridHeight: number;
  gridWidth: number;
  originX: number;
  originY: number;
};

function calculateLayout({
  width,
  height,
  floorWidth,
  floorHeight,
  viewport,
}: LayoutArgs): GridLayout {
  const cellSize = calculateCellSize({
    width,
    height,
    floorWidth,
    floorHeight,
    zoom: viewport.zoom,
  });
  const gridWidth = floorWidth * cellSize;
  const gridHeight = floorHeight * cellSize;
  const originX = Math.floor((width - gridWidth) / 2 + viewport.offsetX);
  // WHY: 初期表示でマップ本体が fold の下に落ちないよう、縦方向は中央寄せではなく上余白基準にする。
  const originY = GRID_TOP_PADDING + viewport.offsetY;

  return {
    cellSize,
    gridHeight,
    gridWidth,
    originX,
    originY,
  };
}

function calculateCellSize({
  width,
  height,
  floorWidth,
  floorHeight,
  zoom,
}: CellSizeArgs) {
  const drawableWidth = Math.max(width - GRID_PADDING * 2, 120);
  const drawableHeight = Math.max(height - GRID_PADDING * 2, 120);
  const baseCellSize = Math.max(
    18,
    Math.min(drawableWidth / floorWidth, drawableHeight / floorHeight),
  );

  // WHY: zoom 表示と実描画倍率を一致させるため、セルサイズの下限だけを残して連続的に縮小する。
  return Math.max(MIN_CELL_SIZE, baseCellSize * zoom);
}

function drawGridBackground(
  context: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  gridWidth: number,
  gridHeight: number,
) {
  context.fillStyle = 'rgba(255,255,255,0.02)';
  context.fillRect(originX, originY, gridWidth, gridHeight);

  context.strokeStyle = 'rgba(87, 159, 255, 0.34)';
  context.lineWidth = 2;
  context.strokeRect(originX, originY, gridWidth, gridHeight);
}

function drawCells(context: CanvasRenderingContext2D, floor: FloorState, layout: GridLayout) {
  for (let y = 0; y < floor.height; y += 1) {
    for (let x = 0; x < floor.width; x += 1) {
      const left = layout.originX + x * layout.cellSize;
      const top = layout.originY + y * layout.cellSize;
      const state = floor.cells[y][x];

      context.fillStyle = state === 'floor' ? '#16283e' : 'rgba(255,255,255,0.028)';
      context.fillRect(
        left + 1,
        top + 1,
        Math.max(layout.cellSize - 2, 1),
        Math.max(layout.cellSize - 2, 1),
      );

      if (state === 'floor') {
        context.fillStyle = 'rgba(108, 188, 255, 0.06)';
        context.fillRect(
          left + layout.cellSize * 0.2,
          top + layout.cellSize * 0.2,
          layout.cellSize * 0.6,
          layout.cellSize * 0.6,
        );
      }
    }
  }
}

function drawCellGrid(context: CanvasRenderingContext2D, floor: FloorState, layout: GridLayout) {
  context.strokeStyle = 'rgba(214, 222, 235, 0.08)';
  context.lineWidth = 1;

  for (let column = 0; column <= floor.width; column += 1) {
    const x = layout.originX + column * layout.cellSize + 0.5;
    context.beginPath();
    context.moveTo(x, layout.originY);
    context.lineTo(x, layout.originY + layout.gridHeight);
    context.stroke();
  }

  for (let row = 0; row <= floor.height; row += 1) {
    const y = layout.originY + row * layout.cellSize + 0.5;
    context.beginPath();
    context.moveTo(layout.originX, y);
    context.lineTo(layout.originX + layout.gridWidth, y);
    context.stroke();
  }
}

function drawEdges(
  context: CanvasRenderingContext2D,
  floor: FloorState,
  layout: GridLayout,
  axis: EdgeAxis,
) {
  const rows = axis === 'horizontal' ? floor.hEdges : floor.vEdges;
  const openDoorEdges = new Set(
    floor.edgeIcons
      .filter((icon) => icon.kind === 'door' && icon.edge.axis === axis)
      .map((icon) => getEdgeKey(icon.edge.x, icon.edge.y, icon.edge.axis)),
  );
  const closedDoorEdges = new Set(
    floor.edgeIcons
      .filter((icon) => icon.kind === 'closed-door' && icon.edge.axis === axis)
      .map((icon) => getEdgeKey(icon.edge.x, icon.edge.y, icon.edge.axis)),
  );

  for (let y = 0; y < rows.length; y += 1) {
    for (let x = 0; x < rows[y].length; x += 1) {
      const edgeState = rows[y][x];
      const edgeKey = getEdgeKey(x, y, axis);

      if (edgeState === 'unknown') {
        continue;
      }

      if (openDoorEdges.has(edgeKey)) {
        drawOpenDoorEdge(context, layout, axis, x, y);
        continue;
      }

      if (closedDoorEdges.has(edgeKey)) {
        drawClosedDoorEdge(context, layout, axis, x, y);
        continue;
      }

      if (edgeState === 'wall') {
        context.strokeStyle = '#d9e3ef';
        context.lineWidth = Math.max(2, layout.cellSize * 0.12);
      } else {
        context.strokeStyle = 'rgba(108, 188, 255, 0.65)';
        context.lineWidth = Math.max(1.5, layout.cellSize * 0.06);
      }

      context.beginPath();

      if (axis === 'horizontal') {
        const startX = layout.originX + x * layout.cellSize;
        const startY = layout.originY + y * layout.cellSize;
        context.moveTo(startX, startY);
        context.lineTo(startX + layout.cellSize, startY);
      } else {
        const startX = layout.originX + x * layout.cellSize;
        const startY = layout.originY + y * layout.cellSize;
        context.moveTo(startX, startY);
        context.lineTo(startX, startY + layout.cellSize);
      }

      context.stroke();
    }
  }
}

function drawOpenDoorEdge(
  context: CanvasRenderingContext2D,
  layout: GridLayout,
  axis: EdgeAxis,
  x: number,
  y: number,
) {
  const startX = layout.originX + x * layout.cellSize;
  const startY = layout.originY + y * layout.cellSize;
  const gapSize = Math.max(layout.cellSize * 0.28, 2);
  const gapOffset = (layout.cellSize - gapSize) / 2;

  context.strokeStyle = '#4fd08b';
  context.lineWidth = Math.max(2, layout.cellSize * 0.12);
  context.beginPath();

  if (axis === 'horizontal') {
    context.moveTo(startX, startY);
    context.lineTo(startX + gapOffset, startY);
    context.moveTo(startX + gapOffset + gapSize, startY);
    context.lineTo(startX + layout.cellSize, startY);
  } else {
    context.moveTo(startX, startY);
    context.lineTo(startX, startY + gapOffset);
    context.moveTo(startX, startY + gapOffset + gapSize);
    context.lineTo(startX, startY + layout.cellSize);
  }

  context.stroke();
}

function drawClosedDoorEdge(
  context: CanvasRenderingContext2D,
  layout: GridLayout,
  axis: EdgeAxis,
  x: number,
  y: number,
) {
  const startX = layout.originX + x * layout.cellSize;
  const startY = layout.originY + y * layout.cellSize;

  context.strokeStyle = '#d35b68';
  context.lineWidth = Math.max(2, layout.cellSize * 0.12);
  context.beginPath();

  if (axis === 'horizontal') {
    context.moveTo(startX, startY);
    context.lineTo(startX + layout.cellSize, startY);
  } else {
    context.moveTo(startX, startY);
    context.lineTo(startX, startY + layout.cellSize);
  }

  context.stroke();
}

function drawIcons(context: CanvasRenderingContext2D, floor: FloorState, layout: GridLayout) {
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `${Math.max(10, Math.floor(layout.cellSize * 0.34))}px "Segoe UI", sans-serif`;

  for (const icon of floor.cellIcons) {
    const centerX = layout.originX + icon.position.x * layout.cellSize + layout.cellSize / 2;
    const centerY = layout.originY + icon.position.y * layout.cellSize + layout.cellSize / 2;
    const iconRadius = Math.min(layout.cellSize * 0.5 - 1, Math.max(4, layout.cellSize * 0.46));

    context.fillStyle = '#f6d58d';
    context.beginPath();
    context.arc(centerX, centerY, iconRadius, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#0b1320';
    context.fillText(getCellIconGlyph(icon.kind), centerX, centerY + 0.5);
  }

  for (const icon of floor.edgeIcons) {
    if (icon.kind === 'door' || icon.kind === 'closed-door') {
      // WHY: ドア系は境界線そのものとして描いた方が、通路や壁との差分を一目で判別しやすい。
      continue;
    }

    const { x, y, axis } = icon.edge;
    const centerX =
      axis === 'horizontal'
        ? layout.originX + x * layout.cellSize + layout.cellSize / 2
        : layout.originX + x * layout.cellSize;
    const centerY =
      axis === 'horizontal'
        ? layout.originY + y * layout.cellSize
        : layout.originY + y * layout.cellSize + layout.cellSize / 2;

    context.fillStyle = '#95f1c7';
    context.beginPath();
    context.arc(centerX, centerY, Math.max(4, layout.cellSize * 0.14), 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#0b1320';
    context.fillText(getEdgeIconGlyph(icon.kind), centerX, centerY + 0.5);
  }
}

function drawPlayerFocus(context: CanvasRenderingContext2D, floor: FloorState, layout: GridLayout) {
  const currentLeft = layout.originX + floor.player.x * layout.cellSize;
  const currentTop = layout.originY + floor.player.y * layout.cellSize;

  context.strokeStyle = 'rgba(246, 213, 141, 0.88)';
  context.lineWidth = 2;
  context.strokeRect(currentLeft + 2, currentTop + 2, layout.cellSize - 4, layout.cellSize - 4);

  const front = getFrontEdge(floor);

  context.beginPath();
  context.strokeStyle = 'rgba(246, 213, 141, 0.92)';
  context.lineWidth = Math.max(2, layout.cellSize * 0.12);

  if (front.axis === 'horizontal') {
    const startX = layout.originX + front.x * layout.cellSize;
    const startY = layout.originY + front.y * layout.cellSize;
    context.moveTo(startX, startY);
    context.lineTo(startX + layout.cellSize, startY);
  } else {
    const startX = layout.originX + front.x * layout.cellSize;
    const startY = layout.originY + front.y * layout.cellSize;
    context.moveTo(startX, startY);
    context.lineTo(startX, startY + layout.cellSize);
  }

  context.stroke();
}

function drawPlayer(context: CanvasRenderingContext2D, floor: FloorState, layout: GridLayout) {
  const centerX = layout.originX + floor.player.x * layout.cellSize + layout.cellSize / 2;
  const centerY = layout.originY + floor.player.y * layout.cellSize + layout.cellSize / 2;
  const radius = Math.max(6, layout.cellSize * 0.22);

  context.fillStyle = '#6cbcff';
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();

  const arrow = getFacingVector(floor.player.facing);
  const tipX = centerX + arrow.x * radius * 1.45;
  const tipY = centerY + arrow.y * radius * 1.45;
  const sideX = -arrow.y;
  const sideY = arrow.x;

  context.fillStyle = '#f4f9ff';
  context.beginPath();
  context.moveTo(tipX, tipY);
  context.lineTo(centerX + sideX * radius * 0.72, centerY + sideY * radius * 0.72);
  context.lineTo(centerX - sideX * radius * 0.72, centerY - sideY * radius * 0.72);
  context.closePath();
  context.fill();
}

function getInteractionTarget(
  event: MouseEvent<HTMLCanvasElement>,
  floor: FloorState,
  layout: GridLayout,
): MapInteractionTarget | null {
  const rect = event.currentTarget.getBoundingClientRect();
  const localX = event.clientX - rect.left;
  const localY = event.clientY - rect.top;
  const gridX = localX - layout.originX;
  const gridY = localY - layout.originY;

  if (gridX < 0 || gridY < 0 || gridX > layout.gridWidth || gridY > layout.gridHeight) {
    return null;
  }

  const cellX = Math.min(Math.floor(gridX / layout.cellSize), floor.width - 1);
  const cellY = Math.min(Math.floor(gridY / layout.cellSize), floor.height - 1);
  const offsetX = gridX - cellX * layout.cellSize;
  const offsetY = gridY - cellY * layout.cellSize;
  const threshold = Math.max(6, layout.cellSize * 0.18);
  const distances = [
    { side: 'left', value: offsetX },
    { side: 'right', value: layout.cellSize - offsetX },
    { side: 'top', value: offsetY },
    { side: 'bottom', value: layout.cellSize - offsetY },
  ].sort((left, right) => left.value - right.value);

  if (distances[0].value <= threshold) {
    switch (distances[0].side) {
      case 'left':
        return { kind: 'edge', coordinate: { axis: 'vertical', x: cellX, y: cellY } };
      case 'right':
        return { kind: 'edge', coordinate: { axis: 'vertical', x: cellX + 1, y: cellY } };
      case 'top':
        return { kind: 'edge', coordinate: { axis: 'horizontal', x: cellX, y: cellY } };
      case 'bottom':
        return { kind: 'edge', coordinate: { axis: 'horizontal', x: cellX, y: cellY + 1 } };
    }
  }

  return {
    kind: 'cell',
    coordinate: { x: cellX, y: cellY },
  };
}

function getFrontEdge(floor: FloorState) {
  switch (floor.player.facing) {
    case 'north':
      return { axis: 'horizontal' as const, x: floor.player.x, y: floor.player.y };
    case 'east':
      return { axis: 'vertical' as const, x: floor.player.x + 1, y: floor.player.y };
    case 'south':
      return { axis: 'horizontal' as const, x: floor.player.x, y: floor.player.y + 1 };
    case 'west':
      return { axis: 'vertical' as const, x: floor.player.x, y: floor.player.y };
  }
}

function getFacingVector(facing: Facing) {
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

function getEdgeKey(x: number, y: number, axis: EdgeAxis) {
  return `${axis}:${x}:${y}`;
}

function getCellIconGlyph(kind: FloorState['cellIcons'][number]['kind']) {
  switch (kind) {
    case 'chest':
      return 'C';
    case 'marker':
      return 'M';
    case 'pit':
      return 'P';
    case 'stairs':
      return 'S';
  }
}

function getEdgeIconGlyph(kind: FloorState['edgeIcons'][number]['kind']) {
  switch (kind) {
    case 'closed-door':
      return 'C';
    case 'door':
      return 'D';
    case 'one-way':
      return '1';
    case 'secret-door':
      return '?';
  }
}

function shouldStartPan(event: MouseEvent<HTMLCanvasElement>) {
  return event.button === 1 || (event.button === 0 && event.altKey);
}

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))));
}
