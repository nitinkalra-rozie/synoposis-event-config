import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterOutlet,
  UrlSegment,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { CENTRALIZED_VIEW_DIALOG_MESSAGES } from 'src/app/av-workspace/constants/centralized-view-interaction-messages';
import { EventStageWebsocketDataService } from 'src/app/legacy-admin/@data-services/web-socket/event-stage-websocket.data-service';
import { EventStageWebSocketStateService } from 'src/app/legacy-admin/@store/event-stage-web-socket-state.service';
import { SynConfirmDialogFacade } from 'src/app/shared/components/syn-confirm-dialog/syn-confirm-dialog-facade';
import { LayoutMainComponent } from 'src/app/shared/layouts/layout-main/layout-main.component';
import { environment } from 'src/environments/environment';
@Component({
  selector: 'app-av-workspace',
  templateUrl: './av-workspace.html',
  styleUrl: './av-workspace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterOutlet, MatTabsModule, LayoutMainComponent],
})
export class AvWorkspace implements OnInit, OnDestroy {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _stageWs = inject(EventStageWebsocketDataService);
  private readonly _stageWsState = inject(EventStageWebSocketStateService);
  private readonly _confirmDialog = inject(SynConfirmDialogFacade);

  // TODO:SYN-644 Based on the permissions curate the tab links to be displayed
  // This computed property filters tabs based on user permissions/role
  // When only 1 tab is shown, no confirmation dialog will appear (handled in onTabLinkClick)
  protected displayedTabLinks = computed(() =>
    this.tabLinks().filter((tabLink) =>
      // TODO:SYN-644 Remove this. If the environment is production, we don't want to show the centralized view until it's fully implemented
      environment.production ? tabLink.value !== 'centralized' : true
    )
  );

  protected tabLinks = signal<{ label: string; value: string }[]>([
    { label: 'Centralized View', value: 'centralized' },
    { label: 'Stage View', value: 'stage' },
  ]);
  protected activeTabLink = signal<string>('centralized');
  private _pendingNavigation: string | null = null;

  ngOnInit(): void {
    this._route.firstChild?.url
      .pipe(
        filter((urls: UrlSegment[]) => urls.length > 0),
        map((urls: UrlSegment[]) => {
          // TODO:SYN-644 Remove this once the centralized view is fully implemented. Ideally the redirection should be handled by the router guard.
          //#region Set the active tab link based on the available tab links (displayedTabLinks)
          const currentPath = urls[0].path;
          const displayedLinks = this.displayedTabLinks();

          const isValidPath = displayedLinks.some(
            (tabLink) => tabLink.value === currentPath
          );

          if (isValidPath) {
            this.activeTabLink.set(currentPath);
          } else {
            const firstAvailableTab = displayedLinks[0]?.value;
            if (firstAvailableTab) {
              this.activeTabLink.set(firstAvailableTab);
              this._router.navigate([firstAvailableTab], {
                relativeTo: this._route,
              });
            }
          }
          //#endregion
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  ngOnDestroy(): void {
    this._stageWs.disconnect();
    this._stageWsState.resetState();
  }

  protected onTabLinkClick(tabValue: string, event: Event): void {
    const currentTab = this.activeTabLink();

    if (currentTab === tabValue) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (!this._shouldShowSwitchConfirmation()) {
      this._navigateDirectly(tabValue);
      return;
    }

    this._showSwitchConfirmationDialog(currentTab, tabValue);
  }

  protected shouldUseRouterLink(): boolean {
    return this.displayedTabLinks().length <= 1;
  }

  private _shouldShowSwitchConfirmation(): boolean {
    return this.displayedTabLinks().length > 1;
  }

  private _showSwitchConfirmationDialog(
    currentTab: string,
    targetTab: string
  ): void {
    this._pendingNavigation = targetTab;

    const dialogConfig = this._getDialogConfiguration(currentTab, targetTab);

    this._confirmDialog
      .openConfirmDialog({
        title: dialogConfig.title,
        message: dialogConfig.message,
        confirmButtonText: dialogConfig.confirmButtonText,
        cancelButtonText: dialogConfig.cancelButtonText,
      })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((confirmed: boolean) => {
        if (confirmed) {
          this._confirmNavigation();
        } else {
          this._cancelNavigation();
        }
      });
  }

  private _getDialogConfiguration(
    currentTab: string,
    targetTab: string
  ): {
    title: string;
    message: string;
    confirmButtonText: string;
    cancelButtonText: string;
  } {
    const constants = CENTRALIZED_VIEW_DIALOG_MESSAGES.TAB_SWITCHING;

    if (currentTab === 'stage') {
      return {
        title: constants.LEAVE_STAGE_VIEW.TITLE,
        message: constants.LEAVE_STAGE_VIEW.MESSAGE,
        confirmButtonText: constants.BUTTON_TEXT.SWITCH_TO_CENTRALIZED_VIEW,
        cancelButtonText: constants.BUTTON_TEXT.STAY_IN_STAGE_VIEW,
      };
    } else {
      return {
        title: constants.LEAVE_CENTRALIZED_VIEW.TITLE,
        message: constants.LEAVE_CENTRALIZED_VIEW.MESSAGE,
        confirmButtonText: constants.BUTTON_TEXT.SWITCH_TO_STAGE_VIEW,
        cancelButtonText: constants.BUTTON_TEXT.STAY_IN_CENTRALIZED_VIEW,
      };
    }
  }

  private _navigateDirectly(tabValue: string): void {
    this.activeTabLink.set(tabValue);
    this._router.navigate([tabValue], {
      relativeTo: this._route,
    });
  }

  private _confirmNavigation(): void {
    if (this._pendingNavigation) {
      this.activeTabLink.set(this._pendingNavigation);
      this._router.navigate([this._pendingNavigation], {
        relativeTo: this._route,
      });
    }
    this._pendingNavigation = null;
  }

  private _cancelNavigation(): void {
    this._pendingNavigation = null;
  }
}
