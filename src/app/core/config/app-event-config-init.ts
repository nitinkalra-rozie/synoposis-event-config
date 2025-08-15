import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { EventConfigResponseData } from 'src/app/core/data-models/event-config.data-model';
import { EventConfigStateService } from 'src/app/core/stores/event-config-store';
import { getEventDomain } from 'src/app/shared/utils/get-event-domain-util';
import { environment } from 'src/environments/environment';

export function appEventConfigInitializer() {
  const http = inject(HttpClient);
  const apiUrl = environment.apiBaseUrl;
  const eventConfigStateService = inject(EventConfigStateService);

  return (): Promise<void> =>
    firstValueFrom(
      http
        .post<EventConfigResponseData>(apiUrl + '/r1/getEventConfig', {
          domain: getEventDomain(),
        })
        .pipe(
          map((response) => {
            eventConfigStateService.setEventIdentifier(
              response.data.EventIdentifier
            );
            eventConfigStateService.setEventConfigData(response.data);
          })
        )
    );
}
