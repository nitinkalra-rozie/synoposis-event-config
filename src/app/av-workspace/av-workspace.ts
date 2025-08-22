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
import { RouterLink, RouterOutlet } from '@angular/router';
import { map, take, tap } from 'rxjs';
import {
  AvWorkspaceAccess,
  AvWorkspaceView,
} from 'src/app/av-workspace/models/av-workspace-view.model';
import { getAvWorkspaceAccess } from 'src/app/av-workspace/utils/av-workspace-permissions';
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
  private readonly _authFacade = inject(AuthFacade);

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
    this._authFacade
      .getUserGroups$()
      .pipe(
        take(1),
        map((groups: string[]) => getAvWorkspaceAccess(groups)),
        tap((access: AvWorkspaceAccess) => {
          this.activeTabLink.set(access.defaultView ?? 'centralized');

          const availableTabs = access.availableViews.map(
            (view) => this._tabConfig[view]
          );
          this.tabLinks.set(availableTabs);
        }),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }
}
