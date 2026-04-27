import { useAppStore } from '../store/appStore';

export type GlobalShortcutActionId =
  | 'forward-edge-wall'
  | 'forward-edge-door'
  | 'forward-edge-open'
  | 'forward-edge-closed-door'
  | 'forward-edge-unknown'
  | 'cell-icon-previous'
  | 'cell-icon-next'
  | 'cell-icon-place-current'
  | 'cell-icon-remove-current';

export type GlobalShortcutActionDefinition = {
  defaultShortcut: string;
  group: 'Forward Edge' | 'Cell Icon';
  id: GlobalShortcutActionId;
  label: string;
};

export const GLOBAL_SHORTCUT_ACTIONS: GlobalShortcutActionDefinition[] = [
  {
    defaultShortcut: 'Ctrl+Alt+1',
    group: 'Forward Edge',
    id: 'forward-edge-wall',
    label: 'Wall',
  },
  {
    defaultShortcut: 'Ctrl+Alt+2',
    group: 'Forward Edge',
    id: 'forward-edge-door',
    label: 'Open door',
  },
  {
    defaultShortcut: 'Ctrl+Alt+3',
    group: 'Forward Edge',
    id: 'forward-edge-open',
    label: 'Open',
  },
  {
    defaultShortcut: 'Ctrl+Alt+4',
    group: 'Forward Edge',
    id: 'forward-edge-closed-door',
    label: 'Closed door',
  },
  {
    defaultShortcut: 'Ctrl+Alt+0',
    group: 'Forward Edge',
    id: 'forward-edge-unknown',
    label: 'Unknown',
  },
  {
    defaultShortcut: 'Ctrl+Alt+[',
    group: 'Cell Icon',
    id: 'cell-icon-previous',
    label: 'Previous icon',
  },
  {
    defaultShortcut: 'Ctrl+Alt+]',
    group: 'Cell Icon',
    id: 'cell-icon-next',
    label: 'Next icon',
  },
  {
    defaultShortcut: 'Ctrl+Alt+I',
    group: 'Cell Icon',
    id: 'cell-icon-place-current',
    label: 'Place current cell',
  },
  {
    defaultShortcut: 'Ctrl+Alt+Backspace',
    group: 'Cell Icon',
    id: 'cell-icon-remove-current',
    label: 'Remove current cell',
  },
];

export function executeGlobalShortcutAction(actionId: GlobalShortcutActionId) {
  const state = useAppStore.getState();

  switch (actionId) {
    case 'forward-edge-wall':
      state.applyForwardEdgeShortcut('wall');
      return;
    case 'forward-edge-door':
      state.applyForwardEdgeShortcut('door');
      return;
    case 'forward-edge-open':
      state.applyForwardEdgeShortcut('open');
      return;
    case 'forward-edge-closed-door':
      state.applyForwardEdgeShortcut('closed-door');
      return;
    case 'forward-edge-unknown':
      state.applyForwardEdgeShortcut('unknown');
      return;
    case 'cell-icon-previous':
      state.cycleSelectedCellIcon(-1);
      return;
    case 'cell-icon-next':
      state.cycleSelectedCellIcon(1);
      return;
    case 'cell-icon-place-current':
      state.placeSelectedIconAtCurrentCell();
      return;
    case 'cell-icon-remove-current':
      state.removeCurrentCellIcon();
      return;
  }
}
