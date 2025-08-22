import {
  ChangeDetectionStrategy,
  Component,
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
import { filter, forkJoin, map, take, tap } from 'rxjs';
import { getAvWorkspaceAccess } from 'src/app/av-workspace/helpers/av-workspace-permissions';
import {
  AvWorkspaceAccess,
  AvWorkspaceView,
} from 'src/app/av-workspace/models/av-workspace-view.model';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';
import { EventStageWebsocketDataService } from 'src/app/legacy-admin/@data-services/web-socket/event-stage-websocket.data-service';
import { EventStageWebSocketStateService } from 'src/app/legacy-admin/@store/event-stage-web-socket-state.service';
import { LayoutMainComponent } from 'src/app/shared/layouts/layout-main/layout-main.component';

@Component({
  selector: 'app-av-workspace',
  templateUrl: './av-workspace.html',
  styleUrl: './av-workspace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterOutlet, MatTabsModule, LayoutMainComponent],
})
export class AvWorkspace implements OnInit, OnDestroy {
  private readonly _tabConfig: Record<
    AvWorkspaceView,
    { label: string; value: string }
  > = {
    centralized: { label: 'Centralized View', value: 'centralized' },
    stage: { label: 'Stage View', value: 'stage' },
  };

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _authFacade = inject(AuthFacade);
  private readonly _stageWs = inject(EventStageWebsocketDataService);
  private readonly _stageWsState = inject(EventStageWebSocketStateService);

  protected tabLinks = signal<{ label: string; value: string }[]>([]);
  protected activeTabLink = signal<string>('centralized');

  private _dialogEventListener?: EventListener;

  ngOnInit(): void {
    forkJoin([
      this._authFacade.getUserGroups$(),
      this._authFacade.isUserSuperAdmin$(),
    ])
      .pipe(
        take(1),
        map(([groups, isAdmin]) => getAvWorkspaceAccess(groups, isAdmin)),
        tap((access: AvWorkspaceAccess) => {
          // Setup available tabs
          const availableTabs = access.availableViews.map(
            (view) => this._tabConfig[view]
          );
          this.tabLinks.set(availableTabs);

          // Set active tab based on route or fallback to first available
          const currentPath = this._route.firstChild?.snapshot.url[0]?.path;
          const isValidPath = availableTabs.some(
            (tab) => tab.value === currentPath
          );

          if (isValidPath && currentPath) {
            this.activeTabLink.set(currentPath);
          } else {
            const firstAvailableTab = availableTabs[0]?.value ?? 'centralized';
            this.activeTabLink.set(firstAvailableTab);
            this._router.navigate([firstAvailableTab], {
              relativeTo: this._route,
            });
          }
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();

    this.setupRouteNavigation();
    this.setupDialogEventListeners();
  }

  ngOnDestroy(): void {
    if (this._dialogEventListener) {
      window.removeEventListener(
        'stage-view-dialog-cancelled',
        this._dialogEventListener
      );
    }

    this._stageWs.disconnect();
    this._stageWsState.resetState();
  }

  private setupRouteNavigation(): void {
    this._route.firstChild?.url
      .pipe(
        filter((urls: UrlSegment[]) => urls.length > 0),
        map((urls: UrlSegment[]) => {
          const currentPath = urls[0].path;
          const availableTabs = this.tabLinks();
          const isValidPath = availableTabs.some(
            (tab) => tab.value === currentPath
          );

          if (isValidPath) {
            this.activeTabLink.set(currentPath);
          } else {
            const firstAvailableTab = availableTabs[0]?.value ?? 'centralized';
            this.activeTabLink.set(firstAvailableTab);
            this._router.navigate([firstAvailableTab], {
              relativeTo: this._route,
            });
          }
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  private setupDialogEventListeners(): void {
    this._dialogEventListener = ((event: CustomEvent) => {
      if (event.detail?.stayInStage) {
        this.activeTabLink.set('stage');
      }
    }) satisfies EventListener;

    window.addEventListener(
      'stage-view-dialog-cancelled',
      this._dialogEventListener
    );
  }
}
