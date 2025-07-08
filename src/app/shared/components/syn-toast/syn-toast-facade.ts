import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  ComponentRef,
  DestroyRef,
  Injectable,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, timer } from 'rxjs';
import { SYN_TOAST_CONSTANTS } from 'src/app/shared/components/syn-toast/syn-toast-constants';
import { SynToastComponent } from './syn-toast';
import { ToastConfig, ToastContainerConfig, ToastRef } from './syn-toast.model';

@Injectable({ providedIn: 'root' })
export class SynToastFacade {
  constructor() {
    this._destroyRef.onDestroy(() => {
      this._cleanupAll();
    });
  }

  private readonly _overlay = inject(Overlay);
  private readonly _destroyRef = inject(DestroyRef);

  private readonly _toasts = signal<ToastConfig[]>([]);
  private readonly _containerConfig = signal<ToastContainerConfig>({
    position: {
      top: SYN_TOAST_CONSTANTS.DEFAULT_POSITION_TOP,
      right: SYN_TOAST_CONSTANTS.DEFAULT_POSITION_RIGHT,
    },
    maxToasts: SYN_TOAST_CONSTANTS.DEFAULT_MAX_TOASTS,
  });

  private readonly _activeTimers = new Map<string, Subscription>();
  private _overlayRef: OverlayRef | null = null;
  private _toastComponentRef: ComponentRef<SynToastComponent> | null = null;

  showSuccess(
    message: string,
    duration = SYN_TOAST_CONSTANTS.DEFAULT_DURATION
  ): ToastRef {
    return this.show({ type: 'success', message, duration, dismissible: true });
  }

  showError(message: string, duration = 0): ToastRef {
    return this.show({ type: 'error', message, duration, dismissible: true });
  }

  showWarning(
    message: string,
    duration = SYN_TOAST_CONSTANTS.DEFAULT_DURATION
  ): ToastRef {
    return this.show({ type: 'warning', message, duration, dismissible: true });
  }

  showInfo(
    message: string,
    duration = SYN_TOAST_CONSTANTS.DEFAULT_DURATION
  ): ToastRef {
    return this.show({ type: 'info', message, duration, dismissible: true });
  }

  show(config: Omit<ToastConfig, 'id' | 'createdAt'>): ToastRef {
    if (!config.message?.trim()) {
      throw new Error('Toast message cannot be empty');
    }

    const toast = this._createToast(config);

    this._ensureOverlay();
    this._addToast(toast);
    this._setupAutoDismiss(toast);

    return { id: toast.id, dismiss: () => this.dismiss(toast.id) };
  }

  dismiss(id: string): void {
    if (!id?.trim()) {
      console.warn('Cannot dismiss toast: invalid ID provided');
      return;
    }
    this._animateDismiss(id);
  }

  dismissAll(): void {
    this._animateDismissAll();
  }

  updateContainerConfig(config: Partial<ToastContainerConfig>): void {
    this._containerConfig.update((current) => ({ ...current, ...config }));
    this._updateOverlayPosition();
  }

  private _createToast(
    config: Omit<ToastConfig, 'id' | 'createdAt'>
  ): ToastConfig {
    return {
      id: this._generateId(),
      duration: SYN_TOAST_CONSTANTS.DEFAULT_DURATION,
      dismissible: true,
      ...config,
      createdAt: Date.now(),
    };
  }

  private _addToast(toast: ToastConfig): void {
    this._toasts.update((toasts) => {
      const newToasts = [toast, ...toasts];
      return this._enforceMaxToasts(newToasts);
    });

    this._updateComponent();
  }

