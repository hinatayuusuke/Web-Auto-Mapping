import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';

const GRID_PADDING = 24;

export function MapCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const selectedFloorId = useAppStore((state) => state.selectedFloorId);
  const floors = useAppStore((state) => state.floors);

  const selectedFloor = floors.find((floor) => floor.id === selectedFloorId);

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
      floorWidth: selectedFloor.width,
      floorHeight: selectedFloor.height,
      playerX: selectedFloor.player.x,
      playerY: selectedFloor.player.y,
    });
  }, [selectedFloor, size.height, size.width]);

  return (
    <div
      ref={frameRef}
      className="relative h-full min-h-[360px] overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[radial-gradient(circle_at_top,_rgba(87,159,255,0.12),_transparent_38%),linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0))]"
    >
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
      />

      <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(9,15,24,0.72)] px-4 py-3 backdrop-blur">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">Canvas Status</p>
        <p className="mt-1 text-sm leading-6 text-[var(--color-text-soft)]">
          Phase 0 では固定グリッドを表示します。Phase 1 からセル、エッジ、プレイヤー描画へ差し替えます。
        </p>
      </div>
    </div>
  );
}

type DrawSceneArgs = {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  floorWidth: number;
  floorHeight: number;
  playerX: number;
  playerY: number;
};

function drawScene({
  context,
  width,
  height,
  floorWidth,
  floorHeight,
  playerX,
  playerY,
}: DrawSceneArgs) {
  context.fillStyle = '#0b1320';
  context.fillRect(0, 0, width, height);

  const drawableWidth = Math.max(width - GRID_PADDING * 2, 120);
  const drawableHeight = Math.max(height - GRID_PADDING * 2, 120);
  const cellSize = Math.max(
    14,
    Math.floor(Math.min(drawableWidth / floorWidth, drawableHeight / floorHeight)),
  );
  const gridWidth = floorWidth * cellSize;
  const gridHeight = floorHeight * cellSize;
  const originX = Math.floor((width - gridWidth) / 2);
  const originY = Math.floor((height - gridHeight) / 2);

  context.fillStyle = 'rgba(255,255,255,0.02)';
  context.fillRect(originX, originY, gridWidth, gridHeight);

  context.strokeStyle = 'rgba(214, 222, 235, 0.10)';
  context.lineWidth = 1;

  for (let column = 0; column <= floorWidth; column += 1) {
    const x = originX + column * cellSize + 0.5;
    context.beginPath();
    context.moveTo(x, originY);
    context.lineTo(x, originY + gridHeight);
    context.stroke();
  }

  for (let row = 0; row <= floorHeight; row += 1) {
    const y = originY + row * cellSize + 0.5;
    context.beginPath();
    context.moveTo(originX, y);
    context.lineTo(originX + gridWidth, y);
    context.stroke();
  }

  context.strokeStyle = 'rgba(87, 159, 255, 0.48)';
  context.lineWidth = 2;
  context.strokeRect(originX, originY, gridWidth, gridHeight);

  const playerCenterX = originX + playerX * cellSize + cellSize / 2;
  const playerCenterY = originY + playerY * cellSize + cellSize / 2;

  context.fillStyle = '#6cbcff';
  context.beginPath();
  context.arc(playerCenterX, playerCenterY, Math.max(4, cellSize * 0.22), 0, Math.PI * 2);
  context.fill();
}
