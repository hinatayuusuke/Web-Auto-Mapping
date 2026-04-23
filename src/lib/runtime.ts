export type RuntimeEnvironment = 'tauri' | 'web';

export function getRuntimeEnvironment(): RuntimeEnvironment {
  if (typeof window === 'undefined') {
    return 'web';
  }

  const tauriWindow = window as Window & {
    __TAURI_INTERNALS__?: object;
  };

  // WHY: core.isTauri() は withGlobalTauri と同系統のグローバル注入に依存し、
  // release 実行ファイルでも false になり得る。内部 IPC があれば Tauri 実行中とみなす。
  return typeof tauriWindow.__TAURI_INTERNALS__ === 'object' ? 'tauri' : 'web';
}

export function isTauriRuntime() {
  return getRuntimeEnvironment() === 'tauri';
}
