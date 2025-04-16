export interface AutoAvSetupRequest {
  action: 'setAutoAvSetup';
  eventName: string;
  stage: string;
  autoAv: boolean;
}

export interface AutoAvSetupResponse {
  success: boolean;
}
