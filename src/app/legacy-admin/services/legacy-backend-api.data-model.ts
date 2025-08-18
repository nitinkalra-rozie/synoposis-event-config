export interface SetPrimaryScreenProjectingResponse {
  success: boolean;
  message?: string;
}

export interface SetPrimaryScreenProjectingRequest {
  action: string;
  eventName: string;
  isProjecting: boolean;
  stage: string;
}
