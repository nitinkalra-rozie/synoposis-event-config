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
import { EventStageWebsocketDataService } from 'src/app/legacy-admin/@data-services/web-socket/event-stage-websocket.data-service';
import { EventStageWebSocketStateService } from 'src/app/legacy-admin/@store/event-stage-web-socket-state.service';
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

  // TODO:SYN-644 Based on the permissions curate the tab links to be displayed
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

  protected onTabClick(value: string): void {
    this.activeTabLink.set(value);
    if (value === 'centralized') {
      this._stageWs.disconnect();
      this._stageWsState.resetState();
    }
  }
}
