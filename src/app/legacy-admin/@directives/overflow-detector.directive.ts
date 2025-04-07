import {
  AfterViewInit,
  Directive,
  ElementRef,
  inject,
  OnDestroy,
  output,
} from '@angular/core';

@Directive({
  selector: '[appOverflowDetector]',
  standalone: true,
})
export class OverflowDetectorDirective implements AfterViewInit, OnDestroy {
  public overflowChanged = output<boolean>();

  //#region DI
  private _el = inject(ElementRef);
  //#endregion

  private _mutationObserver: MutationObserver;

  ngAfterViewInit(): void {
    this.checkOverflow();

    // Observe changes to the element
    this._mutationObserver = new MutationObserver(() => {
      this.checkOverflow();
    });

    this._mutationObserver.observe(this._el.nativeElement, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  }

  ngOnDestroy(): void {
    if (this._mutationObserver) {
      this._mutationObserver.disconnect();
    }
  }

  private checkOverflow(): void {
    const element = this._el.nativeElement;
    const isOverflowing = element.scrollWidth > element.clientWidth;
    this.overflowChanged.emit(isOverflowing);
  }
}
