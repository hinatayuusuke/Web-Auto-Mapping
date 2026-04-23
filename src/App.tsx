import { useEffect, useMemo, useState } from 'react';
import { MapCanvas } from './components/MapCanvas';
import { ShellPanel } from './components/ShellPanel';
import { getFloorStats } from './lib/mapModel';
import { createPersistedDocument } from './lib/persistence';
import { exportDocument, getStorageDescriptor, importDocument } from './lib/storageAdapter';
import { useAppStore, useSelectedFloor } from './store/appStore';
import { AutoMappingLevel, CellIconKind, EditTool, Facing } from './types/map';

const AUTO_MAPPING_LEVELS: AutoMappingLevel[] = ['off', 'basic', 'corridor'];
const CELL_ICON_KINDS: CellIconKind[] = ['stairs', 'pit', 'chest', 'marker'];
const EDIT_TOOL_OPTIONS: Array<{ label: string; value: EditTool }> = [
  { label: 'cell floor', value: 'cell-floor' },
  { label: 'cell unknown', value: 'cell-unknown' },
  { label: 'edge wall', value: 'edge-wall' },
  { label: 'edge open door', value: 'edge-door' },
  { label: 'edge closed door', value: 'edge-closed-door' },
  { label: 'edge open', value: 'edge-open' },
  { label: 'edge unknown', value: 'edge-unknown' },
  { label: 'cell icon', value: 'cell-icon' },
];
const VIEWPORT_PAN_STEP = 64;

type NoticeState = {
  message: string;
  tone: 'info' | 'success' | 'error';
};

type RelativeControlAction = 'forward' | 'turn-left' | 'turn-right' | 'turn-back';

