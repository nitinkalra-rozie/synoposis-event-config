import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTabsModule } from '@angular/material/tabs';
import {
  ActivatedRoute,
  NavigationCancel,
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { filter, forkJoin, map, take, tap } from 'rxjs';
import { getAvWorkspaceAccess } from 'src/app/av-workspace/helpers/av-workspace-permissions';
import {
  AvWorkspaceAccess,
  AvWorkspaceView,
} from 'src/app/av-workspace/models/av-workspace-view.model';
import { StageViewDeactivationService } from 'src/app/av-workspace/services/stage-view-deactivation.service';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';
import { LayoutMainComponent } from 'src/app/shared/layouts/layout-main/layout-main.component';

@Component({
  selector: 'app-av-workspace',
  templateUrl: './av-workspace.html',
  styleUrl: './av-workspace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterOutlet, MatTabsModule, LayoutMainComponent],
})
export class AvWorkspace implements OnInit {
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _authFacade = inject(AuthFacade);
  private readonly _stageViewDeactivationService = inject(
    StageViewDeactivationService
  );

  private readonly _tabConfig: Record<
    AvWorkspaceView,
    { label: string; value: string }
  > = {
    centralized: { label: 'Centralized View', value: 'centralized' },
    stage: { label: 'Stage View', value: 'stage' },
  };

  protected tabLinks = signal<{ label: string; value: string }[]>([]);
  protected activeTabLink = signal<string>('centralized');

  ngOnInit(): void {
    forkJoin([
      this._authFacade.getUserGroups$(),
      this._authFacade.isUserSuperAdmin$(),
    ])
      .pipe(
        take(1),
        map(([groups, isAdmin]) => getAvWorkspaceAccess(groups, isAdmin)),
        tap((access: AvWorkspaceAccess) => {
          const currentPath = this._route.firstChild?.snapshot.url[0]?.path;
          this.activeTabLink.set(currentPath ?? 'centralized');

          const availableTabs = access.availableViews.map(
            (view) => this._tabConfig[view]
          );
          this.tabLinks.set(availableTabs);

          this._setupRouteListener();
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  private _setupRouteListener(): void {
    this._router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationEnd || event instanceof NavigationCancel
        ),
        tap((event) => {
          const currentUrl =
            event instanceof NavigationEnd
              ? event.urlAfterRedirects
              : this._router.url;

          const currentTab = currentUrl.split('/').pop();

          if (currentTab === 'centralized' || currentTab === 'stage') {
            this._stageViewDeactivationService.cleanupNavigationState();

            this.activeTabLink.set(currentTab);
          }
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }
}
