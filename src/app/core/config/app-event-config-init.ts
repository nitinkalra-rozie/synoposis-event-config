import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, firstValueFrom, map, throwError } from 'rxjs';
import { EventConfigResponseData } from 'src/app/core/data-models/event-config.data-model';
import { EventConfigStore } from 'src/app/core/stores/event-config-store';
import { SynToastFacade } from 'src/app/shared/components/syn-toast/syn-toast-facade';
import { getEventDomain } from 'src/app/shared/utils/get-event-domain-util';
import { environment } from 'src/environments/environment';

export function appEventConfigInitializer() {
  const http = inject(HttpClient);
  const apiUrl = environment.apiBaseUrl;
  const eventConfigStore = inject(EventConfigStore);
  const toastFacade = inject(SynToastFacade);

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
          }),
          catchError((error) => {
            toastFacade.showError('Error fetching event config');
            return throwError(() => error);
          })
        )
    );
}
