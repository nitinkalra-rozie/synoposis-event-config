import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RightSidebarSelectedAction, RightSidebarState } from '@syn/models';
import {
  AbsoluteDatePipe,
  SelectedQuickActionHeaderTitlePipe,
} from '@syn/pipes';
import {
  DashboardFiltersStateService,
  GlobalStateService,
} from '@syn/services';
import { tap } from 'rxjs/operators';
import { SanitizeHtmlPipe } from 'src/app/@pipes/sanitize-html.pipe';

@Component({
  selector: 'app-sidebar-control-panel',
  standalone: true,
  providers: [SelectedQuickActionHeaderTitlePipe, SanitizeHtmlPipe],
  imports: [
    NgClass,
    MatIconModule,
    MatTooltipModule,
    SelectedQuickActionHeaderTitlePipe,
    NgTemplateOutlet,
    AbsoluteDatePipe,
    SanitizeHtmlPipe,
  ],
  templateUrl: './sidebar-control-panel.component.html',
  styleUrl: './sidebar-control-panel.component.scss',
})
export class SidebarControlPanelComponent {
  constructor() {
    toObservable(this.liveSessionTranscript)
      .pipe(
        tap(() => this._scrollToBottom()),
        takeUntilDestroyed()
      )
      .subscribe();
  }

  public sessionTranscriptContainer = viewChild<ElementRef>(
    'sessionTranscriptContainer'
  );

  protected rightSidebarState = computed<RightSidebarState>(() =>
    this._globalStateService.rightSidebarState()
  );
  protected selectedRightSidebarAction = computed<RightSidebarSelectedAction>(
    () => this._globalStateService.selectedRightSidebarAction()
  );
  protected liveEvent = computed(() =>
    this._dashboardFiltersStateService.liveEvent()
  );
  protected liveSessionTranscript = computed(() =>
    this._dashboardFiltersStateService
      .liveSessionTranscript()
      .map((paragraph) => paragraph.value)
      .join('<p></p>')
  );
  protected allLiveSessions = computed(() =>
    this._dashboardFiltersStateService.allLiveEvents()
  );
  protected speakersListToggleState: Record<string, boolean> = {};

  protected RightSidebarState = RightSidebarState;
  protected RightSidebarSelectedAction = RightSidebarSelectedAction;

  private _globalStateService = inject(GlobalStateService);
  private _dashboardFiltersStateService = inject(DashboardFiltersStateService);

  protected onMenuItemClick(item: RightSidebarSelectedAction): void {
    this._globalStateService.setSelectedRightSidebarAction(item);

    if (item === RightSidebarSelectedAction.AllLiveSessions) {
      this._dashboardFiltersStateService.setShouldFetchEventDetails(true);
    }
  }

  protected onCollapsePanel(): void {
    this._globalStateService.setRightSidebarState(RightSidebarState.Collapsed);
    this._globalStateService.setSelectedRightSidebarAction(
      RightSidebarSelectedAction.None
    );
  }

  protected toggleSpeakersListHeight(sessionId: string): void {
    this.speakersListToggleState[sessionId] =
      !this.speakersListToggleState[sessionId];
  }

  private _scrollToBottom(): void {
    try {
      if (this.sessionTranscriptContainer()) {
        this.sessionTranscriptContainer().nativeElement.scrollTop =
          this.sessionTranscriptContainer().nativeElement.scrollHeight;
      }
    } catch (error) {
      console.error('error', error);
    }
  }
}
