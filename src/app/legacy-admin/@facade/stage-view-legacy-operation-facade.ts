import { computed, inject, Injectable } from '@angular/core';
import { Observable, of, switchMap } from 'rxjs';
import { EventConfigStore } from 'src/app/core/stores/event-config-store';
import { PostData } from 'src/app/legacy-admin/shared/types';
import { LiveSessionState } from '../@data-services/event-details/event-details.data-model';
import { EventStageWebsocketDataService } from '../@data-services/web-socket/event-stage-websocket.data-service';
import { DashboardFiltersStateService } from '../@services/dashboard-filters-state.service';
import { EventStageWebSocketStateService } from '../@store/event-stage-web-socket-state.service';
import { LegacyBackendApiService } from '../services/legacy-backend-api.service';

export interface SessionStateInfo {
  isSessionActive: boolean;
  sessionState: LiveSessionState;
}

export interface DisconnectionResult {
  success: boolean;
  errors: string[];
}

@Injectable({
  providedIn: 'root',
})
export class StageViewLegacyOperationsFacade {
  protected readonly selectedEventName = computed(() =>
    this._dashboardService.selectedEvent()
  );
  protected readonly activeSession = computed(() =>
    this._dashboardService.activeSession()
  );

  private readonly _dashboardService = inject(DashboardFiltersStateService);
  private readonly _eventStageWebsocketDataService = inject(
    EventStageWebsocketDataService
  );
  private readonly _eventStageWebSocketStateService = inject(
    EventStageWebSocketStateService
  );
  private readonly _legacyBackendApiService = inject(LegacyBackendApiService);
  private readonly _eventConfigStore = inject(EventConfigStore);

  getSessionStateInfo(): SessionStateInfo {
    const sessionState = this._dashboardService.liveEventState();
    return {
      isSessionActive: sessionState === LiveSessionState.Playing,
      sessionState,
    };
  }

  pauseSessionState(): void {
    this._dashboardService.setLiveSessionState(LiveSessionState.Paused);
  }

  disconnectStageWebSockets(): void {
    this._eventStageWebsocketDataService.disconnect();
  }

  pauseSessionViaAPI(): Observable<boolean> {
    const activeSession = this.activeSession();
    const selectedEvent = this.selectedEventName().label;
    const currentStageOption = this._dashboardService.selectedLocation?.();
    const currentStage = currentStageOption?.label;
    const sessionData = activeSession?.metadata?.['originalContent'];
    const currentSessionId = sessionData?.SessionId;
    const currentDay = sessionData?.EventDay;
    const currentSessionTitle = sessionData?.SessionTitle;
    const domain =
      sessionData?.EventDomain ||
      this._eventConfigStore.$eventInfo().EventDomain;

    if (!currentStage || !currentSessionId || !selectedEvent || !domain) {
      return of(false);
    }

    const postData: PostData = {
      action: 'listeningPaused',
      sessionId: currentSessionId,
      eventName: selectedEvent,
      domain: domain,
      day: currentDay,
      stage: currentStage,
      sessionTitle: currentSessionTitle,
    };

    return this._legacyBackendApiService.postData(postData).pipe(
      switchMap((response) => {
        if (response) {
          this._dashboardService.setLiveSessionState(LiveSessionState.Paused);
          return of(true);
        }
        return of(false);
      })
    );
  }

  cleanupStageView(): void {
    this._eventStageWebsocketDataService.disconnect();
    this._eventStageWebSocketStateService.resetState();
  }
}
