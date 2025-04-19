import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { initDatabase } from '../database/schema';
import {
  addMarker,
  deleteMarker,
  getMarkers,
  addImage,
  deleteImage,
  getMarkerImages,
} from '../database/operations';
import type { Marker, MarkerImage } from '../types';

// 1. Создаем сам контекст с начальным значением
const DatabaseContext = createContext<{
  isLoading: boolean;
  error: Error | null;
  addMarker: (latitude: number, longitude: number) => Promise<number>;
  deleteMarker: (id: number) => Promise<void>;
  getMarkers: () => Promise<Marker[]>;
  addImage: (markerId: number, uri: string) => Promise<void>;
  deleteImage: (id: number) => Promise<void>;
  getMarkerImages: (markerId: number) => Promise<MarkerImage[]>;
} | null>(null); // Явно указываем, что контекст может быть null

// 2. Создаем провайдер
export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeDB = async () => {
      try {
        await initDatabase();
        if (isMounted) setIsInitializing(false);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsInitializing(false);
        }
      }
    };

    initializeDB();

    return () => { isMounted = false; };
  }, []);

  const contextValue = useMemo(() => ({
    isLoading: isInitializing,
    error,
    addMarker,
    deleteMarker,
    getMarkers,
    addImage,
    deleteImage,
    getMarkerImages,
  }), [isInitializing, error]);

  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center' }}>
          Database Error: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
};

// 3. Создаем хук для использования контекста
export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};