  private _removeToast(id: string): void {
    const currentToasts = this._toasts();
    const toastExists = currentToasts.some((toast) => toast.id === id);

    if (!toastExists) {
      console.warn(`Toast with id ${id} not found for removal`);
      return;
    }

    this._cleanupTimer(id);
    this._cleanupTimer(`removal-${id}`);

    this._toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));

    const remainingToasts = this._toasts();
    if (remainingToasts.length === 0) {
      this._destroyOverlay();
    } else {
      this._updateComponent();
    }
  }

  private _enforceMaxToasts(toasts: ToastConfig[]): ToastConfig[] {
    const maxToasts =
      this._containerConfig().maxToasts ||
      SYN_TOAST_CONSTANTS.DEFAULT_MAX_TOASTS;

    if (toasts.length <= maxToasts) {
      return toasts;
    }

    const inactiveToasts = this._findInactiveToasts(
      toasts,
      toasts.length - maxToasts
    );

    if (inactiveToasts.length > 0) {
      this._animateMultipleDismiss(inactiveToasts);
      return toasts.map((toast) =>
        inactiveToasts.includes(toast.id)
          ? { ...toast, dismissing: true }
          : toast
      );
    }

    return toasts;
  }

  private _findInactiveToasts(toasts: ToastConfig[], count: number): string[] {
    const inactiveIds: string[] = [];

    for (let i = toasts.length - 1; i >= 0 && inactiveIds.length < count; i--) {
      if (!this._activeTimers.has(toasts[i].id)) {
        inactiveIds.push(toasts[i].id);
      }
    }

    return inactiveIds;
  }

  private _animateDismiss(id: string): void {
    const toast = this._toasts().find((t) => t.id === id);
    if (!toast || toast.dismissing) return;

    this._markAsDismissing(id);
    this._updateComponent();
    this._scheduleRemoval(id);
  }

  private _animateDismissAll(): void {
    const currentToasts = this._toasts();
    if (currentToasts.length === 0) return;

    this._toasts.update((toasts) =>
      toasts.map((toast) => ({ ...toast, dismissing: true }))
    );
    this._updateComponent();

    this._scheduleRemoval(() => {
      this._cleanupAllTimers();
      this._toasts.set([]);
      this._destroyOverlay();
    });
  }

  private _animateMultipleDismiss(ids: string[]): void {
    if (ids.length === 0) return;

    this._toasts.update((toasts) =>
      toasts.map((toast) =>
        ids.includes(toast.id) ? { ...toast, dismissing: true } : toast
      )
    );
    this._updateComponent();

    this._scheduleRemoval(() => {
      ids.forEach((id) => this._cleanupTimer(id));
      this._toasts.update((toasts) =>
        toasts.filter((toast) => !ids.includes(toast.id))
      );
      this._updateComponent();
    });
  }

  private _markAsDismissing(id: string): void {
    this._toasts.update((toasts) =>
      toasts.map((toast) =>
        toast.id === id ? { ...toast, dismissing: true } : toast
      )
    );
  }

  private _scheduleRemoval(idOrCallback: string | (() => void)): void {
    const isCallback = typeof idOrCallback === 'function';

    const removalTimer = timer(SYN_TOAST_CONSTANTS.ANIMATION_DURATION)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
        if (isCallback) {
          (idOrCallback as () => void)();
        } else {
          this._removeToast(idOrCallback as string);
        }
      });

    if (!isCallback) {
      this._activeTimers.set(`removal-${idOrCallback}`, removalTimer);
    }
  }

  private _startAutoTimer(id: string, duration: number): void {
    const toast = this._toasts().find((t) => t.id === id);
    if (!toast || toast.dismissing) return;

    this._cleanupTimer(id);

    const timerSubscription = timer(duration)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this.dismiss(id));

    this._activeTimers.set(id, timerSubscription);
  }

  private _setupAutoDismiss(toast: ToastConfig): void {
    if (!toast.duration || toast.duration <= 0) return;

    this._startAutoTimer(toast.id, toast.duration);
  }

  private _cleanupTimer(id: string): void {
    const activeTimer = this._activeTimers.get(id);
    if (activeTimer) {
      activeTimer.unsubscribe();
      this._activeTimers.delete(id);
    }
  }

  private _cleanupAllTimers(): void {
    this._activeTimers.forEach((timer) => timer.unsubscribe());
    this._activeTimers.clear();
  }

  private _ensureOverlay(): void {
    if (!this._overlayRef) {
      this._createOverlay();
    }
  }

  private _createOverlay(): void {
    const positionStrategy = this._overlay
      .position()
      .global()
      .top(this._containerConfig().position.top || '1rem')
      .right(this._containerConfig().position.right || '1rem');

    this._overlayRef = this._overlay.create({
      positionStrategy,
      hasBackdrop: false,
      panelClass: 'syn-toast-overlay-panel',
    });

    const portal = new ComponentPortal(SynToastComponent);
    this._toastComponentRef = this._overlayRef.attach(portal);

    this._toastComponentRef.instance.setToasts([]);
    this._toastComponentRef.instance.setDismissHandler((id) =>
      this.dismiss(id)
    );
  }

  private _updateComponent(): void {
    if (!this._toastComponentRef) {
      console.warn('Toast component reference not found');
      return;
    }

    const currentToasts = this._toasts();
    this._toastComponentRef.instance.setToasts(currentToasts);
    this._toastComponentRef.instance.setDismissHandler((id) =>
      this.dismiss(id)
    );

    this._toastComponentRef.changeDetectorRef.detectChanges();
  }

  private _updateOverlayPosition(): void {
    if (!this._overlayRef) return;

    const { position } = this._containerConfig();
    const positionStrategy = this._overlay
      .position()
      .global()
      .top(position.top || '1rem')
      .right(position.right || '1rem');

    this._overlayRef.updatePositionStrategy(positionStrategy);
  }

  private _destroyOverlay(): void {
    if (this._overlayRef) {
      this._overlayRef.dispose();
      this._overlayRef = null;
      this._toastComponentRef = null;
    }
  }

  private _generateId(): string {
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 11);
    return `toast-${timestamp}-${randomSuffix}`;
  }

  private _cleanupAll(): void {
    this._cleanupAllTimers();
    this._destroyOverlay();
  }
}
