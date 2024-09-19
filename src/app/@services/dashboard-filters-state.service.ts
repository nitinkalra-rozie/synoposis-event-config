import { Injectable, Signal, signal } from '@angular/core';
import { MultiSelectOption } from '@syn/models';

@Injectable({
  providedIn: 'root',
})
export class DashboardFiltersStateService {
  // todo: store the values in local storage if we need to preserve the states on reload
  // private readonly _localStorageKeyPrefix = 'DASHBOARD_FILTER_';

  constructor() {
    this.eventNames = this._eventNamesSignal.asReadonly();
    this.eventTracks = this._eventTracksSignal.asReadonly();
    this.eventDays = this._eventDaysSignal.asReadonly();
  }

  public readonly eventNames: Signal<MultiSelectOption[]>;
  public readonly eventTracks: Signal<MultiSelectOption[]>;
  public readonly eventDays: Signal<MultiSelectOption[]>;

  private _eventNamesSignal = signal<MultiSelectOption[]>([]);
  private _eventTracksSignal = signal<MultiSelectOption[]>([]);
  private _eventDaysSignal = signal<MultiSelectOption[]>([]);

  setEventNames(names: MultiSelectOption[]): void {
    this._eventNamesSignal.set(names);
  }

  setEventDays(days: MultiSelectOption[]): void {
    this._eventDaysSignal.set(days);
  }

  setEventTracks(tracks: MultiSelectOption[]): void {
    this._eventTracksSignal.set(tracks);
  }
}
