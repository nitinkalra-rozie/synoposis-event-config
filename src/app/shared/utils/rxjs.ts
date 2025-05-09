import { isEmpty } from 'lodash-es';
import { filter, Observable } from 'rxjs';

export const filterEmpty =
  <T>() =>
  (source: Observable<T | null | undefined>): Observable<T> =>
    source.pipe(
      filter((value): value is T => value !== undefined && value !== null)
    );

export const filterAllEmpty =
  <T>() =>
  (source: Observable<T | null | undefined>): Observable<T> =>
    source.pipe(
      filter((value): value is T => {
        if (value === undefined || value === null) {
          return false;
        }
        if (
          typeof value === 'string' ||
          Array.isArray(value) ||
          typeof value === 'object'
        ) {
          return !isEmpty(value);
        }
        return true;
      })
    );

export const filterEquals =
  <T>(compareValue: T) =>
  (source: Observable<T>): Observable<T> =>
    source.pipe(filter((value) => value === compareValue));

export const filterNotEquals =
  <T>(compareValue: T) =>
  (source: Observable<T>): Observable<T> =>
    source.pipe(filter((value) => value !== compareValue));
