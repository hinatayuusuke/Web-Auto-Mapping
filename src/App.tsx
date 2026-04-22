import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { MapCanvas } from './components/MapCanvas';
import { ShellPanel } from './components/ShellPanel';
import { getFloorStats } from './lib/mapModel';
import { createPersistedDocument, parsePersistedDocument, STORAGE_KEY } from './lib/persistence';
import { useAppStore, useSelectedFloor } from './store/appStore';
import { AutoMappingLevel, CellIconKind, EditTool, Facing } from './types/map';

const FACINGS: Facing[] = ['north', 'east', 'south', 'west'];
const AUTO_MAPPING_LEVELS: AutoMappingLevel[] = ['off', 'basic', 'corridor'];
const CELL_ICON_KINDS: CellIconKind[] = ['stairs', 'pit', 'chest', 'marker'];
const EDIT_TOOL_OPTIONS: Array<{ label: string; value: EditTool }> = [
  { label: 'cell floor', value: 'cell-floor' },
  { label: 'cell unknown', value: 'cell-unknown' },
  { label: 'edge wall', value: 'edge-wall' },
  { label: 'edge door', value: 'edge-door' },
  { label: 'edge open', value: 'edge-open' },
  { label: 'edge unknown', value: 'edge-unknown' },
  { label: 'cell icon', value: 'cell-icon' },
];
const VIEWPORT_PAN_STEP = 64;

type NoticeState = {
  message: string;
  tone: 'info' | 'success' | 'error';
};

