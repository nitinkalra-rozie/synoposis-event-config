import {
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, take, timer } from 'rxjs';

@Directive({
  selector: '[focusOnShow]',
})
export class FocusOnShow {
  constructor() {
    effect(() => {
      if (this._focusedSubscription) {
        this._focusedSubscription?.unsubscribe();
      }

      const shouldFocus = this.shouldFocus();
      const targetSelector = this.focusTarget();
      const delay = this.focusDelay();

      if (shouldFocus) {
        this._previouslyFocusedElement = document.activeElement as HTMLElement;

        requestAnimationFrame(() => {
          this._focusedSubscription = timer(delay)
            .pipe(take(1), takeUntilDestroyed(this._destroyRef))
            .subscribe(() => {
              const targetElement = targetSelector
                ? (this._elementRef.nativeElement.querySelector(
                    targetSelector
                  ) as HTMLElement)
                : this._elementRef.nativeElement;

              targetElement?.focus();
              this._focusedSubscription?.unsubscribe();
            });
        });
      } else if (
        !shouldFocus &&
        this.restoreFocus() &&
        this._previouslyFocusedElement
      ) {
        queueMicrotask(() => {
          this._previouslyFocusedElement?.focus();
          this._previouslyFocusedElement = undefined;
        });
      }
    });
  }

  public readonly shouldFocus = input.required<boolean>({
    alias: 'focusOnShow',
  });
  public readonly focusDelay = input<number>(50);
  public readonly restoreFocus = input<boolean>(true);
  public readonly focusTarget = input<string>();

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _elementRef = inject(ElementRef<HTMLElement>);
  private _previouslyFocusedElement?: HTMLElement;
  private _focusedSubscription?: Subscription;
}
