import { MouseEvent, WheelEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useAppStore, useSelectedFloor } from '../store/appStore';
import {
  CellCoordinate,
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
  const clickTimeoutRef = useRef<number | null>(null);
  const editorInputRef = useRef<HTMLInputElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const panStateRef = useRef<PanState | null>(null);
  const [editingMarkerCoordinate, setEditingMarkerCoordinate] = useState<CellCoordinate | null>(
    null,
  );
  const [hoveredMarkerCoordinate, setHoveredMarkerCoordinate] = useState<CellCoordinate | null>(
    null,
  );
  const [messageDraft, setMessageDraft] = useState('');
  const [size, setSize] = useState({ width: 0, height: 0 });
  const mode = useAppStore((state) => state.mode);
  const viewport = useAppStore((state) => state.viewport);
  const setViewport = useAppStore((state) => state.setViewport);
  const setSelectedMarkerMessage = useAppStore((state) => state.setSelectedMarkerMessage);
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

  const editingMarker = useMemo(() => {
    if (!selectedFloor || !editingMarkerCoordinate) {
      return null;
    }

    return getMarkerIconAtCoordinate(selectedFloor, editingMarkerCoordinate);
  }, [editingMarkerCoordinate, selectedFloor]);

  const hoveredMarker = useMemo(() => {
    if (!selectedFloor || !hoveredMarkerCoordinate) {
      return null;
    }

    return getMarkerIconAtCoordinate(selectedFloor, hoveredMarkerCoordinate);
  }, [hoveredMarkerCoordinate, selectedFloor]);

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
    if (!editingMarkerCoordinate) {
      return;
    }

    if (!editingMarker) {
      setEditingMarkerCoordinate(null);
      setMessageDraft('');
    }
  }, [editingMarker, editingMarkerCoordinate]);

  useEffect(() => {
    if (!editingMarkerCoordinate) {
      return;
    }

    editorInputRef.current?.focus();
    editorInputRef.current?.select();
  }, [editingMarkerCoordinate]);

  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current !== null) {
        window.clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const frame = frameRef.current;

    if (!frame) {
      return undefined;
    }

    // WHY: 縦長モードでは body 全体がスクロール可能になるため、Canvas 上のホイールは
    // React の onWheel だけでなくネイティブ側でも止めて page scroll へ漏れないようにする。
    const preventPageScroll = (event: globalThis.WheelEvent) => {
      event.preventDefault();
    };

    frame.addEventListener('wheel', preventPageScroll, { passive: false });

    return () => {
      frame.removeEventListener('wheel', preventPageScroll);
    };
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
    const marker = getMarkerAtCanvasPoint(
      event.clientX - event.currentTarget.getBoundingClientRect().left,
      event.clientY - event.currentTarget.getBoundingClientRect().top,
      selectedFloor,
      layout,
    );

    if (!target) {
      return;
    }

    if (event.button === 2) {
      event.preventDefault();
      applyCanvasSecondaryInteraction(target);
      return;
    }

    if (event.button === 0) {
      if (mode === 'map' && marker) {
        if (clickTimeoutRef.current !== null) {
          window.clearTimeout(clickTimeoutRef.current);
          clickTimeoutRef.current = null;
        }

        if (event.detail > 1) {
          event.preventDefault();
          setEditingMarkerCoordinate(marker.position);
          setMessageDraft(marker.message ?? '');
          return;
        }

        clickTimeoutRef.current = window.setTimeout(() => {
          applyCanvasPrimaryInteraction(target);
          clickTimeoutRef.current = null;
        }, 220);
        return;
      }

      applyCanvasPrimaryInteraction(target);
    }
  };

  const handleMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    if (selectedFloor && layout) {
      const rect = event.currentTarget.getBoundingClientRect();
      const marker = getMarkerAtCanvasPoint(
        event.clientX - rect.left,
        event.clientY - rect.top,
        selectedFloor,
        layout,
      );

      setHoveredMarkerCoordinate(marker?.position ?? null);
    }

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

  const handleMouseLeave = () => {
    handleMouseUp();
    setHoveredMarkerCoordinate(null);
  };

  const handleWheel = (event: WheelEvent<HTMLCanvasElement>) => {
    if (!selectedFloor || !layout) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

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

  const handleMarkerMessageSubmit = () => {
    if (!editingMarker) {
      return;
    }

    setSelectedMarkerMessage(editingMarker.position, messageDraft);
    setEditingMarkerCoordinate(null);
  };

  return (
    <div
      ref={frameRef}
      className="relative h-full min-h-[360px] overflow-hidden overscroll-contain border-x border-b border-[var(--color-border)] bg-[radial-gradient(circle_at_top,_rgba(87,159,255,0.12),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0))]"
    >
      {hoveredMarker?.message && !editingMarkerCoordinate ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(9,15,24,0.84)] px-3 py-1.5 backdrop-blur">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Marker Message
          </p>
          <p className="mt-0.5 truncate text-sm leading-5 text-[var(--color-text-strong)]">
            {hoveredMarker.message}
          </p>
        </div>
      ) : null}

      {editingMarker ? (
        <form
          className="absolute inset-x-3 top-3 z-20 rounded-2xl border border-[var(--color-border-strong)] bg-[rgba(8,17,28,0.95)] p-3 shadow-[0_18px_48px_rgba(0,0,0,0.32)]"
          onSubmit={(event) => {
            event.preventDefault();
            handleMarkerMessageSubmit();
          }}
        >
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Marker Message
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              ref={editorInputRef}
              className="min-w-0 flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-strong)] outline-none ring-0 transition focus:border-[var(--color-border-strong)]"
              value={messageDraft}
              maxLength={120}
              onChange={(event) => setMessageDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  event.preventDefault();
                  setEditingMarkerCoordinate(null);
                }
              }}
              placeholder="Marker message"
            />
            <button
              type="submit"
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text-soft)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-strong)]"
            >
              Save
            </button>
            <button
              type="button"
              className="rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] px-4 py-2.5 text-sm text-[var(--color-text-soft)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-strong)]"
              onClick={() => setEditingMarkerCoordinate(null)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        onContextMenu={(event) => event.preventDefault()}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(9,15,24,0.82)] px-2 py-0.5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
            {mode}
          </p>
          <p className="text-xs text-[var(--color-text-soft)]">
            Zoom {Math.round(viewport.zoom * 100)}%
          </p>
        </div>
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

    if (icon.kind === 'chest') {
      drawChestCellIcon(context, centerX, centerY, layout.cellSize);
      continue;
    }

    if (icon.kind === 'pit') {
      drawPitCellIcon(context, centerX, centerY, layout.cellSize);
      continue;
    }

    if (icon.kind === 'stairs') {
      drawUpStairsCellIcon(context, centerX, centerY, layout.cellSize);
      continue;
    }

    if (icon.kind === 'stairs-down') {
      drawDownStairsCellIcon(context, centerX, centerY, layout.cellSize);
      continue;
    }

    const iconRadius = getCellIconRadius(layout.cellSize);

    context.fillStyle = '#f6d58d';
    context.beginPath();
    context.arc(centerX, centerY, iconRadius, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = '#0b1320';
    context.fillText(getCellIconGlyph(icon), centerX, centerY + 0.5);
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

function getCellIconGlyph(icon: FloorState['cellIcons'][number]) {
  if (icon.kind === 'marker') {
    return getMarkerGlyph(icon.message);
  }

  switch (icon.kind) {
    case 'pit':
      return '';
    case 'stairs':
      return '';
    case 'stairs-down':
      return '';
    case 'chest':
      return '';
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

function getCellIconRadius(cellSize: number) {
  return Math.min(cellSize * 0.5 - 1, Math.max(4, cellSize * 0.46));
}

function drawPitCellIcon(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
) {
  const radius = Math.max(3, cellSize * 0.22);

  context.fillStyle = '#04070d';
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = 'rgba(214, 222, 235, 0.18)';
  context.lineWidth = Math.max(1, cellSize * 0.04);
  context.beginPath();
  context.arc(centerX, centerY, radius, 0, Math.PI * 2);
  context.stroke();
}

function drawChestCellIcon(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
) {
  const sourceWidth = 32;
  const sourceHeight = 30;
  const iconWidth = Math.max(12, Math.floor(cellSize * 0.82));
  const scale = iconWidth / sourceWidth;
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const originX = Math.round(centerX - drawWidth / 2);
  const originY = Math.round(centerY - drawHeight / 2);

  const fillRect = (x: number, y: number, width: number, height: number, color: string) => {
    context.fillStyle = color;
    context.fillRect(
      originX + x * scale,
      originY + y * scale,
      width * scale,
      height * scale,
    );
  };

  // WHY: 提示 SVG は viewBox 16x16 に対して 32x30 座標を使っていたため、実際の矩形座標系を優先して 32x30 のピクセルアートとして再構成する。
  fillRect(4, 2, 24, 2, '#2A1608');
  fillRect(2, 4, 28, 2, '#2A1608');
  fillRect(0, 6, 32, 12, '#2A1608');
  fillRect(0, 18, 32, 10, '#2A1608');
  fillRect(2, 28, 28, 2, '#2A1608');

  fillRect(4, 4, 9, 2, '#F0A432');
  fillRect(2, 6, 12, 2, '#C8741F');
  fillRect(2, 8, 12, 4, '#8E4B1A');
  fillRect(4, 8, 8, 2, '#F0A432');
  fillRect(4, 10, 8, 2, '#B85F1F');

  fillRect(19, 4, 9, 2, '#F0A432');
  fillRect(18, 6, 12, 2, '#C8741F');
  fillRect(18, 8, 12, 4, '#8E4B1A');
  fillRect(20, 8, 8, 2, '#F0A432');
  fillRect(20, 10, 8, 2, '#B85F1F');

  fillRect(4, 12, 10, 2, '#3B200F');
  fillRect(18, 12, 10, 2, '#3B200F');

  fillRect(13, 2, 6, 2, '#3B200F');
  fillRect(12, 4, 8, 10, '#F2C24A');
  fillRect(14, 4, 4, 2, '#FFF08A');
  fillRect(14, 6, 4, 6, '#B97A22');
  fillRect(12, 12, 8, 2, '#5B3514');

  fillRect(0, 14, 32, 4, '#2A1608');

  fillRect(2, 18, 28, 9, '#A9571D');
  fillRect(4, 18, 24, 2, '#F0A432');
  fillRect(4, 20, 24, 2, '#C8741F');
  fillRect(4, 22, 24, 4, '#7C3D17');

  fillRect(2, 18, 3, 9, '#5B2A12');
  fillRect(27, 18, 3, 9, '#5B2A12');
  fillRect(5, 25, 22, 2, '#3B200F');

  fillRect(12, 15, 8, 2, '#2A1608');
  fillRect(11, 17, 10, 9, '#2A1608');
  fillRect(13, 17, 6, 7, '#F2C24A');
  fillRect(14, 18, 4, 2, '#FFF08A');
  fillRect(14, 20, 4, 4, '#B97A22');
  fillRect(15, 21, 2, 2, '#4A2A12');

  fillRect(6, 27, 20, 1, '#D8902A');
  fillRect(4, 28, 24, 1, '#5B2A12');

  fillRect(5, 5, 6, 1, '#FFD45A');
  fillRect(21, 5, 6, 1, '#FFD45A');
  fillRect(5, 19, 8, 1, '#FFD45A');
  fillRect(20, 19, 7, 1, '#FFD45A');

  fillRect(2, 6, 2, 2, '#3B200F');
  fillRect(28, 6, 2, 2, '#3B200F');
  fillRect(2, 25, 2, 2, '#2A1608');
  fillRect(28, 25, 2, 2, '#2A1608');
}

function drawDownStairsCellIcon(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
) {
  const sourceSize = 32;
  const iconWidth = Math.max(14, Math.floor(cellSize * 0.9));
  const scale = iconWidth / sourceSize;
  const drawSize = sourceSize * scale;
  const originX = Math.round(centerX - drawSize / 2);
  const originY = Math.round(centerY - drawSize / 2);

  const fillRect = (x: number, y: number, width: number, height: number, color: string) => {
    context.fillStyle = color;
    context.fillRect(
      originX + x * scale,
      originY + y * scale,
      width * scale,
      height * scale,
    );
  };

  const fillMirroredRect = (
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
  ) => {
    // WHY: transform 反転は描画原点ごと動いて位置合わせが崩れたため、各 rect の x 座標を左右反転した版へ直接変換する。
    fillRect(sourceSize - x - width, y, width, height, color);
  };

  fillMirroredRect(0, 0, 32, 32, '#7a879d');

  fillMirroredRect(0, 0, 32, 1, '#aab8cc');
  fillMirroredRect(0, 1, 1, 31, '#aab8cc');
  fillMirroredRect(0, 31, 32, 1, '#4a5363');
  fillMirroredRect(31, 0, 1, 31, '#4a5363');

  fillMirroredRect(3, 3, 26, 26, '#1f242d');
  fillMirroredRect(4, 4, 24, 24, '#333b47');

  fillMirroredRect(4, 16, 6, 12, '#1f242d');
  fillMirroredRect(5, 17, 4, 11, '#69768a');
  fillMirroredRect(6, 18, 1, 9, '#9daabf');
  fillMirroredRect(6, 18, 1, 2, '#d2dbe6');
  fillMirroredRect(8, 17, 1, 11, '#586375');

  fillMirroredRect(10, 12, 6, 16, '#1f242d');
  fillMirroredRect(11, 13, 4, 15, '#69768a');
  fillMirroredRect(12, 14, 1, 13, '#9daabf');
  fillMirroredRect(12, 14, 1, 2, '#d2dbe6');
  fillMirroredRect(14, 13, 1, 15, '#586375');

  fillMirroredRect(16, 8, 6, 20, '#1f242d');
  fillMirroredRect(17, 9, 4, 19, '#69768a');
  fillMirroredRect(18, 10, 1, 17, '#9daabf');
  fillMirroredRect(18, 10, 1, 2, '#d2dbe6');
  fillMirroredRect(20, 9, 1, 19, '#586375');

  fillMirroredRect(22, 4, 6, 24, '#1f242d');
  fillMirroredRect(23, 5, 4, 23, '#69768a');
  fillMirroredRect(24, 6, 1, 21, '#9daabf');
  fillMirroredRect(24, 6, 1, 2, '#d2dbe6');
  fillMirroredRect(26, 5, 1, 23, '#586375');
}

function drawUpStairsCellIcon(
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
) {
  const sourceSize = 32;
  const iconWidth = Math.max(14, Math.floor(cellSize * 0.9));
  const scale = iconWidth / sourceSize;
  const drawSize = sourceSize * scale;
  const originX = Math.round(centerX - drawSize / 2);
  const originY = Math.round(centerY - drawSize / 2);

  const fillRect = (x: number, y: number, width: number, height: number, color: string) => {
    context.fillStyle = color;
    context.fillRect(
      originX + x * scale,
      originY + y * scale,
      width * scale,
      height * scale,
    );
  };

  // WHY: 新しい指定 SVG は単純な rect 構成だけなので、そのまま Canvas の矩形群へ写して登り階段を再現する。
  fillRect(4, 14, 24, 14, '#1f242d');
  fillRect(5, 16, 22, 11, '#333b47');

  fillRect(4, 12, 6, 14, '#1f242d');
  fillRect(5, 13, 4, 12, '#69768a');
  fillRect(5, 14, 1, 11, '#9daabf');
  fillRect(5, 14, 1, 2, '#d2dbe6');
  fillRect(8, 13, 1, 11, '#586375');

  fillRect(10, 7, 6, 16, '#1f242d');
  fillRect(11, 8, 4, 14, '#69768a');
  fillRect(11, 9, 1, 13, '#9daabf');
  fillRect(11, 9, 1, 2, '#d2dbe6');
  fillRect(14, 8, 1, 14, '#586375');

  fillRect(16, 4, 6, 15, '#1f242d');
  fillRect(17, 5, 4, 13, '#69768a');
  fillRect(17, 5, 1, 12, '#9daabf');
  fillRect(17, 6, 1, 2, '#d2dbe6');
  fillRect(20, 5, 1, 13, '#586375');

  fillRect(22, 0, 6, 14, '#1f242d');
  fillRect(23, 1, 4, 14, '#69768a');
  fillRect(23, 1, 1, 12, '#9daabf');
  fillRect(23, 2, 1, 2, '#d2dbe6');
  fillRect(26, 1, 1, 14, '#586375');
}

function getMarkerGlyph(message?: string) {
  const normalized = message?.trim();

  return normalized ? normalized.charAt(0) : 'M';
}

function getMarkerIconAtCoordinate(
  floor: FloorState,
  coordinate: CellCoordinate,
): FloorState['cellIcons'][number] | null {
  return (
    floor.cellIcons.find(
      (icon) =>
        icon.kind === 'marker' &&
        icon.position.x === coordinate.x &&
        icon.position.y === coordinate.y,
    ) ?? null
  );
}

function getMarkerAtCanvasPoint(
  localX: number,
  localY: number,
  floor: FloorState,
  layout: GridLayout,
): FloorState['cellIcons'][number] | null {
  const gridX = localX - layout.originX;
  const gridY = localY - layout.originY;

  if (gridX < 0 || gridY < 0 || gridX > layout.gridWidth || gridY > layout.gridHeight) {
    return null;
  }

  const cellX = Math.min(Math.floor(gridX / layout.cellSize), floor.width - 1);
  const cellY = Math.min(Math.floor(gridY / layout.cellSize), floor.height - 1);
  const marker = getMarkerIconAtCoordinate(floor, { x: cellX, y: cellY });

  if (!marker) {
    return null;
  }

  const centerX = layout.originX + marker.position.x * layout.cellSize + layout.cellSize / 2;
  const centerY = layout.originY + marker.position.y * layout.cellSize + layout.cellSize / 2;
  const dx = localX - centerX;
  const dy = localY - centerY;
  const hitRadius = getCellIconRadius(layout.cellSize) + 4;

  return dx * dx + dy * dy <= hitRadius * hitRadius ? marker : null;
}
