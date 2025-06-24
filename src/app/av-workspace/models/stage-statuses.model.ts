// TODO:SYN-1289: Correct the types once the backend provides the correct values
export type StageStatusType =
  | 'OFFLINE'
  | 'AUDIO_NOT_RECEIVING'
  | 'TRANSCRIPT_NOT_RECEIVING'
  | 'ONLINE'
  | 'ONLINE_AND_PROJECTING';

export interface StageStatusConfig {
  icon: string;
  text: string;
}
