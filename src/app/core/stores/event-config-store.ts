import { Injectable, signal } from '@angular/core';
import {
  EventConfigData,
  EventInformation,
} from 'src/app/core/models/event-config.model';

export const eventInfoDefaultState: EventInformation = {
  EventDomain: '',
  EventNameDisplay: '',
};

const state = {
  eventIdentifier: signal<string>(''),
  eventInfo: signal<EventInformation>(eventInfoDefaultState),
};

@Injectable({
  providedIn: 'root',
})
export class EventConfigStateService {
  public readonly $eventIdentifier = state.eventIdentifier.asReadonly();
  public readonly $eventInfo = state.eventInfo.asReadonly();

  setEventIdentifier(identifier: string): void {
    state.eventIdentifier.set(identifier);
  }

  setEventConfigData(data: EventConfigData): void {
    state.eventInfo.set(data.Information);
  }
}
