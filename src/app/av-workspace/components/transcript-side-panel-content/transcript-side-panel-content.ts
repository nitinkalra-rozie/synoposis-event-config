import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranscriptPanelActionType } from 'src/app/av-workspace/models/transcript-panel-state.model';
import { TooltipOnOverflow } from 'src/app/shared/directives/tooltip-on-overflow';

@Component({
  selector: 'app-transcript-side-panel-content',
  templateUrl: './transcript-side-panel-content.html',
  styleUrl: './transcript-side-panel-content.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, TooltipOnOverflow],
})
export class TranscriptSidePanelContent {
  public readonly sessionTitle = input.required<string>();
  public readonly currentAction = input.required<TranscriptPanelActionType>();
}
