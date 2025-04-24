import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import { useRouter } from "expo-router";
import * as ExpoLocation from "expo-location";
import { useDatabase } from "../contexts/DatabaseContext";
import type { Marker as MarkerType } from "../types";
import { NotificationManager } from "../services/notifications";
import { 
  requestLocationPermissions, 
  startLocationTracking, 
  calculateDistance,
  LOCATION_CONFIG,
  PROXIMITY_THRESHOLD } from "../services/location";

const notificationManager = new NotificationManager();

const MapScreen = () => {
  const router = useRouter();
  const { addMarker, getMarkers, isLoading, error } = useDatabase();
  const [markers, setMarkers] = useState<MarkerType[]>([]);
  const [userLocation, setUserLocation] = useState<ExpoLocation.LocationObject | null>(null);
  const [region, setRegion] = useState({
    latitude: 55.7558,  // Начальная широта (Москва), будет обновляться
    longitude: 37.6173, // Начальная долгота (Москва)
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    const loadMarkers = async () => {
      try {
        await notificationManager.init();
        const dbMarkers = await getMarkers();
        setMarkers(dbMarkers);
      } catch (err) {
        console.error("Failed to load markers:", err);
      }
    };
    loadMarkers();
  }, []);

  useEffect(() => {
    let subscription: ExpoLocation.LocationSubscription;

    const startTracking = async () => {
      try {
        subscription = await startLocationTracking((location) => {
          setUserLocation(location);
          setRegion({
            ...region,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          checkProximity(location);
        });
      } catch (err) {
        console.error("Location tracking error:", err);
      }
    };

    startTracking();

    return () => {
      notificationManager.clearAll();
      subscription?.remove();
    };
  }, [markers, region]);

  const sentNotifications = useRef<Set<number>>(new Set());

  const checkProximity = (location: ExpoLocation.LocationObject) => {
    markers.forEach(marker => {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        marker.latitude,
        marker.longitude
      );

      if (distance <= PROXIMITY_THRESHOLD) {
        // Если уведомление ещё не было отправлено
        if (!sentNotifications.current.has(marker.id)) {
          console.log(`Вы рядом с меткой ${marker.id} (${marker.title || "без названия"})`);
          notificationManager.showNotification(marker.id, marker.title);
          sentNotifications.current.add(marker.id); // помечаем, что отправили
        }
      } else {
        // Если вышли за пределы радиуса — разрешаем отправку при следующем входе
        if (sentNotifications.current.has(marker.id)) {
          sentNotifications.current.delete(marker.id);
          notificationManager.cancelNotification(marker.id); // можно убрать, если не нужно удалять
        }
      }
    });
  };

  const handleMapLongPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    try {
      const newMarkerId = await addMarker(latitude, longitude);
      setMarkers(prev => [
        ...prev,
        {
          id: newMarkerId,
          latitude,
          longitude,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error("Failed to add marker:", err);
    }
  };

  const handleMarkerPress = (markerId: number) => {
    router.push(`/marker/${markerId}` as `${string}:${string}`);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text>Ошибка загрузки карты</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region} // Устанавливаем текущую область карты
        onRegionChangeComplete={(newRegion) => setRegion(newRegion)} // Обновляем регион при изменении
        showsUserLocation
        onLongPress={handleMapLongPress}
      >
        {markers.map(marker => (
          <React.Fragment key={marker.id}>
            <Marker
              coordinate={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              onPress={() => handleMarkerPress(marker.id)}
            />
            <Circle
              center={{
                latitude: marker.latitude,
                longitude: marker.longitude,
              }}
              radius={PROXIMITY_THRESHOLD}
              fillColor="rgba(0,0,255,0.1)"
              strokeColor="rgba(0,0,255,0.3)"
            />
          </React.Fragment>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MapScreen;
