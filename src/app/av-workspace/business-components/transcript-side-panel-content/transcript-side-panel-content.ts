import {
  CdkVirtualForOf,
  CdkVirtualScrollViewport,
  ScrollingModule,
} from '@angular/cdk/scrolling';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CentralizedViewTranscriptWebSocketFacade } from 'src/app/av-workspace/facade/centralized-view-transcript-websocket-facade';
import { TranscriptDisplaySegment } from 'src/app/av-workspace/models/transcript-content.model';
import { TranscriptPanelActionType } from 'src/app/av-workspace/models/transcript-panel-action-type.model';
import { CentralizedViewTranscriptWebSocketStore } from 'src/app/av-workspace/stores/centralized-view-transcript-websocket-store';
import { CentralizedViewUIStore } from 'src/app/av-workspace/stores/centralized-view-ui-store';
import { TranscriptContentStore } from 'src/app/av-workspace/stores/transcript-content-store';
import { TooltipOnOverflow } from 'src/app/shared/directives/tooltip-on-overflow';
import { TypewriterAnimation } from 'src/app/shared/directives/typewriter-animation';

@Component({
  selector: 'app-transcript-side-panel-content',
  templateUrl: './transcript-side-panel-content.html',
  styleUrl: './transcript-side-panel-content.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    CdkVirtualForOf,
    MatButtonModule,
    MatIconModule,
    ScrollingModule,
    TooltipOnOverflow,
    TypewriterAnimation,
  ],
})
export class TranscriptSidePanelContent implements OnDestroy {
  constructor() {
    effect(() => {
      const stageName = this._uiStore.$transcriptPanel().stageName();
      const connectedStage = this._webSocketStore.$connectedStage();

      this._checkAndEstablishConnection(stageName, connectedStage);

      const currentAction = this.currentAction();
      console.log('currentAction', currentAction);
    });

    effect(() => {
      const segments = this.$vm().transcriptSegments;
      const viewport = this._viewport();

      if (segments.length > 0 && viewport && this._shouldAutoScroll()) {
        requestAnimationFrame(() => {
          viewport.scrollToIndex(segments.length, 'smooth');
        });
      }
    });
  }

  public readonly sessionTitle = input.required<string>();
  public readonly currentAction = input.required<TranscriptPanelActionType>();

  protected readonly lastSegmentId = computed(() => {
    const segments = this.$vm().transcriptSegments;
    return segments.length > 0 ? segments[segments.length - 1].id : null;
  });

  private readonly _transcriptStore = inject(TranscriptContentStore);
  private readonly _webSocketStore = inject(
    CentralizedViewTranscriptWebSocketStore
  );
  private readonly _webSocketFacade = inject(
    CentralizedViewTranscriptWebSocketFacade
  );
  private readonly _uiStore = inject(CentralizedViewUIStore);
  private readonly _viewport = viewChild<CdkVirtualScrollViewport>('viewport');

  protected $vm = this._transcriptStore.$vm;
  protected userScrolledUp = signal(false);

  private _shouldAutoScroll = signal(true);

  ngOnDestroy(): void {
    this._webSocketFacade.disconnect();
  }

  protected onScroll(): void {
    const viewport = this._viewport();
    if (!viewport) return;

    const range = viewport.getRenderedRange();

    const total = this.$vm().transcriptSegments.length;

    const isAtBottom = range.end >= total;
    this._shouldAutoScroll.set(isAtBottom);
    this.userScrolledUp.set(!isAtBottom);
  }

  protected scrollToBottom(): void {
    const viewport = this._viewport();
    if (viewport) {
      viewport.scrollToIndex(this.$vm().transcriptSegments.length, 'smooth');
      this._shouldAutoScroll.set(true);
      this.userScrolledUp.set(false);
    }
  }

  protected retryConnection(): void {
    const stageName = this._uiStore.$transcriptPanel().stageName();
    if (stageName) {
      this._webSocketFacade.connect(stageName);
    }
  }

  protected trackBySegment(
    index: number,
    segment: TranscriptDisplaySegment
  ): string {
    return `${segment.id}-${index}-${segment.timestamp}`;
  }

  private _checkAndEstablishConnection(
    stageName: string,
    connectedStage: string
  ): void {
    if (!stageName || stageName === connectedStage) return;

    if (connectedStage !== null && stageName !== connectedStage) {
      this._webSocketFacade.disconnect();
    }

    this._webSocketFacade.connect(stageName);
  }
}
