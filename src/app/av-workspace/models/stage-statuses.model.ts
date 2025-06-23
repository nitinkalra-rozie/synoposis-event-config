// TODO:SYN-1289: Correct the types once the backend provides the correct values
export type StageStatusType =
  | 'Offline'
  | 'audio_error'
  | 'transcript_error'
  | 'Online'
  | 'projecting';

export interface StageStatusConfig {
  icon: string;
  text: string;
}
