import {
  GLOBAL_SHORTCUT_ACTIONS,
  GlobalShortcutActionId,
} from './globalShortcutActions';
import { getRuntimeEnvironment } from './runtime';

const GLOBAL_SHORTCUT_PREFERENCES_FILENAME = 'web-auto-mapping.preferences.json';

export type GlobalShortcutBindingPreference = {
  actionId: GlobalShortcutActionId;
  enabled: boolean;
  shortcut: string;
};

export type GlobalShortcutPreferences = {
  bindings: GlobalShortcutBindingPreference[];
  enabled: boolean;
};

export function createDefaultGlobalShortcutPreferences(): GlobalShortcutPreferences {
  return {
    enabled: false,
    bindings: GLOBAL_SHORTCUT_ACTIONS.map((action) => ({
      actionId: action.id,
      enabled: true,
      shortcut: action.defaultShortcut,
    })),
  };
}

export async function loadGlobalShortcutPreferences(): Promise<GlobalShortcutPreferences> {
  if (getRuntimeEnvironment() !== 'tauri') {
    return createDefaultGlobalShortcutPreferences();
  }

  const { BaseDirectory, exists, readTextFile } = await import('@tauri-apps/plugin-fs');

  if (
    !(await exists(GLOBAL_SHORTCUT_PREFERENCES_FILENAME, {
      baseDir: BaseDirectory.AppLocalData,
    }))
  ) {
    return createDefaultGlobalShortcutPreferences();
  }

  try {
    const text = await readTextFile(GLOBAL_SHORTCUT_PREFERENCES_FILENAME, {
      baseDir: BaseDirectory.AppLocalData,
    });

    return parseGlobalShortcutPreferences(JSON.parse(text));
  } catch {
    return createDefaultGlobalShortcutPreferences();
  }
}

export async function saveGlobalShortcutPreferences(preferences: GlobalShortcutPreferences) {
  if (getRuntimeEnvironment() !== 'tauri') {
    return;
  }

  const { BaseDirectory, writeTextFile } = await import('@tauri-apps/plugin-fs');

  await writeTextFile(
    GLOBAL_SHORTCUT_PREFERENCES_FILENAME,
    JSON.stringify(preferences, null, 2),
    { baseDir: BaseDirectory.AppLocalData },
  );
}

function parseGlobalShortcutPreferences(value: unknown): GlobalShortcutPreferences {
  if (!isRecord(value)) {
    return createDefaultGlobalShortcutPreferences();
  }

  const defaults = createDefaultGlobalShortcutPreferences();
  const rawBindings = Array.isArray(value.bindings) ? value.bindings : [];

  return {
    enabled: typeof value.enabled === 'boolean' ? value.enabled : false,
    bindings: defaults.bindings.map((defaultBinding) => {
      const matchingBinding = rawBindings.find(
        (binding) =>
          isRecord(binding) &&
          binding.actionId === defaultBinding.actionId,
      );

      if (!isRecord(matchingBinding)) {
        return defaultBinding;
      }

      return {
        actionId: defaultBinding.actionId,
        enabled:
          typeof matchingBinding.enabled === 'boolean'
            ? matchingBinding.enabled
            : defaultBinding.enabled,
        shortcut:
          typeof matchingBinding.shortcut === 'string'
            ? matchingBinding.shortcut
            : defaultBinding.shortcut,
      };
    }),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
