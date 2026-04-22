import { PropsWithChildren } from 'react';

type ShellPanelProps = PropsWithChildren<{
  className?: string;
  title: string;
  description: string;
}>;

export function ShellPanel({
  className = '',
  title,
  description,
  children,
}: ShellPanelProps) {
  return (
    <aside
      className={`flex min-h-0 flex-col overflow-hidden border border-[var(--color-border)] bg-transparent ${className}`}
    >
      <header className="shrink-0 border-b border-[var(--color-border)] px-5 py-4">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">Panel</p>
        <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[var(--color-text-strong)]">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--color-text-soft)]">{description}</p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
        <div className="grid gap-6">{children}</div>
      </div>
    </aside>
  );
}
