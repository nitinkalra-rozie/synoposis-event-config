import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CheckboxOption } from '@syn/models';

@Component({
  selector: 'app-elsa-checkbox',
  standalone: true,
  imports: [FormsModule, MatTooltipModule],
  templateUrl: './elsa-checkbox.component.html',
  styleUrl: './elsa-checkbox.component.scss',
})
export class ElsaCheckboxComponent<T> {
  public option = input.required<CheckboxOption<T>>();

  public stateChanged = output<CheckboxOption<T>>();

  protected isLabelTooltipVisible: boolean = false;
}
