import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { LiveSessionState } from '../@data-services/event-details/event-details.data-model';
import { EventStageWebsocketDataService } from '../@data-services/web-socket/event-stage-websocket.data-service';
import { EventStageWebSocketStateService } from '../@store/event-stage-web-socket-state.service';
import { LegacyBackendApiService } from '../services/legacy-backend-api.service';
import { PostData } from '../shared/types';
import { DashboardFiltersStateService } from './dashboard-filters-state.service';

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
export class AvWorkspaceLegacyOperationsService {
  private readonly _dashboardService = inject(DashboardFiltersStateService);
  private readonly _legacyStageWebSocketService = inject(
    EventStageWebsocketDataService
  );
  private readonly _legacyStageWebSocketStateService = inject(
    EventStageWebSocketStateService
  );
  private readonly _backendApiService = inject(LegacyBackendApiService);

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

  disconnectLegacyWebSockets(): void {
    this._legacyStageWebSocketService.disconnect();
  }

  getLiveEventState(): LiveSessionState {
    return this._dashboardService.liveEventState();
  }

  isSessionPlaying(): boolean {
    return this._dashboardService.liveEventState() === LiveSessionState.Playing;
  }

  pauseSessionViaAPI(): Observable<boolean> {
    const currentStage = localStorage.getItem('currentStage');
    const currentSessionId = localStorage.getItem('currentSessionId');
    const selectedEvent = localStorage.getItem('selectedEvent');
    const domain = localStorage.getItem('domain');
    const currentDay = localStorage.getItem('currentDay');
    const currentSessionTitle = localStorage.getItem('currentSessionTitle');

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

    return this._backendApiService.postData(postData).pipe(
      switchMap((response) => {
        if (response) {
          this._dashboardService.setLiveSessionState(LiveSessionState.Paused);
          return of(true);
        }
        return of(false);
      }),
      catchError(() => of(false))
    );
  }

  performLegacyCleanup(): void {
    this._legacyStageWebSocketService.disconnect();
    this._legacyStageWebSocketStateService.resetState();
  }
}
