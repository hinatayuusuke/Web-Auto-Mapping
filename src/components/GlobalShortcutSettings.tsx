import { useMemo, useState } from 'react';
import {
  GlobalShortcutRegistrationStatus,
  useGlobalShortcutRegistration,
} from '../hooks/useGlobalShortcutRegistration';
import { GlobalShortcutSettingsDialog } from './GlobalShortcutSettingsDialog';

type GlobalShortcutSettingsProps = {
  supported: boolean;
};

export function GlobalShortcutSettings({ supported }: GlobalShortcutSettingsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const registration = useGlobalShortcutRegistration(supported);
  const statusSummary = useMemo(
    () => getStatusSummary(Object.values(registration.statusByAction)),
    [registration.statusByAction],
  );
  const canConfigure = supported && registration.loaded;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-strong)]">
            {supported
              ? `${registration.preferences.enabled ? 'On' : 'Off'} / ${registration.activeCount} active`
              : 'Tauri only'}
          </p>
          <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-soft)]">
            {supported ? statusSummary : 'Global shortcut registration is unavailable in web runtime'}
          </p>
        </div>
        <button
          type="button"
          disabled={!canConfigure}
          onClick={() => setDialogOpen(true)}
          className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text-soft)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-strong)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Configure
        </button>
      </div>

      {dialogOpen ? (
        <GlobalShortcutSettingsDialog
          activeCount={registration.activeCount}
          preferences={registration.preferences}
          resetDefaults={registration.resetDefaults}
          setBindingEnabled={registration.setBindingEnabled}
          setEnabled={registration.setEnabled}
          setShortcut={registration.setShortcut}
          statusByAction={registration.statusByAction}
          supported={supported}
          loaded={registration.loaded}
          onClose={() => setDialogOpen(false)}
        />
      ) : null}
    </div>
  );
}

function getStatusSummary(statuses: GlobalShortcutRegistrationStatus[]) {
  const errorCount = statuses.filter((status) => status.tone === 'error').length;
  const registeredCount = statuses.filter((status) => status.message === 'Registered').length;

  if (errorCount > 0) {
    return `${errorCount} registration issue${errorCount === 1 ? '' : 's'}`;
  }

  if (registeredCount > 0) {
    return `${registeredCount} shortcut${registeredCount === 1 ? '' : 's'} registered`;
  }

  return statuses[0]?.message ?? 'Not registered';
}
