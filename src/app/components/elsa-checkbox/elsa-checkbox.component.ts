import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CheckboxOption } from 'src/app/models/elsa-checkbox';

@Component({
  selector: 'app-elsa-checkbox',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './elsa-checkbox.component.html',
  styleUrl: './elsa-checkbox.component.scss',
})
export class ElsaCheckboxComponent<T> {
  public option = input.required<CheckboxOption<T>>();

  public stateChanged = output<CheckboxOption<T>>();

  protected showTooltip = false;
}
