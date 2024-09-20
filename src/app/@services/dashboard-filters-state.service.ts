import { Injectable, Signal, signal } from '@angular/core';
import { DropdownOption } from '@syn/models';

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

  public readonly eventNames: Signal<DropdownOption[]>;
  public readonly eventTracks: Signal<DropdownOption[]>;
  public readonly eventDays: Signal<DropdownOption[]>;

  private _eventNamesSignal = signal<DropdownOption[]>([]);
  private _eventTracksSignal = signal<DropdownOption[]>([]);
  private _eventDaysSignal = signal<DropdownOption[]>([]);

  setEventNames(names: DropdownOption[]): void {
    this._eventNamesSignal.set(names);
  }

  setEventDays(days: DropdownOption[]): void {
    this._eventDaysSignal.set(days);
  }

  setEventTracks(tracks: DropdownOption[]): void {
    this._eventTracksSignal.set(tracks);
  }
}
