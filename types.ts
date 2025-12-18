export enum VoiceName {
  Kore = 'Kore',
  Puck = 'Puck',
  Charon = 'Charon',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr'
}

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  hasAudio: boolean;
}