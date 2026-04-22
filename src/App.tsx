import { useEffect, useMemo } from 'react';
import { MapCanvas } from './components/MapCanvas';
import { ShellPanel } from './components/ShellPanel';
import { getFloorStats } from './lib/mapModel';
import { useAppStore, useSelectedFloor } from './store/appStore';
import { AutoMappingLevel, CellIconKind, EditTool, Facing } from './types/map';

const FACINGS: Facing[] = ['north', 'east', 'south', 'west'];
const AUTO_MAPPING_LEVELS: AutoMappingLevel[] = ['off', 'basic', 'corridor'];
const CELL_ICON_KINDS: CellIconKind[] = ['stairs', 'pit', 'chest', 'marker'];

function App() {
  const mode = useAppStore((state) => state.mode);
  const autoMapping = useAppStore((state) => state.autoMapping);
  const floors = useAppStore((state) => state.floors);
  const selectedCellIconKind = useAppStore((state) => state.selectedCellIconKind);
  const selectedTool = useAppStore((state) => state.selectedTool);
  const selectedFloor = useSelectedFloor();
  const applyForwardEdgeShortcut = useAppStore((state) => state.applyForwardEdgeShortcut);
  const cycleSelectedCellIcon = useAppStore((state) => state.cycleSelectedCellIcon);
  const moveInDirection = useAppStore((state) => state.moveInDirection);
  const placeSelectedIconAtCurrentCell = useAppStore((state) => state.placeSelectedIconAtCurrentCell);
  const placeSelectedIconAtForwardCell = useAppStore((state) => state.placeSelectedIconAtForwardCell);
  const removeCurrentCellIcon = useAppStore((state) => state.removeCurrentCellIcon);
  const setAutoMapping = useAppStore((state) => state.setAutoMapping);
  const setMode = useAppStore((state) => state.setMode);
  const setPlayerFacing = useAppStore((state) => state.setPlayerFacing);
  const setSelectedCellIconKind = useAppStore((state) => state.setSelectedCellIconKind);
  const setSelectedTool = useAppStore((state) => state.setSelectedTool);
  const toggleMode = useAppStore((state) => state.toggleMode);
  const selectedFloorStats = useMemo(
    () => (selectedFloor ? getFloorStats(selectedFloor) : null),
    [selectedFloor],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;

      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      if (event.key === 'Tab') {
        event.preventDefault();
        toggleMode();
        return;
      }

      if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
        if (event.altKey && event.key.toLowerCase() === 'i') {
          event.preventDefault();
          placeSelectedIconAtForwardCell();
          return;
        }

        switch (event.key) {
          case '1':
            event.preventDefault();
            applyForwardEdgeShortcut('wall');
            return;
          case '2':
            event.preventDefault();
            applyForwardEdgeShortcut('door');
            return;
          case '3':
            event.preventDefault();
            applyForwardEdgeShortcut('open');
            return;
          case '0':
            event.preventDefault();
            applyForwardEdgeShortcut('unknown');
            return;
          case 'i':
          case 'I':
            event.preventDefault();
            placeSelectedIconAtCurrentCell();
            return;
          case 'Backspace':
            event.preventDefault();
            removeCurrentCellIcon();
            return;
          case '[':
            event.preventDefault();
            cycleSelectedCellIcon(-1);
            return;
          case ']':
            event.preventDefault();
            cycleSelectedCellIcon(1);
            return;
          default:
            break;
        }
      }

      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      const nextFacing = getFacingFromKeyboardEvent(event);

      if (!nextFacing) {
        return;
      }

      event.preventDefault();
      moveInDirection(nextFacing);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    applyForwardEdgeShortcut,
    cycleSelectedCellIcon,
    moveInDirection,
    placeSelectedIconAtCurrentCell,
    placeSelectedIconAtForwardCell,
    removeCurrentCellIcon,
    toggleMode,
  ]);

  return (
    <div className="min-h-screen bg-[var(--color-app)] text-[var(--color-text)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex flex-col gap-4 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-4 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
                Phase 3 Map Mode And Editing
              </p>
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[var(--color-text-strong)]">
                  Web Auto Mapping
                </h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-soft)]">
                  Map モードで既知の壁を越えない移動確認、前方エッジのショートカット編集、
                  Canvas クリックによるセル / 境界 / アイコン編集を追加しました。
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-5">
              <StatusChip label="Mode" value={mode} />
              <StatusChip label="Floor" value={selectedFloor?.name ?? 'N/A'} />
              <StatusChip label="Auto Map" value={autoMapping} />
              <StatusChip label="Tool" value={selectedTool} />
              <StatusChip label="Known Cells" value={`${selectedFloorStats?.knownCells ?? 0}`} />
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
          <ShellPanel
            title="Navigator"
            description="移動、モード、前方編集ショートカットをまとめた操作パネル。"
          >
            <section className="space-y-3">
              <PanelHeading
                eyebrow="Session"
                title="Movement"
                body="Explore は自動記録、Map は既知の壁を越えない歩行確認に使います。`Tab` でモード切替できます。"
              />
              <dl className="grid gap-3">
                <KeyValueRow label="Active Mode" value={mode} />
                <KeyValueRow label="Selected Floor" value={selectedFloor?.name ?? '未選択'} />
                <KeyValueRow
                  label="Player"
                  value={`${selectedFloor?.player.x ?? 0}, ${selectedFloor?.player.y ?? 0}`}
                />
                <KeyValueRow label="Facing" value={selectedFloor?.player.facing ?? 'north'} />
              </dl>
            </section>

            <section className="space-y-3">
              <PanelHeading
                eyebrow="Keyboard"
                title="Movement"
                body="`W/A/S/D` または矢印キーで移動します。Map モードでは `wall` を越えず、未知セルには入りません。"
              />
              <MovementPad
                currentFacing={selectedFloor?.player.facing ?? 'north'}
                onMove={moveInDirection}
              />
            </section>

            <section className="space-y-3">
              <PanelHeading
                eyebrow="Shortcuts"
                title="Forward Edge"
                body="前方境界を `1:wall`, `2:door`, `3:open`, `0:unknown` で即時編集できます。"
              />
              <div className="grid grid-cols-2 gap-2">
                <ShortcutButton label="1 wall" onClick={() => applyForwardEdgeShortcut('wall')} />
                <ShortcutButton label="2 door" onClick={() => applyForwardEdgeShortcut('door')} />
                <ShortcutButton label="3 open" onClick={() => applyForwardEdgeShortcut('open')} />
                <ShortcutButton
                  label="0 unknown"
                  onClick={() => applyForwardEdgeShortcut('unknown')}
                />
              </div>
            </section>
          </ShellPanel>

          <section className="flex min-h-[420px] flex-col rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-[var(--shadow-soft)]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-3 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Map Canvas
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[var(--color-text-strong)]">
                  Floor Workspace
                </h2>
              </div>
              <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-1 text-xs text-[var(--color-text-soft)]">
                {selectedFloor?.width ?? 0} x {selectedFloor?.height ?? 0} grid
              </div>
            </div>

            <div className="flex-1 p-3">
              <MapCanvas />
            </div>
          </section>

          <ShellPanel
            title="Workspace"
            description="クリック編集とアイコン配置をまとめた右ペイン。"
          >
            <section className="space-y-3">
              <PanelHeading
                eyebrow="Map Stats"
                title="Selected Floor"
                body="編集で変わるセル、通路、壁、アイコン数をここで確認できます。"
              />
              <dl className="grid gap-3">
                <KeyValueRow label="Floors" value={`${floors.length}`} />
                <KeyValueRow label="Known Cells" value={`${selectedFloorStats?.knownCells ?? 0}`} />
                <KeyValueRow label="Open Edges" value={`${selectedFloorStats?.openEdges ?? 0}`} />
                <KeyValueRow label="Wall Edges" value={`${selectedFloorStats?.wallEdges ?? 0}`} />
                <KeyValueRow
                  label="Icons"
                  value={`${(selectedFloorStats?.cellIcons ?? 0) + (selectedFloorStats?.edgeIcons ?? 0)}`}
                />
              </dl>
            </section>

            <section className="space-y-3">
              <PanelHeading
                eyebrow="Mode"
                title="Explore / Map"
                body="Map モード時のみ Canvas クリック編集を受け付けます。Explore は踏査入力を優先します。"
              />
              <div className="grid grid-cols-2 gap-2">
                <ActionButton
                  active={mode === 'explore'}
                  label="Explore"
                  onClick={() => setMode('explore')}
                />
                <ActionButton active={mode === 'map'} label="Map" onClick={() => setMode('map')} />
              </div>
            </section>

            <section className="space-y-3">
              <PanelHeading
                eyebrow="Mouse"
                title="Edit Tool"
                body="左クリックで配置、右クリックで削除です。セル中心を押すとセル、境界近くを押すとエッジを編集します。"
              />
              <div className="grid gap-2">
                {EDIT_TOOL_OPTIONS.map((tool) => (
                  <ActionButton
                    key={tool.value}
                    active={selectedTool === tool.value}
                    label={tool.label}
                    onClick={() => setSelectedTool(tool.value)}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <PanelHeading
                eyebrow="Palette"
                title="Cell Icons"
                body="`[` `]` で巡回、`I` で足元、`Alt+I` で前方セルへ配置、`Backspace` で足元アイコン削除です。"
              />
              <div className="grid grid-cols-2 gap-2">
                {CELL_ICON_KINDS.map((kind) => (
                  <ActionButton
                    key={kind}
                    active={selectedCellIconKind === kind}
                    label={kind}
                    onClick={() => setSelectedCellIconKind(kind)}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <PanelHeading
                eyebrow="Facing"
                title="Manual Turn"
                body="移動せず向きだけ変えたい場合の確認用操作です。"
              />
              <div className="grid grid-cols-2 gap-2">
                {FACINGS.map((facing) => (
                  <ActionButton
                    key={facing}
                    active={selectedFloor?.player.facing === facing}
                    label={facing}
                    onClick={() => setPlayerFacing(facing)}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <PanelHeading
                eyebrow="Auto Mapping"
                title="Completion Level"
                body="Explore モードの移動時のみ効く設定です。Map 編集では自動変更しません。"
              />
              <div className="grid gap-2">
                {AUTO_MAPPING_LEVELS.map((level) => (
                  <ActionButton
                    key={level}
                    active={autoMapping === level}
                    label={level}
                    onClick={() => setAutoMapping(level)}
                  />
                ))}
              </div>
            </section>
          </ShellPanel>
        </main>
      </div>
    </div>
  );
}

const EDIT_TOOL_OPTIONS: Array<{ label: string; value: EditTool }> = [
  { label: 'cell floor', value: 'cell-floor' },
  { label: 'cell unknown', value: 'cell-unknown' },
  { label: 'edge wall', value: 'edge-wall' },
  { label: 'edge door', value: 'edge-door' },
  { label: 'edge open', value: 'edge-open' },
  { label: 'edge unknown', value: 'edge-unknown' },
  { label: 'cell icon', value: 'cell-icon' },
];

type StatusChipProps = {
  label: string;
  value: string;
};

function StatusChip({ label, value }: StatusChipProps) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-sm font-medium capitalize text-[var(--color-text-strong)]">{value}</p>
    </div>
  );
}

type PanelHeadingProps = {
  eyebrow: string;
  title: string;
  body: string;
};

function PanelHeading({ eyebrow, title, body }: PanelHeadingProps) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">{eyebrow}</p>
      <h3 className="mt-1 text-base font-semibold tracking-[-0.02em] text-[var(--color-text-strong)]">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-6 text-[var(--color-text-soft)]">{body}</p>
    </div>
  );
}

type KeyValueRowProps = {
  label: string;
  value: string;
};

function KeyValueRow({ label, value }: KeyValueRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
      <dt className="text-sm text-[var(--color-text-soft)]">{label}</dt>
      <dd className="text-sm font-medium capitalize text-[var(--color-text-strong)]">{value}</dd>
    </div>
  );
}

type ActionButtonProps = {
  active: boolean;
  label: string;
  onClick: () => void;
};

function ActionButton({ active, label, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-sm font-medium capitalize transition ${
        active
          ? 'border-[var(--color-border-strong)] bg-[rgba(87,159,255,0.12)] text-[var(--color-text-strong)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-soft)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-strong)]'
      }`}
    >
      {label}
    </button>
  );
}

type ShortcutButtonProps = {
  label: string;
  onClick: () => void;
};

function ShortcutButton({ label, onClick }: ShortcutButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-text-soft)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-strong)]"
    >
      {label}
    </button>
  );
}

type MovementPadProps = {
  currentFacing: Facing;
  onMove: (facing: Facing) => void;
};

function MovementPad({ currentFacing, onMove }: MovementPadProps) {
  return (
    <div className="grid gap-2">
      <div className="flex justify-center">
        <ActionButton
          active={currentFacing === 'north'}
          label="north"
          onClick={() => onMove('north')}
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <ActionButton active={currentFacing === 'west'} label="west" onClick={() => onMove('west')} />
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-3 py-3 text-center text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Move
        </div>
        <ActionButton active={currentFacing === 'east'} label="east" onClick={() => onMove('east')} />
      </div>
      <div className="flex justify-center">
        <ActionButton
          active={currentFacing === 'south'}
          label="south"
          onClick={() => onMove('south')}
        />
      </div>
    </div>
  );
}

function getFacingFromKeyboardEvent(event: KeyboardEvent): Facing | null {
  switch (event.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      return 'north';
    case 'd':
    case 'arrowright':
      return 'east';
    case 's':
    case 'arrowdown':
      return 'south';
    case 'a':
    case 'arrowleft':
      return 'west';
    default:
      return null;
  }
}

export default App;
