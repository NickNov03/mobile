export interface Marker {
    id: number;
    latitude: number;
    longitude: number;
    title?: string;
    created_at?: string;
    images?: MarkerImage[];
  }

export interface MarkerImage {
    id: number;
    marker_id: number;
    uri: string;
    created_at: string;
  }

export interface DatabaseContextType {
    isLoading: boolean;
    error: Error | null;
    addMarker: (lat: number, lng: number) => Promise<number>;
    deleteMarker: (id: number) => Promise<void>;
    getMarkers: () => Promise<Marker[]>;
    addImage: (markerId: number, uri: string) => Promise<void>;
    deleteImage: (id: number) => Promise<void>;
    getMarkerImages: (markerId: number) => Promise<MarkerImage[]>;
  }
  