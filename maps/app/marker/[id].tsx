import React, { useEffect, useState } from "react";
import { View, Text, Button, FlatList, Image, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useDatabase } from "../../contexts/DatabaseContext";
import type { MarkerImage } from "../../types";

const MarkerDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { 
    addImage, 
    deleteImage, 
    getMarkerImages,
    deleteMarker 
  } = useDatabase();
  
  const [images, setImages] = useState<MarkerImage[]>([]);
  const markerId = Number(id);

  // Загрузка изображений маркера
  useEffect(() => {
    const loadImages = async () => {
      try {
        const markerImages = await getMarkerImages(markerId);
        setImages(markerImages);
      } catch (err) {
        console.error("Failed to load images:", err);
      }
    };
    loadImages();
  }, [markerId]);

  const handleAddImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        await addImage(markerId, result.assets[0].uri);
        const updatedImages = await getMarkerImages(markerId);
        setImages(updatedImages);
      }
    } catch (err) {
      Alert.alert("Ошибка", "Не удалось добавить изображение");
    }
  };

  const handleDeleteMarker = async () => {
    try {
      await deleteMarker(markerId);
      router.back();
    } catch (err) {
      Alert.alert("Ошибка", "Не удалось удалить маркер");
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    try {
      await deleteImage(imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      Alert.alert("Ошибка", "Не удалось удалить изображение");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Маркер #{markerId}</Text>
      
      <Button 
        title="Добавить фото" 
        onPress={handleAddImage} 
      />
      
      <Button 
        title="Удалить маркер" 
        onPress={handleDeleteMarker}
        color="red"
      />

      <FlatList
        data={images}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.uri }} 
              style={styles.image} 
            />
            <Button
              title="×"
              onPress={() => handleDeleteImage(item.id)}
              color="red"
            />
          </View>
        )}
        numColumns={3}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, marginBottom: 16 },
  imageContainer: { margin: 4 },
  image: { width: 100, height: 100 },
});

export default MarkerDetailScreen;