import * as ExpoLocation from 'expo-location';

// Константа для расстояния срабатывания уведомления (в метрах)
export const PROXIMITY_THRESHOLD = 100;

interface LocationConfig {
  accuracy: ExpoLocation.LocationAccuracy;
  timeInterval: number;
  distanceInterval: number;
}

export const LOCATION_CONFIG: LocationConfig = {
  accuracy: ExpoLocation.LocationAccuracy.Balanced,
  timeInterval: 5000,
  distanceInterval: 10,
};

export const requestLocationPermissions = async () => {
  const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission to access location was denied');
  }
};

export const startLocationTracking = async (
  callback: (location: ExpoLocation.LocationObject) => void
): Promise<ExpoLocation.LocationSubscription> => {
  await requestLocationPermissions();
  
  return await ExpoLocation.watchPositionAsync(
    LOCATION_CONFIG,
    callback
  );
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};