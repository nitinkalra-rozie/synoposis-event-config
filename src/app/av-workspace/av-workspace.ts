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
import { StageViewDialogCancelledEvent } from 'src/app/av-workspace/models/stage-view-dialog-event.model';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';
import { AvWorkspaceLegacyOperationsService } from 'src/app/legacy-admin/@services/av-workspace-legacy-operations.service';
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
  } as const;

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _authFacade = inject(AuthFacade);
  private readonly _legacyOperations = inject(
    AvWorkspaceLegacyOperationsService
  );

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
          const availableTabs = access.availableViews.map(
            (view) => this._tabConfig[view]
          );
          this.tabLinks.set(availableTabs);
          this.setupRouteNavigation();
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();

    this.setupDialogEventListeners();
  }

  ngOnDestroy(): void {
    if (this._dialogEventListener) {
      window.removeEventListener(
        'stage-view-dialog-cancelled',
        this._dialogEventListener
      );
    }

    this._legacyOperations.performLegacyCleanup();
  }

  private setupRouteNavigation(): void {
    const currentPath = this._route.firstChild?.snapshot.url[0]?.path;
    this.validateAndNavigateToTab(currentPath);
    this._route.firstChild?.url
      .pipe(
        filter((urls: UrlSegment[]) => urls.length > 0),
        map((urls: UrlSegment[]) => urls[0].path),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe((path: string) => {
        this.validateAndNavigateToTab(path);
      });
  }

  private validateAndNavigateToTab(currentPath?: string): void {
    const availableTabs = this.tabLinks();
    const isValidPath =
      currentPath && availableTabs.some((tab) => tab.value === currentPath);

    if (isValidPath) {
      this.activeTabLink.set(currentPath);
    } else {
      const firstAvailableTab = availableTabs[0]?.value ?? 'centralized';
      this.activeTabLink.set(firstAvailableTab);
      void this._router.navigate([firstAvailableTab], {
        relativeTo: this._route,
      });
    }
  }

  private setupDialogEventListeners(): void {
    this._dialogEventListener = ((event: Event) => {
      const customEvent = event as StageViewDialogCancelledEvent;
      if (customEvent.detail?.stayInStage) {
        this.activeTabLink.set('stage');
      }
    }) satisfies EventListener;

    window.addEventListener(
      'stage-view-dialog-cancelled',
      this._dialogEventListener
    );
  }
}
