import Geolocation from '@react-native-community/geolocation';
import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import { LocationCoords } from '..';

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    Geolocation.requestAuthorization();
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'This app needs access to your location for attendance tracking.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
}

export function getCurrentLocation(retries = 2): Promise<LocationCoords> {
  return new Promise((resolve, reject) => {
    const attempt = (retriesLeft: number) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          if (retriesLeft > 0) {
            setTimeout(() => attempt(retriesLeft - 1), 1000);
          } else {
            reject(error);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 30000,
        }
      );
    };
    attempt(retries);
  });
}

export function watchLocation(
  onSuccess: (coords: LocationCoords) => void,
  onError: (error: any) => void
): number {
  return Geolocation.watchPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    },
    onError,
    {
      enableHighAccuracy: true,
      distanceFilter: 10,
      interval: 5000,
      fastestInterval: 2000,
    }
  );
}

export function clearWatch(watchId: number) {
  Geolocation.clearWatch(watchId);
}

export function showLocationError(error: any) {
  let message = 'Unable to get location.';

  if (error.code === 1) {
    message = 'Location permission denied. Please enable it in settings.';
  } else if (error.code === 2) {
    message = 'GPS is disabled. Please turn on location services.';
  } else if (error.code === 3) {
    message = 'Location request timed out. Please try again.';
  }

  Alert.alert('Location Error', message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Open Settings',
      onPress: () => Linking.openSettings(),
    },
  ]);
}