function App() {
  const [ioNotice, setIoNotice] = useState<NoticeState | null>(null);
  const [isTallViewport, setIsTallViewport] = useState(false);
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
  const expandSelectedFloorLeft = useAppStore((state) => state.expandSelectedFloorLeft);
  const expandSelectedFloorUp = useAppStore((state) => state.expandSelectedFloorUp);
  const expandSelectedFloorDown = useAppStore((state) => state.expandSelectedFloorDown);
  const expandSelectedFloorRight = useAppStore((state) => state.expandSelectedFloorRight);
  const hydratePersistedState = useAppStore((state) => state.hydratePersistedState);
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
  const currentFacing = selectedFloor?.player.facing ?? 'north';
  const storageDescriptor = useMemo(() => getStorageDescriptor(), []);

  useEffect(() => {
    void hydratePersistedState();
  }, [hydratePersistedState]);

  useEffect(() => {
    const updateViewportMode = () => {
      // WHY: 高さが幅を上回るウインドウでは 1 ページ固定より全体スクロールの方が破綻しにくい。
      setIsTallViewport(window.innerHeight > window.innerWidth);
    };

    updateViewportMode();
    window.addEventListener('resize', updateViewportMode);

    return () => window.removeEventListener('resize', updateViewportMode);
  }, []);

  useEffect(() => {
    document.body.dataset.layoutMode = isTallViewport ? 'tall' : 'wide';

    return () => {
      delete document.body.dataset.layoutMode;
    };
  }, [isTallViewport]);

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
          case '4':
            event.preventDefault();
            applyForwardEdgeShortcut('closed-door');
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

      const controlAction = getRelativeControlActionFromKeyboardEvent(event);

      if (!controlAction) {
        return;
      }

      event.preventDefault();

      if (controlAction === 'forward') {
        moveInDirection(currentFacing);
        return;
      }

      setPlayerFacing(getFacingAfterTurn(currentFacing, controlAction));
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    applyForwardEdgeShortcut,
    cycleSelectedCellIcon,
    currentFacing,
    moveInDirection,
    placeSelectedIconAtCurrentCell,
    placeSelectedIconAtForwardCell,
    redo,
    removeCurrentCellIcon,
    setPlayerFacing,
    toggleMode,
    undo,
  ]);

  const handleExport = async () => {
    const documentState = createPersistedDocument(useAppStore.getState());
    const result = await exportDocument(documentState);
    if (result.kind !== 'saved') {
      return;
    }
    setIoNotice({
      tone: 'success',
      message: 'JSON を保存しました。',
    });
  };
  const handleImportClick = async () => {
    const result = await importDocument();
    if (result.kind === 'cancelled') {
      return;
    }
    if (result.kind === 'invalid') {
      setIoNotice({
        tone: 'error',
        message: 'JSON の読込に失敗しました。',
      });
      return;
    }
    const loaded = loadPersistedDocument(result.document);
    setIoNotice({
      tone: loaded ? 'success' : 'error',
      message: loaded ? 'JSON を読み込みました。' : 'JSON の読込に失敗しました。',
    });
  };

  const navigatorPanel = (
    <ShellPanel
      className={isTallViewport ? 'h-[clamp(320px,34dvh,420px)]' : ''}
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
          title="Floor Selector"
          body="各階層は独立した `cells / edges / icons` を持ちます。選択はコンボボックス、名前変更は下の入力欄で行います。"
        />
        <label className="grid gap-2">
          <span className="text-sm text-[var(--color-text-soft)]">Selected Floor</span>
          <select
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-strong)] outline-none ring-0 transition focus:border-[var(--color-border-strong)]"
            value={selectedFloor?.id ?? ''}
            onChange={(event) => setSelectedFloor(event.target.value)}
          >
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {floor.name} ({floor.width} x {floor.height})
              </option>
            ))}
          </select>
        </label>
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
          title="Expand Grid"
          body="右 / 下は末尾へ、上 / 左は既存要素を平行移動して 4 マスずつ拡張します。"
        />
        <div className="grid grid-cols-2 gap-2">
          <ShortcutButton label="+4 Left" onClick={() => expandSelectedFloorLeft()} />
          <ShortcutButton label="+4 Up" onClick={() => expandSelectedFloorUp()} />
          <ShortcutButton label="+4 Right" onClick={() => expandSelectedFloorRight()} />
          <ShortcutButton label="+4 Down" onClick={() => expandSelectedFloorDown()} />
        </div>
      </section>

      <section className="space-y-3">
        <PanelHeading
          eyebrow="Keyboard"
          title="Movement"
          body="`W / ↑` で前進、`A / ←` と `D / →` で方向変更、`S / ↓` で後ろを向きます。"
        />
        <MovementPad
          currentFacing={currentFacing}
          onForward={() => moveInDirection(currentFacing)}
          onTurn={(action) => setPlayerFacing(getFacingAfterTurn(currentFacing, action))}
        />
      </section>

      <section className="space-y-3">
        <PanelHeading
          eyebrow="Shortcuts"
          title="Forward Edge"
          body="前方境界を `1:wall`, `2:open door`, `3:open`, `4:closed door`, `0:unknown` で即時編集できます。"
        />
        <div className="grid grid-cols-2 gap-2">
          <ShortcutButton label="1 wall" onClick={() => applyForwardEdgeShortcut('wall')} />
          <ShortcutButton label="2 open door" onClick={() => applyForwardEdgeShortcut('door')} />
          <ShortcutButton label="3 open" onClick={() => applyForwardEdgeShortcut('open')} />
          <ShortcutButton
            label="4 closed door"
            onClick={() => applyForwardEdgeShortcut('closed-door')}
          />
          <ShortcutButton
            label="0 unknown"
            onClick={() => applyForwardEdgeShortcut('unknown')}
          />
        </div>
      </section>
    </ShellPanel>
  );

  const mapSection = (
    <section
      className={`flex min-w-0 flex-col overflow-hidden border border-[var(--color-border)] bg-transparent ${
        isTallViewport ? 'h-[clamp(420px,56dvh,720px)]' : 'h-full min-h-0'
      }`}
    >
      <div className="flex shrink-0 flex-col gap-1.5 border-b border-[var(--color-border)] px-3 py-1.5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">
            Map Canvas
          </p>
          <h2 className="mt-0.5 text-[13px] font-semibold tracking-[-0.02em] text-[var(--color-text-strong)]">
            Floor Workspace
          </h2>
        </div>

        <div className="grid gap-1.5 sm:grid-cols-3 xl:grid-cols-6">
          <ToolbarButton label="Undo" onClick={undo} disabled={!canUndo} />
          <ToolbarButton label="Redo" onClick={redo} disabled={!canRedo} />
          <ToolbarButton
            label="Zoom -"
            onClick={() => setViewport({ zoom: viewport.zoom - 0.15 })}
          />
          <ToolbarButton
            label="Zoom +"
            onClick={() => setViewport({ zoom: viewport.zoom + 0.15 })}
          />
          <ToolbarButton label="Reset View" onClick={resetViewport} />
          <div className="px-1 py-1.5 text-center text-[11px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
            {selectedFloor?.width ?? 0} x {selectedFloor?.height ?? 0}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-0">
        <MapCanvas />
      </div>
    </section>
  );

  const workspacePanel = (
    <ShellPanel
      className={isTallViewport ? 'h-[clamp(320px,34dvh,420px)]' : ''}
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
          body="変更は現在の実行環境に応じた autosave 先へ保存され、JSON でも入出力できます。"
        />
        <div className="grid gap-2">
          <ShortcutButton label="Save JSON" onClick={handleExport} />
          <ShortcutButton label="Load JSON" onClick={handleImportClick} />
        </div>
        <div className="border-t border-[var(--color-border)] pt-3 text-sm leading-6 text-[var(--color-text-soft)]">
          <p>Auto save target: `{storageDescriptor.label}`</p>
          <p>Detail: `{storageDescriptor.detail}`</p>
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
          <ActionButton
            active={false}
            label="Left"
            onClick={() => setViewport({ offsetX: viewport.offsetX - VIEWPORT_PAN_STEP })}
          />
          <ActionButton active={false} label="Center" onClick={resetViewport} />
          <ActionButton
            active={false}
            label="Right"
            onClick={() => setViewport({ offsetX: viewport.offsetX + VIEWPORT_PAN_STEP })}
          />
          <ActionButton
            active={false}
            label="Up"
            onClick={() => setViewport({ offsetY: viewport.offsetY - VIEWPORT_PAN_STEP })}
          />
          <ActionButton
            active={false}
            label="Zoom -"
            onClick={() => setViewport({ zoom: viewport.zoom - 0.15 })}
          />
          <ActionButton
            active={false}
            label="Down"
            onClick={() => setViewport({ offsetY: viewport.offsetY + VIEWPORT_PAN_STEP })}
          />
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
  );

  return (
    <div
      className={`bg-[var(--color-app)] text-[var(--color-text)] ${
        isTallViewport ? 'min-h-[100dvh]' : 'h-[100dvh] overflow-hidden'
      }`}
    >
      <div
        className={`mx-auto flex w-full max-w-[1680px] flex-col px-3 py-3 sm:px-4 lg:px-5 ${
          isTallViewport ? 'min-h-[100dvh]' : 'h-full'
        }`}
      >
        {!isTallViewport ? (
          <header className="mb-2 shrink-0 border-b border-[var(--color-border)] pb-1.5">
            <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <h1 className="text-[2rem] font-semibold leading-none tracking-[-0.04em] text-[var(--color-text-strong)]">
                    Web Auto Mapping
                  </h1>
                  <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                    One Page Layout
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-[var(--color-text-soft)]">
                  左右は独立スクロール、中央は常時表示のままホイールでズームします。
                </p>
              </div>

              <div className="grid gap-x-3 gap-y-1 sm:grid-cols-3 xl:grid-cols-6 xl:items-end">
                <StatusChip label="Mode" value={mode} />
                <StatusChip label="Floor" value={selectedFloor?.name ?? 'N/A'} />
                <StatusChip label="Auto Map" value={autoMapping} />
                <StatusChip label="Tool" value={selectedTool} />
                <StatusChip label="Icon" value={selectedCellIconKind} />
                <StatusChip label="Zoom" value={`${Math.round(viewport.zoom * 100)}%`} />
              </div>
            </div>
          </header>
        ) : null}

        {isTallViewport ? (
          <main className="grid content-start gap-2">
            {mapSection}
            <div className="grid justify-center gap-2 [grid-template-columns:repeat(auto-fit,minmax(260px,280px))]">
              {navigatorPanel}
              {workspacePanel}
            </div>
          </main>
        ) : (
          <main className="grid min-h-0 flex-1 gap-2 overflow-y-auto [grid-template-columns:minmax(220px,264px)_minmax(0,1fr)_minmax(220px,264px)] overflow-x-hidden xl:[grid-template-columns:280px_minmax(0,1fr)_280px]">
            {navigatorPanel}
            {mapSection}
            {workspacePanel}
          </main>
        )}
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
    <div className="flex items-baseline gap-2 border-b border-[var(--color-border)] py-1 last:border-b-0 xl:border-b-0">
      <p className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">{label}</p>
      <p className="min-w-0 truncate text-[13px] font-medium capitalize leading-none text-[var(--color-text-strong)] sm:text-sm">
        {value}
      </p>
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

function ToolbarButton({ disabled = false, label, onClick }: ShortcutButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border px-2.5 py-1.5 text-[13px] font-medium leading-5 transition ${
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
  onForward: () => void;
  onTurn: (action: Exclude<RelativeControlAction, 'forward'>) => void;
};

function MovementPad({ currentFacing, onForward, onTurn }: MovementPadProps) {
  return (
    <div className="grid gap-2">
      <div className="flex justify-center">
        <ActionButton active={false} label="forward" onClick={onForward} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <ActionButton active={false} label="turn left" onClick={() => onTurn('turn-left')} />
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-3 py-3 text-center text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
          Facing {currentFacing}
        </div>
        <ActionButton active={false} label="turn right" onClick={() => onTurn('turn-right')} />
      </div>
      <div className="flex justify-center">
        <ActionButton active={false} label="turn back" onClick={() => onTurn('turn-back')} />
      </div>
    </div>
  );
}

function getRelativeControlActionFromKeyboardEvent(
  event: KeyboardEvent,
): RelativeControlAction | null {
  switch (event.key.toLowerCase()) {
    case 'w':
    case 'arrowup':
      return 'forward';
    case 'd':
    case 'arrowright':
      return 'turn-right';
    case 's':
    case 'arrowdown':
      return 'turn-back';
    case 'a':
    case 'arrowleft':
      return 'turn-left';
    default:
      return null;
  }
}

function getFacingAfterTurn(
  facing: Facing,
  action: Exclude<RelativeControlAction, 'forward'>,
): Facing {
  if (action === 'turn-back') {
    return getFacingAfterTurn(getFacingAfterTurn(facing, 'turn-left'), 'turn-left');
  }

  const facings: Facing[] = ['north', 'east', 'south', 'west'];
  const currentIndex = facings.indexOf(facing);
  const offset = action === 'turn-right' ? 1 : -1;

  return facings[(currentIndex + offset + facings.length) % facings.length];
}

export default App;

