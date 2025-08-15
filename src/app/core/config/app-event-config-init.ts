import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom, map } from 'rxjs';
import { EventConfigResponseData } from 'src/app/core/data-models/event-config.data-model';
import { EventConfigStore } from 'src/app/core/stores/event-config-store';
import { getEventDomain } from 'src/app/shared/utils/get-event-domain-util';
import { environment } from 'src/environments/environment';

export function appEventConfigInitializer() {
  const http = inject(HttpClient);
  const apiUrl = environment.apiBaseUrl;
  const eventConfigStore = inject(EventConfigStore);

  return (): Promise<void> =>
    firstValueFrom(
      http
        .post<EventConfigResponseData>(apiUrl + '/r1/getEventConfig', {
          domain: getEventDomain(),
        })
        .pipe(
          map((response) => {
            eventConfigStore.setEventIdentifier(response.data.EventIdentifier);
            eventConfigStore.setEventConfigData(response.data);
          })
        )
    );
}
