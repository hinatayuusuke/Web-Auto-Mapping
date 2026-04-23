import { PersistedDocument } from '../types/map';
import { STORAGE_KEY, parsePersistedDocument } from './persistence';
import { getRuntimeEnvironment } from './runtime';

const TAURI_AUTOSAVE_FILENAME = 'web-auto-mapping.document.json';
const JSON_FILE_FILTER = [{ name: 'JSON', extensions: ['json'] }];

export type DocumentImportResult =
  | {
      kind: 'loaded';
      document: PersistedDocument;
    }
  | {
      kind: 'cancelled';
    }
  | {
      kind: 'invalid';
    };

export type DocumentExportResult =
  | {
      kind: 'saved';
    }
  | {
      kind: 'cancelled';
    };

export type StorageDescriptor = {
  detail: string;
  label: string;
};

export async function loadDocument(): Promise<PersistedDocument | null> {
  return getRuntimeEnvironment() === 'tauri' ? loadDocumentFromTauri() : loadDocumentFromWebStorage();
}

export async function saveDocument(persistedDocument: PersistedDocument) {
  if (getRuntimeEnvironment() === 'tauri') {
    await saveDocumentToTauri(persistedDocument);
    return;
  }

  saveDocumentToWebStorage(persistedDocument);
}

export async function exportDocument(
  persistedDocument: PersistedDocument,
): Promise<DocumentExportResult> {
  return getRuntimeEnvironment() === 'tauri'
    ? exportDocumentFromTauri(persistedDocument)
    : exportDocumentFromWeb(persistedDocument);
}

export async function importDocument(): Promise<DocumentImportResult> {
  return getRuntimeEnvironment() === 'tauri' ? importDocumentFromTauri() : importDocumentFromWeb();
}

export function getStorageDescriptor(): StorageDescriptor {
  return getRuntimeEnvironment() === 'tauri'
    ? {
        label: 'AppData file',
        detail: TAURI_AUTOSAVE_FILENAME,
      }
    : {
        label: 'localStorage',
        detail: STORAGE_KEY,
      };
}

async function loadDocumentFromWebStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return parsePersistedDocument(JSON.parse(raw));
  } catch {
    return null;
  }
}

function saveDocumentToWebStorage(persistedDocument: PersistedDocument) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedDocument));
}

async function exportDocumentFromWeb(
  persistedDocument: PersistedDocument,
): Promise<DocumentExportResult> {
  const blob = new Blob([JSON.stringify(persistedDocument, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = `${slugify(persistedDocument.title)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);

  return { kind: 'saved' };
}

async function importDocumentFromWeb(): Promise<DocumentImportResult> {
  const file = await requestBrowserImportFile();

  if (!file) {
    return { kind: 'cancelled' };
  }

  try {
    const text = await file.text();
    const parsed = parsePersistedDocument(JSON.parse(text));

    return parsed ? { kind: 'loaded', document: parsed } : { kind: 'invalid' };
  } catch {
    return { kind: 'invalid' };
  }
}

async function loadDocumentFromTauri() {
  const { BaseDirectory, exists, readTextFile } = await import('@tauri-apps/plugin-fs');

  if (!(await exists(TAURI_AUTOSAVE_FILENAME, { baseDir: BaseDirectory.AppLocalData }))) {
    return null;
  }

  try {
    const text = await readTextFile(TAURI_AUTOSAVE_FILENAME, { baseDir: BaseDirectory.AppLocalData });

    return parsePersistedDocument(JSON.parse(text));
  } catch {
    return null;
  }
}

async function saveDocumentToTauri(persistedDocument: PersistedDocument) {
  const { BaseDirectory, writeTextFile } = await import('@tauri-apps/plugin-fs');

  await writeTextFile(
    TAURI_AUTOSAVE_FILENAME,
    JSON.stringify(persistedDocument, null, 2),
    { baseDir: BaseDirectory.AppLocalData },
  );
}

async function exportDocumentFromTauri(
  persistedDocument: PersistedDocument,
): Promise<DocumentExportResult> {
  const [{ writeTextFile }, { save }] = await Promise.all([
    import('@tauri-apps/plugin-fs'),
    import('@tauri-apps/plugin-dialog'),
  ]);
  const path = await save({
    defaultPath: `${slugify(persistedDocument.title)}.json`,
    filters: JSON_FILE_FILTER,
  });

  if (!path) {
    return { kind: 'cancelled' };
  }

  await writeTextFile(path, JSON.stringify(persistedDocument, null, 2));

  return { kind: 'saved' };
}

async function importDocumentFromTauri(): Promise<DocumentImportResult> {
  const [{ readTextFile }, { open }] = await Promise.all([
    import('@tauri-apps/plugin-fs'),
    import('@tauri-apps/plugin-dialog'),
  ]);
  const selected = await open({
    directory: false,
    filters: JSON_FILE_FILTER,
    multiple: false,
  });

  if (!selected || Array.isArray(selected)) {
    return { kind: 'cancelled' };
  }

  try {
    const text = await readTextFile(selected);
    const parsed = parsePersistedDocument(JSON.parse(text));

    return parsed ? { kind: 'loaded', document: parsed } : { kind: 'invalid' };
  } catch {
    return { kind: 'invalid' };
  }
}

function requestBrowserImportFile(): Promise<File | null> {
  if (typeof document === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');

    input.type = 'file';
    input.accept = 'application/json,.json';
    input.style.display = 'none';

    const cleanup = () => {
      input.remove();
    };

    input.addEventListener(
      'change',
      () => {
        const file = input.files?.[0] ?? null;

        cleanup();
        resolve(file);
      },
      { once: true },
    );

    input.addEventListener(
      'cancel',
      () => {
        cleanup();
        resolve(null);
      },
      { once: true },
    );

    document.body.appendChild(input);
    input.click();
  });
}

function slugify(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return normalized.length > 0 ? normalized : 'web-auto-mapping';
}
