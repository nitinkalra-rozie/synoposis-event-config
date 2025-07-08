import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToastConfig, ToastType } from './syn-toast.model';

@Component({
  selector: 'app-syn-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './syn-toast.html',
  styleUrl: './syn-toast.scss',
  imports: [MatIconModule, MatButtonModule],
})
export class SynToastComponent {
  private readonly _toasts = signal<ToastConfig[]>([]);

  protected toastData = computed(() =>
    this._toasts().map((toast) => ({
      ...toast,
      cssClasses: this._getToastClasses(toast),
      iconName: this._getIconName(toast.type),
    }))
  );

  setToasts(toasts: ToastConfig[]): void {
    this._toasts.set(toasts);
  }

  setDismissHandler(handler: (id: string) => void): void {
    this._dismissHandler = handler;
  }

  protected onDismiss(id: string): void {
    this._dismissHandler(id);
  }

  protected onActionClick(toast: ToastConfig): void {
    const action = toast.action;
    if (action) {
      action.handler();
    }
  }

  private _dismissHandler: (id: string) => void = () => {};

  private _getToastClasses(toast: ToastConfig): string {
    const classes = [`syn-toast--${toast.type}`];
    if (toast.dismissing) {
      classes.push('syn-toast--dismissing');
    }
    return classes.join(' ');
  }

  private _getIconName(type: ToastType): string {
    const iconMap: Record<ToastType, string> = {
      success: 'check',
      error: 'syn:exclamation',
      warning: 'syn:warning_outlined',
      info: 'syn:info_outlined',
    };
    return iconMap[type] || 'syn:info_outlined';
  }
}
