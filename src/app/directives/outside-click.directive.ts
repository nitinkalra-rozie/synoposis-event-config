import { Directive, ElementRef, Output, EventEmitter, Renderer2, OnInit, OnDestroy } from '@angular/core';

@Directive({
    selector: '[appOutSideClick]',
    standalone: true,
})
export class OutsideClickDirective implements OnInit, OnDestroy {
  @Output() outSideClick = new EventEmitter<void>();
  constructor(
    private element: ElementRef,
    private renderer: Renderer2
  ) {}

  private listener: (() => void) | undefined;

  // Execute this function when click outside of the dropdown-container
  onDocumentClick = (event: Event) => {
    if (!this.element.nativeElement.parentElement.contains(event.target)) {
      this.outSideClick.emit();
    }
  };

  //Add the listener when the dropdown component is rendered
  ngOnInit(): void {
    this.listener = this.renderer.listen('document', 'click', this.onDocumentClick);
  }

  //To reduce unnecessary memory leaks you need to use the clean-up
  ngOnDestroy(): void {
    if (this.listener) {
      this.listener();
    }
  }
}
