import { MapCanvas } from './components/MapCanvas';
import { ShellPanel } from './components/ShellPanel';
import { useAppStore, useSelectedFloor, useSelectedFloorStats } from './store/appStore';
import { Facing } from './types/map';

const FACINGS: Facing[] = ['north', 'east', 'south', 'west'];

function App() {
  const mode = useAppStore((state) => state.mode);
  const autoMapping = useAppStore((state) => state.autoMapping);
  const floors = useAppStore((state) => state.floors);
  const selectedFloor = useSelectedFloor();
  const selectedFloorStats = useSelectedFloorStats();
  const setMode = useAppStore((state) => state.setMode);
  const setPlayerFacing = useAppStore((state) => state.setPlayerFacing);

  return (
    <div className="min-h-screen bg-[var(--color-app)] text-[var(--color-text)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex flex-col gap-4 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-4 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
                Phase 1 Core Map Model
              </p>
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[var(--color-text-strong)]">
                  Web Auto Mapping
                </h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-soft)]">
                  セル、境界線、アイコン、プレイヤーを分離した状態モデルに切り替え、
                  Canvas と即時同期する基盤まで拡張しました。
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-4">
              <StatusChip label="Mode" value={mode} />
              <StatusChip label="Floor" value={selectedFloor?.name ?? 'N/A'} />
              <StatusChip label="Auto Map" value={autoMapping} />
              <StatusChip
                label="Known Cells"
                value={`${selectedFloorStats?.knownCells ?? 0}`}
              />
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
          <ShellPanel
            title="Navigator"
            description="選択中フロアの座標、向き、コア状態の概要を確認する領域。"
          >
            <section className="space-y-3">
              <PanelHeading
                eyebrow="Current Setup"
                title="Session"
                body="Phase 1 ではプレイヤー、セル、エッジの状態を同じストアで保持します。"
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
                eyebrow="State Check"
                title="Quick Controls"
                body="Canvas がストアの変化を即時反映することを、この最小操作で確認できます。"
              />
              <div className="grid gap-3">
                <div className="grid grid-cols-2 gap-2">
                  <ActionButton
                    active={mode === 'explore'}
                    label="Explore"
                    onClick={() => setMode('explore')}
                  />
                  <ActionButton active={mode === 'map'} label="Map" onClick={() => setMode('map')} />
                </div>
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
            description="マップ構造の内訳と、次フェーズで差し込む探索更新の足場。"
          >
            <section className="space-y-3">
              <PanelHeading
                eyebrow="Data Model"
                title="Selected Floor"
                body="セル、エッジ、アイコンを分離したので、以降の操作ルールを局所化できます。"
              />
              <dl className="grid gap-3">
                <KeyValueRow label="Floors" value={`${floors.length}`} />
                <KeyValueRow label="Known Cells" value={`${selectedFloorStats?.knownCells ?? 0}`} />
                <KeyValueRow label="Open Edges" value={`${selectedFloorStats?.openEdges ?? 0}`} />
                <KeyValueRow label="Wall Edges" value={`${selectedFloorStats?.wallEdges ?? 0}`} />
                <KeyValueRow label="Icons" value={`${(selectedFloorStats?.cellIcons ?? 0) + (selectedFloorStats?.edgeIcons ?? 0)}`} />
              </dl>
            </section>

            <section className="space-y-3">
              <PanelHeading
                eyebrow="Phase 2 Ready"
                title="Next Hooks"
                body="探索更新はこのモデルに対して床・通路・向きを書き込むだけで済む状態です。"
              />
              <div className="grid gap-3">
                <GhostCard title="Movement" description="プレイヤー移動と通路開通を store action として追加します。" />
                <GhostCard title="Auto Mapping" description="Basic / Corridor の自動壁補完を現在のエッジモデルへ載せます。" />
                <GhostCard title="Explore Rules" description="移動した事実を優先する更新規則をここから組み込みます。" />
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

type GhostCardProps = {
  title: string;
  description: string;
};

function GhostCard({ title, description }: GhostCardProps) {
  return (
    <article className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-4">
      <h3 className="text-sm font-medium text-[var(--color-text-strong)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{description}</p>
    </article>
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

export default App;
