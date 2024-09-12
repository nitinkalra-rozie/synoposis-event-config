import {
  Directive,
  ElementRef,
  Output,
  EventEmitter,
  Renderer2,
  OnInit,
  OnDestroy,
} from '@angular/core';

@Directive({
  selector: '[appOutSideClick]',
  standalone: true,
})
export class OutsideClickDirective implements OnInit, OnDestroy {
  constructor(
    private element: ElementRef,
    private renderer: Renderer2
  ) {}

  @Output() public outSideClick = new EventEmitter<void>();

  private _listener: (() => void) | undefined;

  // Execute this function when click outside of the dropdown-container

  //Add the listener when the dropdown component is rendered
  ngOnInit(): void {
    this._listener = this.renderer.listen(
      'document',
      'click',
      this.onDocumentClick
    );
  }

  //To reduce unnecessary memory leaks you need to use the clean-up
  ngOnDestroy(): void {
    if (this._listener) {
      this._listener();
    }
  }

  private onDocumentClick = (event: Event): void => {
    if (!this.element.nativeElement.parentElement.contains(event.target)) {
      this.outSideClick.emit();
    }
  };
}
