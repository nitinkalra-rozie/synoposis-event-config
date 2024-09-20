import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DropdownOption } from '@syn/models';
import { SessionStateService } from '@syn/services';
import { SynSingleSelectComponent } from '../syn-single-select/syn-single-select.component';

@Component({
  selector: 'app-session-selection',
  standalone: true,
  imports: [
    SynSingleSelectComponent,
    MatIconModule,
    NgOptimizedImage,
    NgTemplateOutlet,
  ],
  templateUrl: './session-selection.component.html',
  styleUrl: './session-selection.component.scss',
})
export class SessionSelectionComponent {
  protected availableSessions = computed(() =>
    this._sessionStateService.availableSessions()
  );
  protected activeSession = computed(() =>
    this._sessionStateService.activeSession()
  );

  //#region DI
  private _sessionStateService = inject(SessionStateService);
  //#endregion

  protected onOptionSelect(selectedOption: DropdownOption): void {
    this._sessionStateService.setActiveSession(selectedOption);
  }
}
