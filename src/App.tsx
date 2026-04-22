import { MapCanvas } from './components/MapCanvas';
import { ShellPanel } from './components/ShellPanel';
import { useAppStore } from './store/appStore';

function App() {
  const mode = useAppStore((state) => state.mode);
  const selectedFloorId = useAppStore((state) => state.selectedFloorId);
  const floors = useAppStore((state) => state.floors);
  const autoMapping = useAppStore((state) => state.autoMapping);

  const selectedFloor = floors.find((floor) => floor.id === selectedFloorId);

  return (
    <div className="min-h-screen bg-[var(--color-app)] text-[var(--color-text)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="mb-4 flex flex-col gap-4 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-4 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--color-muted)]">
                Phase 0 Foundation
              </p>
              <div>
                <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[var(--color-text-strong)]">
                  Web Auto Mapping
                </h1>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--color-text-soft)]">
                  Explore / Map の 2 モードを載せる前提で、レイアウト、型、状態、Canvas
                  の土台だけを先に成立させた実装ベース。
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <StatusChip label="Mode" value={mode} />
              <StatusChip label="Floor" value={selectedFloor?.name ?? 'N/A'} />
              <StatusChip label="Auto Map" value={autoMapping} />
            </div>
          </div>
        </header>

        <main className="grid flex-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)_320px]">
          <ShellPanel
            title="Navigator"
            description="モード、階層、現在地など、探索の基礎情報を集約する領域。"
          >
            <section className="space-y-3">
              <PanelHeading
                eyebrow="Current Setup"
                title="Session"
                body="探索モードの既定値と現在のプレイヤー状態を確認します。"
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
                eyebrow="Milestone"
                title="Phase 0 Scope"
                body="実装済みの土台と、次フェーズで差し込むべき領域を切り分けています。"
              />
              <ul className="space-y-2 text-sm leading-6 text-[var(--color-text-soft)]">
                <li>固定サイズのグリッドを Canvas へ描画</li>
                <li>マップ、プレイヤー、UI 設定の型と Zustand ストアを配置</li>
                <li>左右ペイン + 中央キャンバスのベースレイアウトを構築</li>
              </ul>
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
            description="ツール、表示設定、次の実装フックを置く右ペイン。"
          >
            <section className="space-y-3">
              <PanelHeading
                eyebrow="Tools"
                title="Reserved Panels"
                body="Phase 1 以降で編集ツールと表示設定を差し込むためのプレースホルダです。"
              />
              <div className="grid gap-3">
                <GhostCard title="Editing Tools" description="壁、ドア、アイコン操作の UI をここへ追加します。" />
                <GhostCard title="Viewport" description="ズーム、パン、表示オプションの制御をここへ追加します。" />
                <GhostCard title="Persistence" description="保存、読込、自動保存設定の入口をここへ追加します。" />
              </div>
            </section>

            <section className="space-y-3">
              <PanelHeading
                eyebrow="Data Model"
                title="Store Shape"
                body="Phase 1 のセル / エッジ分離に備えて、状態の責務だけ先に固定しています。"
              />
              <dl className="grid gap-3">
                <KeyValueRow label="Floors" value={`${floors.length}`} />
                <KeyValueRow label="Grid Expansion" value="pending" />
                <KeyValueRow label="Undo / Redo" value="pending" />
              </dl>
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
      <p className="mt-1 text-sm font-medium text-[var(--color-text-strong)]">{value}</p>
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
      <dd className="text-sm font-medium text-[var(--color-text-strong)]">{value}</dd>
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

export default App;
