export interface AutoAvSetupRequest {
  action: 'setAutoAvSetup';
  eventName: string;
  stage: string;
  autoAv: boolean;
}

export interface AutoAvSetupResponse {
  success: boolean;
}

export interface GetAutoAvSetupRequest {
  action: 'getAutoAvSetup';
  eventName: string;
  stage: string;
}

export interface AutoAvSetupData {
  stage: string;
  autoAv: boolean;
  status: string;
  currentSessionId: string | null;
  currentAction: string;
  lastUpdatedAt: number;
  isOnline: boolean;
}

export interface GetAutoAvSetupResponse {
  success: boolean;
  data: AutoAvSetupData;
}
