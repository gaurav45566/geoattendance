export interface AttendanceRecord {
  id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  status: 'checked-in';
}

export interface LocationCoords {
  latitude: number;
  longitude: number;
}