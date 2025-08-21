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

interface TabLink {
  label: string;
  value: string;
}

@Component({
  selector: 'app-av-workspace',
  templateUrl: './av-workspace.html',
  styleUrl: './av-workspace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterOutlet, MatTabsModule, LayoutMainComponent],
})
export class AvWorkspace implements OnInit, OnDestroy {
  protected readonly tabLinks = signal<TabLink[]>([
    { label: 'Centralized View', value: 'centralized' },
    { label: 'Stage View', value: 'stage' },
  ]);

  protected readonly activeTabLink = signal<string>('centralized');

  // TODO:SYN-644 Based on the permissions curate the tab links to be displayed
  protected readonly displayedTabLinks = computed(() =>
    this.tabLinks().filter((tabLink) =>
      // TODO:SYN-644 Remove this. If the environment is production, we don't want to show the centralized view until it's fully implemented
      environment.production ? tabLink.value !== 'centralized' : true
    )
  );

  private readonly _destroyRef = inject(DestroyRef);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _stageWs = inject(EventStageWebsocketDataService);
  private readonly _stageWsState = inject(EventStageWebSocketStateService);

  private _dialogEventListener?: EventListener;

  ngOnInit(): void {
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
        // TODO:SYN-644 Remove this once the centralized view is fully implemented. Ideally the redirection should be handled by the router guard.
        //#region Set the active tab link based on the available tab links (displayedTabLinks)
        map((urls: UrlSegment[]) => this.handleRouteChange(urls[0].path)),
        takeUntilDestroyed(this._destroyRef)
      )
      .subscribe();
  }

  private handleRouteChange(currentPath: string): void {
    const displayedLinks = this.displayedTabLinks();
    const isValidPath = displayedLinks.some((tab) => tab.value === currentPath);

    if (isValidPath) {
      this.activeTabLink.set(currentPath);
    } else {
      const firstAvailableTab = displayedLinks[0]?.value;
      if (firstAvailableTab) {
        this.activeTabLink.set(firstAvailableTab);
        this._router.navigate([firstAvailableTab], { relativeTo: this._route });
      }
    }
    //#endregion
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
