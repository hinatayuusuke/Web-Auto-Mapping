import { useEffect, useMemo, useState } from 'react';
import {
  GlobalShortcutRegistrationState,
} from '../hooks/useGlobalShortcutRegistration';
import {
  GLOBAL_SHORTCUT_ACTIONS,
  GlobalShortcutActionId,
} from '../lib/globalShortcutActions';
import { GlobalShortcutPreferences } from '../lib/globalShortcutPreferences';

type GlobalShortcutSettingsDialogProps = {
  activeCount: number;
  loaded: boolean;
  onClose: () => void;
  preferences: GlobalShortcutPreferences;
  resetDefaults: () => void;
  setBindingEnabled: (actionId: GlobalShortcutActionId, enabled: boolean) => void;
  setEnabled: (enabled: boolean) => void;
  setShortcut: (actionId: GlobalShortcutActionId, shortcut: string) => void;
  statusByAction: GlobalShortcutRegistrationState;
  supported: boolean;
};

const SHORTCUT_GROUPS = ['Forward Edge', 'Cell Icon'] as const;
const MODIFIER_KEYS = new Set(['Alt', 'Control', 'Meta', 'Shift']);

export function GlobalShortcutSettingsDialog({
  activeCount,
  loaded,
  onClose,
  preferences,
  resetDefaults,
  setBindingEnabled,
  setEnabled,
  setShortcut,
  statusByAction,
  supported,
}: GlobalShortcutSettingsDialogProps) {
  const [recordingActionId, setRecordingActionId] = useState<GlobalShortcutActionId | null>(null);
  const bindingByAction = useMemo(
    () => new Map(preferences.bindings.map((binding) => [binding.actionId, binding])),
    [preferences.bindings],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (recordingActionId) {
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, recordingActionId]);

  useEffect(() => {
    if (!recordingActionId) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.key === 'Escape') {
        setRecordingActionId(null);
        return;
      }

      if (MODIFIER_KEYS.has(event.key)) {
        return;
      }

      setShortcut(recordingActionId, formatShortcutFromKeyboardEvent(event));
      setRecordingActionId(null);
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [recordingActionId, setShortcut]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !recordingActionId) {
          onClose();
        }
      }}
    >
      <section
        aria-modal="true"
        aria-labelledby="global-shortcut-dialog-title"
        role="dialog"
        className="flex max-h-[min(760px,92dvh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--color-border-strong)] bg-[rgba(8,17,28,0.98)] shadow-[0_24px_80px_rgba(0,0,0,0.48)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--color-border)] px-4 py-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
              Tauri
            </p>
            <h3
              id="global-shortcut-dialog-title"
              className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[var(--color-text-strong)]"
            >
              Global Shortcuts
            </h3>
            <p className="mt-1 text-sm leading-5 text-[var(--color-text-soft)]">
              Forward Edge and current-cell icon helpers only
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(recordingActionId)}
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-soft)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-strong)]">
                {supported ? `${activeCount} active bindings` : 'Tauri only'}
              </p>
              <p className="mt-0.5 text-xs leading-5 text-[var(--color-text-soft)]">
                {supported
                  ? 'Master toggle controls whether configured shortcuts are registered'
                  : 'Global shortcut registration is unavailable in the web runtime'}
              </p>
            </div>
            <button
              type="button"
              disabled={!supported || !loaded}
              onClick={() => setEnabled(!preferences.enabled)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                !supported || !loaded
                  ? 'cursor-not-allowed border-[var(--color-border)] text-[var(--color-muted)] opacity-60'
                  : preferences.enabled
                    ? 'border-[var(--color-border-strong)] bg-[rgba(87,159,255,0.12)] text-[var(--color-text-strong)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-soft)] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-strong)]'
              }`}
            >
              {preferences.enabled ? 'On' : 'Off'}
            </button>
          </div>

          <div className="border-y border-[var(--color-border)]">
            {SHORTCUT_GROUPS.map((group) => (
              <div key={group} className="border-b border-[var(--color-border)] last:border-b-0">
                <p className="px-1 py-2 text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
                  {group}
                </p>
                <div className="divide-y divide-[var(--color-border)]">
                  {GLOBAL_SHORTCUT_ACTIONS.filter((action) => action.group === group).map(
                    (action) => {
                      const binding = bindingByAction.get(action.id);
                      const status = statusByAction[action.id];

                      if (!binding) {
                        return null;
                      }

                      return (
                        <div key={action.id} className="grid gap-2 py-2 sm:grid-cols-[1fr_auto]">
                          <div className="min-w-0">
                            <label className="flex items-center gap-2 text-sm text-[var(--color-text-strong)]">
                              <input
                                type="checkbox"
                                checked={binding.enabled}
                                disabled={!supported || !loaded}
                                onChange={(event) =>
                                  setBindingEnabled(action.id, event.currentTarget.checked)
                                }
                              />
                              <span>{action.label}</span>
                            </label>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-soft)]">
                              <code className="rounded-md border border-[var(--color-border)] px-2 py-1 text-[11px] text-[var(--color-text-strong)]">
                                {recordingActionId === action.id
                                  ? 'Press shortcut...'
                                  : binding.shortcut || 'Unassigned'}
                              </code>
                              <span className={getStatusClassName(status.tone)}>
                                {status.message}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={!supported || !loaded}
                              onClick={() => setRecordingActionId(action.id)}
                              className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-text-soft)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Record
                            </button>
                            <button
                              type="button"
                              disabled={!supported || !loaded}
                              onClick={() => setShortcut(action.id, '')}
                              className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs text-[var(--color-text-soft)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-strong)] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-3">
          <p className="text-xs leading-5 text-[var(--color-text-soft)]">
            {recordingActionId ? 'Press Esc to cancel recording' : 'Esc closes this dialog'}
          </p>
          <button
            type="button"
            disabled={!supported || !loaded}
            onClick={() => {
              resetDefaults();
              setRecordingActionId(null);
            }}
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-soft)] transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-strong)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset defaults
          </button>
        </div>
      </section>
    </div>
  );
}

function formatShortcutFromKeyboardEvent(event: KeyboardEvent) {
  const parts: string[] = [];

  if (event.ctrlKey) {
    parts.push('Ctrl');
  }

  if (event.altKey) {
    parts.push('Alt');
  }

  if (event.shiftKey) {
    parts.push('Shift');
  }

  if (event.metaKey) {
    parts.push('Meta');
  }

  parts.push(normalizeShortcutKey(event.key));

  return parts.join('+');
}

function normalizeShortcutKey(key: string) {
  if (key.length === 1) {
    return key.toUpperCase();
  }

  if (key === ' ') {
    return 'Space';
  }

  return key;
}

function getStatusClassName(tone: 'idle' | 'success' | 'error') {
  switch (tone) {
    case 'success':
      return 'text-emerald-200';
    case 'error':
      return 'text-rose-200';
    case 'idle':
      return 'text-[var(--color-muted)]';
  }
}
