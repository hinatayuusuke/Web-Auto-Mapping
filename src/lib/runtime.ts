import { isTauri } from '@tauri-apps/api/core';

export type RuntimeEnvironment = 'tauri' | 'web';

export function getRuntimeEnvironment(): RuntimeEnvironment {
  if (typeof window === 'undefined') {
    return 'web';
  }

  return isTauri() ? 'tauri' : 'web';
}

export function isTauriRuntime() {
  return getRuntimeEnvironment() === 'tauri';
}
