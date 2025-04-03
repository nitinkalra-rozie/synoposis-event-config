import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CheckboxOption } from 'src/app/legacy-admin/@models/checkbox';

@Component({
  selector: 'app-syn-elsa-checkbox',
  standalone: true,
  imports: [FormsModule, MatTooltipModule],
  templateUrl: './syn-checkbox.component.html',
  styleUrl: './syn-checkbox.component.scss',
})
export class SynCheckboxComponent<T> {
  public option = input.required<CheckboxOption<T>>();

  public stateChanged = output<CheckboxOption<T>>();

  protected isLabelTooltipVisible: boolean = false;
}
