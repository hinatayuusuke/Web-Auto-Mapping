import {
  AppMode,
  AutoMappingLevel,
  CellIconKind,
  EditTool,
  FloorState,
  PersistedDocument,
  ViewportState,
} from '../types/map';

export const STORAGE_KEY = 'web-auto-mapping.document.v1';
export const DOCUMENT_VERSION = 1;

type SerializableAppState = {
  autoMapping: AutoMappingLevel;
  floors: FloorState[];
  mapTitle: string;
  mode: AppMode;
  selectedCellIconKind: CellIconKind;
  selectedFloorId: string;
  selectedTool: EditTool;
  viewport: ViewportState;
};

export function createPersistedDocument(state: SerializableAppState): PersistedDocument {
  return {
    version: DOCUMENT_VERSION,
    title: state.mapTitle,
    settings: {
      autoMapping: state.autoMapping,
      mode: state.mode,
      selectedCellIconKind: state.selectedCellIconKind,
      selectedTool: state.selectedTool,
    },
    floors: state.floors,
    selectedFloorId: state.selectedFloorId,
    viewport: state.viewport,
  };
}

export function loadPersistedDocumentFromStorage(): PersistedDocument | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    return parsePersistedDocument(parsed);
  } catch {
    return null;
  }
}

export function savePersistedDocumentToStorage(document: PersistedDocument) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(document));
}

export function parsePersistedDocument(input: unknown): PersistedDocument | null {
  if (!isRecord(input)) {
    return null;
  }

  const version = input.version;
  const title = input.title;
  const settings = input.settings;
  const floors = input.floors;
  const selectedFloorId = input.selectedFloorId;
  const viewport = input.viewport;

  if (version !== DOCUMENT_VERSION) {
    return null;
  }

  if (typeof title !== 'string' || typeof selectedFloorId !== 'string') {
    return null;
  }

  if (!isRecord(settings) || !isPersistedSettings(settings)) {
    return null;
  }

  if (!Array.isArray(floors) || floors.some((floor) => !isFloorState(floor))) {
    return null;
  }

  if (!isViewportState(viewport)) {
    return null;
  }

  return {
    version,
    title,
    settings: settings as PersistedDocument['settings'],
    floors,
    selectedFloorId,
    viewport,
  };
}

function isPersistedSettings(value: Record<string, unknown>) {
  return (
    isAutoMappingLevel(value.autoMapping) &&
    isAppMode(value.mode) &&
    isCellIconKind(value.selectedCellIconKind) &&
    isEditTool(value.selectedTool)
  );
}

function isFloorState(value: unknown): value is FloorState {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.width === 'number' &&
    typeof value.height === 'number' &&
    isRecord(value.player) &&
    typeof value.player.x === 'number' &&
    typeof value.player.y === 'number' &&
    typeof value.player.facing === 'string' &&
    Array.isArray(value.cells) &&
    Array.isArray(value.hEdges) &&
    Array.isArray(value.vEdges) &&
    Array.isArray(value.cellIcons) &&
    Array.isArray(value.edgeIcons)
  );
}

function isViewportState(value: unknown): value is ViewportState {
  return (
    isRecord(value) &&
    typeof value.zoom === 'number' &&
    typeof value.offsetX === 'number' &&
    typeof value.offsetY === 'number'
  );
}

function isAutoMappingLevel(value: unknown): value is AutoMappingLevel {
  return value === 'off' || value === 'basic' || value === 'corridor';
}

function isAppMode(value: unknown): value is AppMode {
  return value === 'explore' || value === 'map';
}

function isCellIconKind(value: unknown): value is CellIconKind {
  return value === 'stairs' || value === 'pit' || value === 'chest' || value === 'marker';
}

function isEditTool(value: unknown): value is EditTool {
  return (
    value === 'cell-floor' ||
    value === 'cell-unknown' ||
    value === 'edge-wall' ||
    value === 'edge-door' ||
    value === 'edge-closed-door' ||
    value === 'edge-open' ||
    value === 'edge-unknown' ||
    value === 'cell-icon'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
