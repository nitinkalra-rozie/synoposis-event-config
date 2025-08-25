export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
  readonly id: string;
  readonly type: ToastType;
  readonly message: string;
  readonly duration?: number;
  readonly dismissible?: boolean;
  readonly action?: ToastAction;
  readonly createdAt: number;
  readonly dismissing?: boolean;
}

export interface ToastAction {
  readonly label: string;
  readonly handler: () => void;
}

export interface ToastPosition {
  readonly top?: string;
  readonly bottom?: string;
  readonly left?: string;
  readonly right?: string;
}

export interface ToastContainerConfig {
  readonly position: ToastPosition;
  readonly maxToasts?: number;
  readonly reverseOrder?: boolean;
}

export interface ToastRef {
  readonly id: string;
  dismiss(): void;
}
