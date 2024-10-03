import { KeyValue } from '@angular/common';
import { computed, effect, Injectable, Signal, signal } from '@angular/core';
import {
  EventDetails,
  EventStatus,
  LiveSessionState,
} from '@syn/data-services';
import { DropdownOption } from '@syn/models';
import { getDropdownOptionsFromString } from '@syn/utils';
import { map, sortBy } from 'lodash-es';

@Injectable({
  providedIn: 'root',
})
export class DashboardFiltersStateService {
  // todo: store the values in local storage if we need to preserve the states on reload
  // private readonly _localStorageKeyPrefix = 'DASHBOARD_FILTER_';

  constructor() {
    this.eventNames = this._eventNamesSignal.asReadonly();
    this.selectedEvent = this._selectedEventSignal.asReadonly();
    this.eventLocations = this._eventLocationsSignal.asReadonly();
    this.eventTracks = this._eventTracksSignal.asReadonly();
    this.eventDays = this._eventDaysSignal.asReadonly();
    this.activeSession = this._activeSessionSignal.asReadonly();
    this.allSessions = this._allSessionsSignal.asReadonly();
    this.liveEvent = this._liveEventSignal.asReadonly();
    this.liveEventState = this._liveEventStateSignal.asReadonly();
    this.liveSessionTranscript = this._liveSessionTranscriptSignal.asReadonly();
    this.shouldFetchEventDetails =
      this._shouldFetchEventDetailsSignal.asReadonly();

    this.availableSessions = computed(() => {
      const sessions = this.allSessions().filter(
        (aSession) =>
          this._selectedTracksSetSignal().has(
            aSession.metadata['originalContent'].Track
          ) &&
          this._selectedDaysSetSignal().has(
            aSession.metadata['originalContent'].EventDay
          ) &&
          this._selectedLocationsSetSignal().has(
            aSession.metadata['originalContent'].Location
          )
      );

      return map(
        sortBy(
          sessions,
          (event) => new Date(event.metadata['originalContent'].StartsAt)
        ),
        (session) => ({
          ...session,
          label: `${session.metadata['originalContent'].EventDay}  - ${session.label}`,
        })
      );
    });

    this.completedTracks = computed(() => {
      const sessions = getDropdownOptionsFromString(
        Array.from(
          new Set(
            this.allSessions()
              .filter(
                (aSession) =>
                  ![EventStatus.InProgress, EventStatus.NotStarted].includes(
                    aSession.metadata['originalContent'].Status
                  )
              )
              .map((aSession) => aSession.metadata['originalContent'].Track)
          )
        ),
        true
      );

      return sortBy(sessions, 'label');
    });

    this.allLiveEvents = computed(() =>
      this.allSessions()?.length
        ? this.allSessions()
            .filter(
              (aSession) =>
                aSession.metadata['originalContent'].Status ===
                EventStatus.InProgress
            )
            .map((aSession) => aSession.metadata['originalContent'])
        : []
    );

    effect(
      () => {
        if (this.activeSession() && this.availableSessions()?.length) {
          const activeIndex = this.availableSessions().findIndex(
            (aSession) =>
              aSession.metadata['originalContent'].SessionId ===
              this.activeSession()?.metadata['originalContent'].SessionId
          );
          if (activeIndex === -1) {
            this.setActiveSession(null);
          }
        }
      },
      {
        allowSignalWrites: true,
      }
    );
  }

  public readonly allSessions: Signal<DropdownOption[]>;
  public readonly availableSessions: Signal<DropdownOption[]>;
  public readonly activeSession: Signal<DropdownOption | null>;
  public readonly eventNames: Signal<DropdownOption[]>;
  public readonly selectedEvent: Signal<DropdownOption | null>;
  public readonly eventLocations: Signal<DropdownOption[]>;
  public readonly eventTracks: Signal<DropdownOption[]>;
  public readonly eventDays: Signal<DropdownOption[]>;
  public readonly completedTracks: Signal<DropdownOption[]>;
  public readonly liveEvent: Signal<EventDetails | null>;
  public readonly allLiveEvents: Signal<EventDetails[]>;
  public readonly liveEventState: Signal<LiveSessionState>;
  public readonly liveSessionTranscript: Signal<
    Array<KeyValue<string, string>>
  >;
  public readonly shouldFetchEventDetails: Signal<boolean>;

  private _eventNamesSignal = signal<DropdownOption[]>([]);
  private _selectedEventSignal = signal<DropdownOption | null>(null);
  private _eventTracksSignal = signal<DropdownOption[]>([]);
  private _eventDaysSignal = signal<DropdownOption[]>([]);
  private _eventLocationsSignal = signal<DropdownOption[]>([]);
  private _allSessionsSignal = signal<DropdownOption[]>([]);
  private _activeSessionSignal = signal<DropdownOption | null>(null);
  private _liveEventSignal = signal<EventDetails | null>(null);
  private _liveEventStateSignal = signal<LiveSessionState>(
    LiveSessionState.Stopped
  );
  private _liveSessionTranscriptSignal = signal<
    Array<KeyValue<string, string>>
  >([]);
  private _shouldFetchEventDetailsSignal = signal<boolean>(false);

  private readonly _selectedLocationsSetSignal = computed<Set<string>>(
    () =>
      new Set(
        this.eventLocations()
          .filter((aTrack) => aTrack.isSelected)
          .map((aTrack) => aTrack.label)
      )
  );

  private readonly _selectedTracksSetSignal = computed<Set<string>>(
    () =>
      new Set(
        this.eventTracks()
          .filter((aTrack) => aTrack.isSelected)
          .map((aTrack) => aTrack.label)
      )
  );
  private readonly _selectedDaysSetSignal = computed<Set<string>>(
    () =>
      new Set(
        this.eventDays()
          .filter((aTrack) => aTrack.isSelected)
          .map((aTrack) => aTrack.label)
      )
  );

  setEventNames(names: DropdownOption[]): void {
    this._eventNamesSignal.set(names);
  }

  setEventDays(days: DropdownOption[]): void {
    const sorted = sortBy(days, 'label');
    this._eventDaysSignal.set(sorted);
  }

  setEventLocations(locations: DropdownOption[]): void {
    const sorted = sortBy(locations, 'label');
    this._eventLocationsSignal.set(sorted);
  }

  setEventTracks(tracks: DropdownOption[]): void {
    const sorted = sortBy(tracks, 'label');
    this._eventTracksSignal.set(sorted);
  }

  setAllSessions(sessions: DropdownOption[]): void {
    this._allSessionsSignal.set(sessions);
  }

  setActiveSession(activeSession: DropdownOption): void {
    this._activeSessionSignal.set(activeSession);
  }

  setLiveEvent(event: EventDetails | null): void {
    this._liveEventSignal.set(event);
    this.setLiveSessionState(LiveSessionState.Playing);
  }

  setLiveSessionState(state: LiveSessionState): void {
    this._liveEventStateSignal.set(state);
  }

  setLiveSessionTranscript(transcript: Array<KeyValue<string, string>>): void {
    this._liveSessionTranscriptSignal.set(transcript);
  }

  setSelectedEvent(event: DropdownOption | null): void {
    this._selectedEventSignal.set(event);
  }

  setShouldFetchEventDetails(value: boolean): void {
    this._shouldFetchEventDetailsSignal.set(value);
  }
}
