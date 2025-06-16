import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';

@Directive({
  selector: '[repeatTimes]',
  standalone: true,
})
export class RepeatTimes {
  constructor() {
    effect(() => {
      this._viewContainer.clear();
      const count = this.repeatTimes();

      for (let index = 0; index < count; index++) {
        this._viewContainer.createEmbeddedView(this._templateRef, {
          $implicit: index,
          index,
          first: index === 0,
          last: index === count - 1,
          even: index % 2 === 0,
          odd: index % 2 === 1,
        });
      }
    });
  }

  public readonly repeatTimes = input<number>(0);

  private readonly _templateRef = inject(TemplateRef);
  private readonly _viewContainer = inject(ViewContainerRef);
}
