import { EventConfigData } from 'src/app/core/models/event-config.model';

export interface EventConfigRequestData {
  domain: string;
}

export interface EventConfigResponseData {
  success: boolean;
  data: EventConfigData;
}
