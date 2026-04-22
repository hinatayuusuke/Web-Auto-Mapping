import { useEffect, useRef, useState } from 'react';
import { useSelectedFloor, useAppStore } from '../store/appStore';
import { EdgeAxis, Facing, FloorState, ViewportState } from '../types/map';

const GRID_PADDING = 24;

export function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const selectedFloor = useSelectedFloor();
  const viewport = useAppStore((state) => state.viewport);

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

    if (!canvas || !selectedFloor || size.width === 0 || size.height === 0) {
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
      viewport,
    });
  }, [selectedFloor, size.height, size.width, viewport]);

  return (
    <div
      ref={frameRef}
      className="relative h-full min-h-[360px] overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[radial-gradient(circle_at_top,_rgba(87,159,255,0.12),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0))]"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
      />

      <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(9,15,24,0.78)] px-4 py-3 backdrop-blur">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">Canvas Status</p>
        <p className="mt-1 text-sm leading-6 text-[var(--color-text-soft)]">
          Explore モードでは移動に応じて床と通路が即時更新されます。Map モードの衝突判定は次フェーズで追加します。
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
  viewport: ViewportState;
};

function drawScene({ context, width, height, floor, viewport }: DrawSceneArgs) {
  context.fillStyle = '#0b1320';
  context.fillRect(0, 0, width, height);

  const layout = calculateLayout({
    width,
    height,
    floorWidth: floor.width,
    floorHeight: floor.height,
    viewport,
  });

  drawGridBackground(context, layout.originX, layout.originY, layout.gridWidth, layout.gridHeight);
  drawCells(context, floor, layout);
  drawCellGrid(context, floor, layout);
  drawEdges(context, floor, layout, 'horizontal');
  drawEdges(context, floor, layout, 'vertical');
  drawIcons(context, floor, layout);
  drawPlayer(context, floor, layout);
}

type LayoutArgs = {
  width: number;
  height: number;
  floorWidth: number;
  floorHeight: number;
  viewport: ViewportState;
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
  const drawableWidth = Math.max(width - GRID_PADDING * 2, 120);
  const drawableHeight = Math.max(height - GRID_PADDING * 2, 120);
  const baseCellSize = Math.max(
    18,
    Math.floor(Math.min(drawableWidth / floorWidth, drawableHeight / floorHeight)),
  );
  const cellSize = Math.max(14, Math.floor(baseCellSize * viewport.zoom));
  const gridWidth = floorWidth * cellSize;
  const gridHeight = floorHeight * cellSize;
  const originX = Math.floor((width - gridWidth) / 2 + viewport.offsetX);
  const originY = Math.floor((height - gridHeight) / 2 + viewport.offsetY);

  return {
    cellSize,
    gridHeight,
    gridWidth,
    originX,
    originY,
  };
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

  for (let y = 0; y < rows.length; y += 1) {
    for (let x = 0; x < rows[y].length; x += 1) {
      const edgeState = rows[y][x];

      if (edgeState === 'unknown') {
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

function drawIcons(context: CanvasRenderingContext2D, floor: FloorState, layout: GridLayout) {
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `${Math.max(10, Math.floor(layout.cellSize * 0.34))}px "Segoe UI", sans-serif`;

  for (const icon of floor.cellIcons) {
    const centerX = layout.originX + icon.position.x * layout.cellSize + layout.cellSize / 2;
    const centerY = layout.originY + icon.position.y * layout.cellSize + layout.cellSize / 2;

    context.fillStyle = '#f6d58d';
    context.beginPath();
    context.arc(centerX, centerY, Math.max(4, layout.cellSize * 0.16), 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#0b1320';
    context.fillText(getCellIconGlyph(icon.kind), centerX, centerY + 0.5);
  }

  for (const icon of floor.edgeIcons) {
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
    case 'door':
      return 'D';
    case 'one-way':
      return '1';
    case 'secret-door':
      return '?';
  }
}
