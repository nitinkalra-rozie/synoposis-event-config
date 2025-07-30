import {
  AfterViewInit,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';

@Directive({
  selector: '[tooltipOnOverflow]',
  hostDirectives: [
    {
      directive: MatTooltip,
      inputs: ['matTooltipClass', 'matTooltipPosition'],
    },
  ],
})
export class TooltipOnOverflow implements AfterViewInit, OnDestroy {
  constructor() {
    effect(() => {
      const tooltipText = this.tooltipText();

      if (!tooltipText) {
        return;
      }

      requestAnimationFrame(() => {
        this._checkOverflow();
      });
    });
  }

  public readonly tooltipText = input<string>('', {
    alias: 'tooltipOnOverflow',
  });

  private readonly _elementRef = inject(ElementRef<HTMLElement>);
  private readonly _matTooltip = inject(MatTooltip);
  private _resizeObserver?: ResizeObserver;

  ngAfterViewInit(): void {
    this._checkOverflow();
    this._setupResizeObserver();
  }

  ngOnDestroy(): void {
    this._resizeObserver?.disconnect();
  }

  private _checkOverflow(): void {
    const element = this._elementRef.nativeElement;
    const isOverflowing = element.scrollWidth > element.clientWidth;

    if (isOverflowing && this.tooltipText()) {
      this._matTooltip.message = this.tooltipText();
      this._matTooltip.disabled = false;
    } else {
      this._matTooltip.disabled = true;
    }
  }

  private _setupResizeObserver(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this._resizeObserver = new ResizeObserver(() => {
        this._checkOverflow();
      });
      this._resizeObserver.observe(this._elementRef.nativeElement);
    }
  }
}
