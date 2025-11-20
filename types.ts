export interface Coordinates {
  lat: number;
  lng: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  TRACKING = 'TRACKING',
  ALARM_RINGING = 'ALARM_RINGING',
}

export interface SearchResult {
  name: string;
  coords: Coordinates;
  description: string;
}

export interface UserSettings {
  radius: number; // in meters
  volume: number; // 0 to 1
}
