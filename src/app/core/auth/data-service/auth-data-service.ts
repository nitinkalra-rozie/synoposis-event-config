import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, Observable, switchMap } from 'rxjs';
import { AuthFacade } from 'src/app/core/auth/facades/auth-facade';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthDataService {
  private readonly _http = inject(HttpClient);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _authFacade = inject(AuthFacade);

  requestAccess(
    email: string,
    additionalHeaders?: Record<string, string>
  ): Observable<boolean> {
    const requestBody = { email };
    const baseUrl = this._getRequestAccessBaseUrl();
    const methodHeaders = {
      'x-api-key': environment.REQUEST_ACCESS_API_KEY || '',
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    return this._authFacade.getAccessToken$().pipe(
      map((token) => {
        const allHeaders = {
          ...methodHeaders,
          ...(token && { Authorization: `Bearer ${token}` }),
        };
        return new HttpHeaders(allHeaders);
      }),
      switchMap((headers) =>
        this._http.post<{ status: number }>(`${baseUrl}/`, requestBody, {
          headers,
        })
      ),
      takeUntilDestroyed(this._destroyRef),
      map((response) => response.status === 200)
    );
  }

  private _getRequestAccessBaseUrl = (): string =>
    environment.REQUEST_ACCESS_API || '';
}
