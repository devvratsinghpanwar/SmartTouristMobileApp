import React, { useState, useEffect } from 'react';
import { Stack, useRouter, Slot } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [digitalId, setDigitalId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if the user is already activated
    const checkActivation = async () => {
      const storedId = await AsyncStorage.getItem('digitalId');
      setDigitalId(storedId);
      setIsLoading(false);
    };
    checkActivation();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (!digitalId) {
      // If not activated, push them to the activation screen
      router.replace('/activation');
    } else {
      // If activated, push them to the main tab screen
      router.replace('/(tabs)/map');
    }
  }, [digitalId, isLoading]);

  // While checking, you can show a loading spinner
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Slot will render the current child route (either activation or the tabs)
  return <Slot />;
}
