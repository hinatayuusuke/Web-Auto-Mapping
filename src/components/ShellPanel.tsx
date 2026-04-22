import { PropsWithChildren } from 'react';

type ShellPanelProps = PropsWithChildren<{
  title: string;
  description: string;
}>;

export function ShellPanel({ title, description, children }: ShellPanelProps) {
  return (
    <aside className="flex flex-col gap-5 rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-soft)]">
      <header className="border-b border-[var(--color-border)] pb-4">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--color-muted)]">Panel</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--color-text-strong)]">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-soft)]">{description}</p>
      </header>
      <div className="grid gap-5">{children}</div>
    </aside>
  );
}
