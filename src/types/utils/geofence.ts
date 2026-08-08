import { LocationCoords } from "..";

export const OFFICE_LOCATION: LocationCoords = {
  latitude: 28.620594,
  longitude: 77.031151,
};
export const GEOFENCE_RADIUS_METERS = 100;


export function getDistanceFromLatLonInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; 
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function isInsideGeofence(
  currentLat: number,
  currentLon: number
): boolean {
  const distance = getDistanceFromLatLonInMeters(
    currentLat,
    currentLon,
    OFFICE_LOCATION.latitude,
    OFFICE_LOCATION.longitude
  );
  return distance <= GEOFENCE_RADIUS_METERS;
}