function App() {
  const [ioNotice, setIoNotice] = useState<NoticeState | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const autoMapping = useAppStore((state) => state.autoMapping);
  const canRedo = useAppStore((state) => state.history.redoStack.length > 0);
  const canUndo = useAppStore((state) => state.history.undoStack.length > 0);
  const floors = useAppStore((state) => state.floors);
  const mapTitle = useAppStore((state) => state.mapTitle);
  const mode = useAppStore((state) => state.mode);
  const selectedCellIconKind = useAppStore((state) => state.selectedCellIconKind);
  const selectedTool = useAppStore((state) => state.selectedTool);
  const selectedFloor = useSelectedFloor();
  const viewport = useAppStore((state) => state.viewport);
  const addFloor = useAppStore((state) => state.addFloor);
  const applyForwardEdgeShortcut = useAppStore((state) => state.applyForwardEdgeShortcut);
  const cycleSelectedCellIcon = useAppStore((state) => state.cycleSelectedCellIcon);
  const duplicateSelectedFloor = useAppStore((state) => state.duplicateSelectedFloor);
  const expandSelectedFloorDown = useAppStore((state) => state.expandSelectedFloorDown);
  const expandSelectedFloorRight = useAppStore((state) => state.expandSelectedFloorRight);
  const loadPersistedDocument = useAppStore((state) => state.loadPersistedDocument);
  const moveInDirection = useAppStore((state) => state.moveInDirection);
  const placeSelectedIconAtCurrentCell = useAppStore((state) => state.placeSelectedIconAtCurrentCell);
  const placeSelectedIconAtForwardCell = useAppStore((state) => state.placeSelectedIconAtForwardCell);
  const redo = useAppStore((state) => state.redo);
  const removeCurrentCellIcon = useAppStore((state) => state.removeCurrentCellIcon);
  const removeFloor = useAppStore((state) => state.removeFloor);
  const renameFloor = useAppStore((state) => state.renameFloor);
  const resetViewport = useAppStore((state) => state.resetViewport);
  const setAutoMapping = useAppStore((state) => state.setAutoMapping);
  const setMapTitle = useAppStore((state) => state.setMapTitle);
  const setMode = useAppStore((state) => state.setMode);
  const setPlayerFacing = useAppStore((state) => state.setPlayerFacing);
  const setSelectedCellIconKind = useAppStore((state) => state.setSelectedCellIconKind);
  const setSelectedFloor = useAppStore((state) => state.setSelectedFloor);
  const setSelectedTool = useAppStore((state) => state.setSelectedTool);
  const setViewport = useAppStore((state) => state.setViewport);
  const toggleMode = useAppStore((state) => state.toggleMode);
  const undo = useAppStore((state) => state.undo);

  const selectedFloorStats = useMemo(
    () => (selectedFloor ? getFloorStats(selectedFloor) : null),
    [selectedFloor],
  );
  const mapStateNotice = useMemo<NoticeState | null>(() => {
    if (!selectedFloor) {
      return {
        tone: 'error',
        message: '選択中の階層が見つかりません。保存データを読み直してください。',
      };
    }

    if ((selectedFloorStats?.knownCells ?? 0) === 0) {
      return {
        tone: 'info',
        message: '空の階層です。Explore で移動するか、Map モードで floor を配置して開始してください。',
      };
    }

    return null;
  }, [selectedFloor, selectedFloorStats]);

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

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();

        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
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
    redo,
    removeCurrentCellIcon,
    toggleMode,
    undo,
  ]);

  const handleExport = () => {
    const documentState = createPersistedDocument(useAppStore.getState());
    const blob = new Blob([JSON.stringify(documentState, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `${slugify(documentState.title)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setIoNotice({
      tone: 'success',
      message: 'JSON を書き出しました。',
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = parsePersistedDocument(JSON.parse(text));

      if (!parsed) {
        setIoNotice({
          tone: 'error',
          message: 'JSON の形式が不正です。',
        });
        return;
      }

      const loaded = loadPersistedDocument(parsed);
      setIoNotice({
        tone: loaded ? 'success' : 'error',
        message: loaded ? 'JSON を読み込みました。' : 'JSON の読込に失敗しました。',
      });
    } catch {
      setIoNotice({
        tone: 'error',
        message: 'JSON の読込に失敗しました。',
      });
    }
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-[var(--color-app)] text-[var(--color-text)]">
      <input
        ref={fileInputRef}
        className="hidden"
        type="file"
        accept="application/json,.json"
        onChange={handleImportFile}
      />

      <div className="mx-auto flex h-full w-full max-w-[1680px] flex-col px-3 py-3 sm:px-4 lg:px-5">
        <header className="mb-3 shrink-0 border-b border-[var(--color-border)] pb-2">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--color-text-strong)]">
                  Web Auto Mapping
                </h1>
                <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  One Page Layout
                </span>
              </div>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-soft)]">
                左右は独立スクロール、中央は常時表示のままホイールでズームします。
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
              <StatusChip label="Mode" value={mode} />
              <StatusChip label="Floor" value={selectedFloor?.name ?? 'N/A'} />
              <StatusChip label="Auto Map" value={autoMapping} />
              <StatusChip label="Tool" value={selectedTool} />
              <StatusChip label="Icon" value={selectedCellIconKind} />
              <StatusChip label="Zoom" value={`${Math.round(viewport.zoom * 100)}%`} />
            </div>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto lg:grid lg:grid-cols-[300px_minmax(0,1fr)_300px] lg:overflow-hidden xl:grid-cols-[320px_minmax(0,1fr)_320px]">
          <ShellPanel
            title="Navigator"
            description="探索操作、階層管理、グリッド拡張をまとめた左ペイン。"
          >
            <section className="space-y-3">
              <PanelHeading
                eyebrow="Document"
                title="Map Title"
                body="保存 JSON と localStorage に入るタイトルです。空欄にはできません。"
              />
              <label className="grid gap-2">
                <span className="text-sm text-[var(--color-text-soft)]">Title</span>
                <input
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-strong)] outline-none ring-0 transition focus:border-[var(--color-border-strong)]"
                  value={mapTitle}
                  onChange={(event) => setMapTitle(event.target.value)}
                />
              </label>
            </section>

            <section className="space-y-3">
              <PanelHeading
                eyebrow="Floors"
                title="Floor List"
                body="各階層は独立した `cells / edges / icons` を持ちます。削除後も Undo で戻せます。"
              />
              <div className="grid gap-2">
                {floors.map((floor) => (
                  <button
                    key={floor.id}
                    type="button"
                    onClick={() => setSelectedFloor(floor.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      floor.id === selectedFloor?.id
                        ? 'border-[var(--color-border-strong)] bg-[rgba(87,159,255,0.12)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-[var(--color-text-strong)]">
                        {floor.name}
                      </span>
                      <span className="text-xs text-[var(--color-muted)]">
                        {floor.width} x {floor.height}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ShortcutButton label="Add" onClick={addFloor} />
                <ShortcutButton label="Duplicate" onClick={duplicateSelectedFloor} />
                <ShortcutButton
                  label="Delete"
                  onClick={() => selectedFloor && removeFloor(selectedFloor.id)}
                  disabled={!selectedFloor}
                />
              </div>
              {selectedFloor ? (
                <label className="grid gap-2">
                  <span className="text-sm text-[var(--color-text-soft)]">Selected Floor Name</span>
                  <input
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-strong)] outline-none ring-0 transition focus:border-[var(--color-border-strong)]"
                    value={selectedFloor.name}
                    onChange={(event) => renameFloor(selectedFloor.id, event.target.value)}
                  />
                </label>
              ) : null}
            </section>

            <section className="space-y-3">
              <PanelHeading
                eyebrow="Grid"
                title="Expand Right / Down"
                body="端まで到達したら右または下へ 4 マスずつ拡張します。既存座標はずれません。"
              />
              <div className="grid grid-cols-2 gap-2">
                <ShortcutButton label="+4 Right" onClick={() => expandSelectedFloorRight()} />
                <ShortcutButton label="+4 Down" onClick={() => expandSelectedFloorDown()} />
              </div>
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

          <section className="flex min-h-[360px] min-w-0 flex-col overflow-hidden border border-[var(--color-border)] bg-transparent lg:min-h-0">
            <div className="flex shrink-0 flex-col gap-3 border-b border-[var(--color-border)] px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Map Canvas
                </p>
                <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-[var(--color-text-strong)]">
                  Floor Workspace
                </h2>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
                <ShortcutButton label="Undo" onClick={undo} disabled={!canUndo} />
                <ShortcutButton label="Redo" onClick={redo} disabled={!canRedo} />
                <ShortcutButton
                  label="Zoom -"
                  onClick={() => setViewport({ zoom: viewport.zoom - 0.15 })}
                />
                <ShortcutButton
                  label="Zoom +"
                  onClick={() => setViewport({ zoom: viewport.zoom + 0.15 })}
                />
                <ShortcutButton label="Reset View" onClick={resetViewport} />
                <div className="px-1 py-3 text-center text-xs uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  {selectedFloor?.width ?? 0} x {selectedFloor?.height ?? 0}
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 p-1">
              <MapCanvas />
            </div>
          </section>

          <ShellPanel
            title="Workspace"
            description="保存 / 読込、履歴、viewport、編集設定をまとめた右ペイン。"
          >
            <section className="space-y-3">
              <PanelHeading
                eyebrow="State"
                title="Current Status"
                body="選択中のツール、アイコン、階層状態をここで見失わないようにします。"
              />
              <div className="grid gap-2">
                <KeyValueRow label="Selected Tool" value={selectedTool} />
                <KeyValueRow label="Selected Icon" value={selectedCellIconKind} />
                <KeyValueRow label="Current Floor" value={selectedFloor?.name ?? 'N/A'} />
                <KeyValueRow label="Zoom" value={`${Math.round(viewport.zoom * 100)}%`} />
              </div>
              {mapStateNotice ? (
                <NoticeCard message={mapStateNotice.message} tone={mapStateNotice.tone} />
              ) : null}
            </section>

            <section className="space-y-3">
              <PanelHeading
                eyebrow="Persistence"
                title="Save / Load"
                body="変更は自動で localStorage に保存され、ページ再読込時に復元されます。JSON でも入出力できます。"
              />
              <div className="grid gap-2">
                <ShortcutButton label="Save JSON" onClick={handleExport} />
                <ShortcutButton label="Load JSON" onClick={handleImportClick} />
              </div>
              <div className="border-t border-[var(--color-border)] pt-3 text-sm leading-6 text-[var(--color-text-soft)]">
                <p>Auto save key: `{STORAGE_KEY}`</p>
                <p>Auto save は状態更新ごとに localStorage へ書き込みます。</p>
              </div>
              {ioNotice ? <NoticeCard message={ioNotice.message} tone={ioNotice.tone} /> : null}
            </section>

            <section className="space-y-3">
              <PanelHeading
                eyebrow="History"
                title="Undo / Redo"
                body="`Ctrl+Z`, `Ctrl+Y`, `Ctrl+Shift+Z` に対応します。編集、移動、階層操作、グリッド拡張を巻き戻せます。"
              />
              <div className="grid grid-cols-2 gap-2">
                <ActionButton active={canUndo} label="Undo" onClick={undo} disabled={!canUndo} />
                <ActionButton active={canRedo} label="Redo" onClick={redo} disabled={!canRedo} />
              </div>
            </section>

            <section className="space-y-3">
              <PanelHeading
                eyebrow="Viewport"
                title="Zoom / Pan"
                body="ホイールでズーム、Canvas 上では Alt+drag または middle drag でパンできます。ボタンからも調整できます。"
              />
              <div className="grid grid-cols-3 gap-2">
                <ActionButton active={false} label="Left" onClick={() => setViewport({ offsetX: viewport.offsetX - VIEWPORT_PAN_STEP })} />
                <ActionButton active={false} label="Center" onClick={resetViewport} />
                <ActionButton active={false} label="Right" onClick={() => setViewport({ offsetX: viewport.offsetX + VIEWPORT_PAN_STEP })} />
                <ActionButton active={false} label="Up" onClick={() => setViewport({ offsetY: viewport.offsetY - VIEWPORT_PAN_STEP })} />
                <ActionButton active={false} label="Zoom -" onClick={() => setViewport({ zoom: viewport.zoom - 0.15 })} />
                <ActionButton active={false} label="Down" onClick={() => setViewport({ offsetY: viewport.offsetY + VIEWPORT_PAN_STEP })} />
              </div>
            </section>

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
                body="左クリックで配置、右クリックで削除です。セル中心はセル、境界近くはエッジとして解釈します。"
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

type StatusChipProps = {
  label: string;
  value: string;
};

function StatusChip({ label, value }: StatusChipProps) {
  return (
    <div className="border-b border-[var(--color-border)] px-1 py-2 last:border-b-0">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-xs font-medium capitalize text-[var(--color-text-strong)] sm:text-sm">{value}</p>
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
    <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] py-2 last:border-b-0">
      <dt className="text-sm text-[var(--color-text-soft)]">{label}</dt>
      <dd className="text-sm font-medium capitalize text-[var(--color-text-strong)]">{value}</dd>
    </div>
  );
}

type NoticeCardProps = NoticeState;

function NoticeCard({ message, tone }: NoticeCardProps) {
  const toneClass =
    tone === 'success'
      ? 'border-emerald-400/60 text-emerald-100'
      : tone === 'error'
        ? 'border-rose-400/60 text-rose-100'
        : 'border-sky-400/60 text-sky-100';

  return (
    <div className={`border-l-2 pl-3 text-sm leading-6 ${toneClass}`}>
      {message}
    </div>
  );
}

type ActionButtonProps = {
  active: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
};

function ActionButton({ active, disabled = false, label, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-sm font-medium capitalize transition ${
        disabled
          ? 'cursor-not-allowed border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] text-[var(--color-muted)]'
          : active
            ? 'border-[var(--color-border-strong)] bg-[rgba(87,159,255,0.12)] text-[var(--color-text-strong)]'
            : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-soft)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-strong)]'
      }`}
    >
      {label}
    </button>
  );
}

type ShortcutButtonProps = {
  disabled?: boolean;
  label: string;
  onClick: () => void;
};

function ShortcutButton({ disabled = false, label, onClick }: ShortcutButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
        disabled
          ? 'cursor-not-allowed border-[var(--color-border)] bg-[rgba(255,255,255,0.02)] text-[var(--color-muted)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-soft)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-strong)]'
      }`}
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

function slugify(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return normalized.length > 0 ? normalized : 'web-auto-mapping';
}

export default App;
