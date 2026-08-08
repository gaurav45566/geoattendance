import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';



import {
  OFFICE_LOCATION,
  GEOFENCE_RADIUS_METERS,
  getDistanceFromLatLonInMeters,
} from '../utils/geofence';
import { AttendanceRecord, LocationCoords } from '..';
import { saveAttendance } from '../service/storageService';
import { clearWatch, getCurrentLocation, requestLocationPermission, showLocationError, watchLocation } from '../service/locationService';


type RootStackParamList = {
  Home: undefined;
  History: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [isInside, setIsInside] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    initLocation();
    return () => {
      if (watchIdRef.current !== null) {
        clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const initLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Required',
        'Location permission is required for this app to work.',
        [{ text: 'OK' }]
      );
      setLoading(false);
      return;
    }

    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
      updateGeofenceStatus(coords);

      // Start continuous tracking
      watchIdRef.current = watchLocation(
        (newCoords: LocationCoords) => {
          setLocation(newCoords);
          updateGeofenceStatus(newCoords);
        },
        (error: any) => {
          showLocationError(error);
        }
      );
    } catch (error: any) {
      showLocationError(error);
    } finally {
      setLoading(false);
    }
  };

  const updateGeofenceStatus = (coords: LocationCoords) => {
    const dist = getDistanceFromLatLonInMeters(
      coords.latitude,
      coords.longitude,
      OFFICE_LOCATION.latitude,
      OFFICE_LOCATION.longitude
    );
    setDistance(Math.round(dist));
    setIsInside(dist <= GEOFENCE_RADIUS_METERS);
  };

  const handleCheckIn = async () => {
    if (!location) {
      Alert.alert('Error', 'Location not available yet.');
      return;
    }

    if (!isInside) {
      Alert.alert(
        'Outside Geofence',
        `You are ${distance}m away from the office.\nYou must be within ${GEOFENCE_RADIUS_METERS}m to check in.`
      );
      return;
    }

    setCheckingIn(true);
    try {
      const record: AttendanceRecord = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        latitude: location.latitude,
        longitude: location.longitude,
        status: 'checked-in',
      };

      await saveAttendance(record);
      Alert.alert('Success', 'Attendance checked in successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save attendance. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        region={{
          latitude: location?.latitude || OFFICE_LOCATION.latitude,
          longitude: location?.longitude || OFFICE_LOCATION.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        showsUserLocation
        followsUserLocation
      >
        {/* Office Marker */}
        <Marker
          coordinate={OFFICE_LOCATION}
          title="Office"
          description="Geofence Center"
          pinColor="blue"
        />

        {/* Geofence Circle */}
        <Circle
          center={OFFICE_LOCATION}
          radius={GEOFENCE_RADIUS_METERS}
          strokeColor="rgba(37, 99, 235, 0.8)"
          fillColor="rgba(37, 99, 235, 0.2)"
          strokeWidth={2}
        />

        {/* User Marker */}
        {location && (
          <Marker
            coordinate={location}
            title="You"
            pinColor="green"
          />
        )}
      </MapView>

      {/* Status Card */}
      <View style={styles.card}>
        <Text style={styles.statusTitle}>
          Status:{' '}
          <Text style={{ color: isInside ? '#16a34a' : '#dc2626' }}>
            {isInside ? 'Inside Office Geofence' : 'Outside Office'}
          </Text>
        </Text>

        {distance !== null && (
          <Text style={styles.distanceText}>
            Distance from office: {distance} meters
          </Text>
        )}

        {location && (
          <Text style={styles.coordsText}>
            Lat: {location.latitude.toFixed(6)} | Lng:{' '}
            {location.longitude.toFixed(6)}
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.checkInButton,
            (!isInside || checkingIn) && styles.checkInButtonDisabled,
          ]}
          onPress={handleCheckIn}
          disabled={!isInside || checkingIn}
        >
          {checkingIn ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.checkInText}>Check In</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.historyText}>View Attendance History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: '#1e293b',
  },
  distanceText: {
    fontSize: 15,
    color: '#475569',
    marginBottom: 4,
  },
  coordsText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 16,
  },
  checkInButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  checkInButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  checkInText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  historyButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  historyText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '500',
  },
});