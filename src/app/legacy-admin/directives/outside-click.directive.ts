import {
  Directive,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  inject,
} from '@angular/core';

@Directive({
  selector: '[appOutSideClick]',
  standalone: true,
})
export class OutsideClickDirective implements OnInit, OnDestroy {
  private readonly _element = inject(ElementRef<HTMLElement>);
  private readonly _renderer = inject(Renderer2);

  @Output() public readonly outSideClick = new EventEmitter<void>();

  private _unlisten?: () => void;

  ngOnInit(): void {
    this._unlisten = this._renderer.listen(
      'document',
      'click',
      this.onDocumentClick
    );
  }

  ngOnDestroy(): void {
    this._unlisten?.();
  }

  private readonly onDocumentClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const parentElement = this._element.nativeElement?.parentElement;

    if (!parentElement?.contains(target)) {
      this.outSideClick.emit();
    }
  };
}
