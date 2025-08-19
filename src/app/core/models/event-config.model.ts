export interface EventConfigData {
  EventIdentifier: string;
  Domain: string;
  Information: EventInformation;
}

export interface EventInformation {
  EventNameDisplay: string;
  EventDomain: string;
}
