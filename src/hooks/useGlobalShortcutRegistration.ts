import { useEffect, useMemo, useState } from 'react';
import {
  GLOBAL_SHORTCUT_ACTIONS,
  GlobalShortcutActionId,
  executeGlobalShortcutAction,
} from '../lib/globalShortcutActions';
import {
  GlobalShortcutBindingPreference,
  GlobalShortcutPreferences,
  createDefaultGlobalShortcutPreferences,
  loadGlobalShortcutPreferences,
  saveGlobalShortcutPreferences,
} from '../lib/globalShortcutPreferences';

export type GlobalShortcutRegistrationStatus = {
  message: string;
  tone: 'idle' | 'success' | 'error';
};

export type GlobalShortcutRegistrationState = Record<
  GlobalShortcutActionId,
  GlobalShortcutRegistrationStatus
>;

export function useGlobalShortcutRegistration(supported: boolean) {
  const [preferences, setPreferences] = useState<GlobalShortcutPreferences>(() =>
    createDefaultGlobalShortcutPreferences(),
  );
  const [loaded, setLoaded] = useState(false);
  const [statusByAction, setStatusByAction] = useState<GlobalShortcutRegistrationState>(() =>
    createStatusState('Not registered', 'idle'),
  );

  useEffect(() => {
    let disposed = false;

    if (!supported) {
      setLoaded(true);
      setStatusByAction(createStatusState('Tauri only', 'idle'));
      return () => {
        disposed = true;
      };
    }

    const loadPreferences = async () => {
      const loadedPreferences = await loadGlobalShortcutPreferences();

      if (disposed) {
        return;
      }

      setPreferences(loadedPreferences);
      setLoaded(true);
    };

    void loadPreferences();

    return () => {
      disposed = true;
    };
  }, [supported]);

  useEffect(() => {
    if (!supported || !loaded) {
      return;
    }

    void saveGlobalShortcutPreferences(preferences);
  }, [loaded, preferences, supported]);

  useEffect(() => {
    if (!supported || !loaded) {
      return undefined;
    }

    if (!preferences.enabled) {
      setStatusByAction(createStatusState('Master off', 'idle'));
      return undefined;
    }

    let disposed = false;
    const registeredShortcuts: string[] = [];

    const registerShortcuts = async () => {
      const nextStatus = createStatusState('Disabled', 'idle');
      const shortcutCounts = getShortcutCounts(preferences.bindings);

      try {
        const { isRegistered, register, unregister } = await import(
          '@tauri-apps/plugin-global-shortcut'
        );

        for (const binding of preferences.bindings) {
          if (!binding.enabled) {
            nextStatus[binding.actionId] = { message: 'Disabled', tone: 'idle' };
            continue;
          }

          const shortcut = binding.shortcut.trim();

          if (!shortcut) {
            nextStatus[binding.actionId] = { message: 'Empty shortcut', tone: 'error' };
            continue;
          }

          if ((shortcutCounts.get(shortcut) ?? 0) > 1) {
            nextStatus[binding.actionId] = { message: 'Duplicate shortcut', tone: 'error' };
            continue;
          }

          if (await isRegistered(shortcut)) {
            nextStatus[binding.actionId] = { message: 'Already registered', tone: 'error' };
            continue;
          }

          try {
            await register(shortcut, (event) => {
              if (disposed || event.state !== 'Pressed') {
                return;
              }

              executeGlobalShortcutAction(binding.actionId);
            });

            if (disposed) {
              await unregister(shortcut);
              return;
            }

            registeredShortcuts.push(shortcut);
            nextStatus[binding.actionId] = { message: 'Registered', tone: 'success' };
          } catch {
            nextStatus[binding.actionId] = { message: 'Register failed', tone: 'error' };
          }
        }
      } catch {
        for (const action of GLOBAL_SHORTCUT_ACTIONS) {
          nextStatus[action.id] = { message: 'Plugin unavailable', tone: 'error' };
        }
      }

      if (!disposed) {
        setStatusByAction(nextStatus);
      }
    };

    void registerShortcuts();

    return () => {
      disposed = true;

      if (registeredShortcuts.length === 0) {
        return;
      }

      void import('@tauri-apps/plugin-global-shortcut').then(({ unregister }) =>
        unregister(registeredShortcuts),
      );
    };
  }, [loaded, preferences, supported]);

  const activeCount = useMemo(
    () =>
      preferences.enabled
        ? preferences.bindings.filter((binding) => binding.enabled && binding.shortcut.trim()).length
        : 0,
    [preferences],
  );

  return {
    activeCount,
    loaded,
    preferences,
    resetDefaults: () => setPreferences(createDefaultGlobalShortcutPreferences()),
    setBindingEnabled: (actionId: GlobalShortcutActionId, enabled: boolean) =>
      setPreferences((current) => updateBinding(current, actionId, { enabled })),
    setEnabled: (enabled: boolean) =>
      setPreferences((current) => ({
        ...current,
        enabled,
      })),
    setShortcut: (actionId: GlobalShortcutActionId, shortcut: string) =>
      setPreferences((current) => updateBinding(current, actionId, { shortcut })),
    statusByAction,
  };
}

function updateBinding(
  preferences: GlobalShortcutPreferences,
  actionId: GlobalShortcutActionId,
  patch: Partial<GlobalShortcutBindingPreference>,
): GlobalShortcutPreferences {
  return {
    ...preferences,
    bindings: preferences.bindings.map((binding) =>
      binding.actionId === actionId ? { ...binding, ...patch } : binding,
    ),
  };
}

function createStatusState(
  message: string,
  tone: GlobalShortcutRegistrationStatus['tone'],
): GlobalShortcutRegistrationState {
  return Object.fromEntries(
    GLOBAL_SHORTCUT_ACTIONS.map((action) => [action.id, { message, tone }]),
  ) as GlobalShortcutRegistrationState;
}

function getShortcutCounts(bindings: GlobalShortcutBindingPreference[]) {
  const counts = new Map<string, number>();

  for (const binding of bindings) {
    if (!binding.enabled) {
      continue;
    }

    const shortcut = binding.shortcut.trim();

    if (!shortcut) {
      continue;
    }

    counts.set(shortcut, (counts.get(shortcut) ?? 0) + 1);
  }

  return counts;
}
