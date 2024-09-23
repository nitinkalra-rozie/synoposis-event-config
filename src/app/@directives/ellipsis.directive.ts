import {
  AfterViewInit,
  Directive,
  ElementRef,
  input,
  output,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appEllipsis]',
  standalone: true,
})
export class EllipsisDirective implements AfterViewInit {
  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  public isOverflowed = output<boolean>();
  public maxLines = input<number>(2);

  ngAfterViewInit(): void {
    this.applyEllipsis();
    this.checkOverflow();
  }

  private applyEllipsis(): void {
    const element = this.el.nativeElement;

    // Set the necessary CSS styles
    this.renderer.setStyle(element, 'overflow', 'hidden');
    this.renderer.setStyle(element, 'display', '-webkit-box');
    this.renderer.setStyle(element, '-webkit-line-clamp', '2');
    this.renderer.setStyle(element, '-webkit-box-orient', 'vertical');
  }

  private checkOverflow(): void {
    const element = this.el.nativeElement;
    const computedStyle = window.getComputedStyle(element);
    const lineHeight = parseFloat(computedStyle.lineHeight);
    const maxHeight = lineHeight * this.maxLines();

    // Allow the browser to layout the element with the applied styles
    setTimeout(() => {
      const isOverflowing = element.scrollHeight > maxHeight;

      // Emit the result
      this.isOverflowed.emit(isOverflowing);
    }, 0);
  }
}
