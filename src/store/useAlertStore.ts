import { create } from 'zustand';

export type AlertType = 'info' | 'warning' | 'security' | 'danger' | 'error' | 'success';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface ShowAlertOptions {
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

export interface AlertState {
  visible: boolean;
  type: AlertType;
  title: string;
  message?: string;
  buttons: AlertButton[];
  onDismiss?: () => void;
}

interface AlertStore extends AlertState {
  showAlert: (
    optionsOrTitle: ShowAlertOptions | string,
    message?: string,
    buttons?: AlertButton[]
  ) => void;
  hideAlert: () => void;
}

function inferAlertType(title: string, message?: string, buttons?: AlertButton[]): AlertType {
  const lower = `${title} ${message || ''}`.toLowerCase();

  const hasDestructive = buttons?.some((b) => b.style === 'destructive');
  if (
    hasDestructive ||
    lower.includes('delete') ||
    lower.includes('remove') ||
    lower.includes('reset') ||
    lower.includes('wipe')
  ) {
    return 'danger';
  }

  if (
    lower.includes('lock') ||
    lower.includes('pin') ||
    lower.includes('biometric') ||
    lower.includes('security') ||
    lower.includes('vault') ||
    lower.includes('authorize')
  ) {
    return 'security';
  }

  if (
    lower.includes('warning') ||
    lower.includes('exceed') ||
    lower.includes('insufficient') ||
    lower.includes('deficit') ||
    lower.includes('caution')
  ) {
    return 'warning';
  }

  if (
    lower.includes('error') ||
    lower.includes('failed') ||
    lower.includes('cannot') ||
    lower.includes('corrupted')
  ) {
    return 'error';
  }

  if (
    lower.includes('success') ||
    lower.includes('enabled') ||
    lower.includes('restored') ||
    lower.includes('exported') ||
    lower.includes('saved') ||
    lower.includes('completed')
  ) {
    return 'success';
  }

  return 'info';
}

const DEFAULT_OK_BUTTON: AlertButton[] = [{ text: 'OK', style: 'default' }];

export const useAlertStore = create<AlertStore>((set) => ({
  visible: false,
  type: 'info',
  title: '',
  message: undefined,
  buttons: [],
  onDismiss: undefined,

  showAlert: (optionsOrTitle, message, buttons) => {
    if (typeof optionsOrTitle === 'object') {
      const {
        type,
        title,
        message: msg,
        buttons: btns = DEFAULT_OK_BUTTON,
        onDismiss,
      } = optionsOrTitle;

      set({
        visible: true,
        type: type || inferAlertType(title, msg, btns),
        title,
        message: msg,
        buttons: btns.length > 0 ? btns : DEFAULT_OK_BUTTON,
        onDismiss,
      });
    } else {
      const title = optionsOrTitle;
      const btns: AlertButton[] =
        buttons && buttons.length > 0 ? buttons : DEFAULT_OK_BUTTON;
      const inferred = inferAlertType(title, message, btns);

      set({
        visible: true,
        type: inferred,
        title,
        message,
        buttons: btns,
        onDismiss: undefined,
      });
    }
  },

  hideAlert: () => {
    set({
      visible: false,
    });
  },
}));

/**
 * Universal global trigger that can be called anywhere (even outside React components)
 */
export const showAlert = (
  optionsOrTitle: ShowAlertOptions | string,
  message?: string,
  buttons?: AlertButton[]
) => {
  useAlertStore.getState().showAlert(optionsOrTitle, message, buttons);
};

export const hideAlert = () => {
  useAlertStore.getState().hideAlert();
};

/**
 * Convenient React Hook for accessing alert actions
 */
export const useAppAlert = () => {
  const showAlert = useAlertStore((s) => s.showAlert);
  const hideAlert = useAlertStore((s) => s.hideAlert);
  return { showAlert, hideAlert };
};
