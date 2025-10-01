import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { startBackgroundLocationTracking } from '../locationTask';
import { useRouter } from 'expo-router';

export default function ActivationScreen() {
  const [id, setId] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Add a loading state
  const router = useRouter();

  const handleActivate = async () => {
    // --- CHECKPOINT 1 ---
    console.log("Activate button pressed with ID:", id);
    
    if (id.trim().length === 0) {
      Alert.alert('Error', 'Please enter your Digital Tourist ID.');
      return;
    }

    setIsLoading(true); // Start loading indicator

    try {
      // --- CHECKPOINT 2 ---
      console.log("Attempting to start background location tracking...");
      const trackingStarted = await startBackgroundLocationTracking(id.trim());
      
      // --- CHECKPOINT 3 ---
      console.log("Result of startBackgroundLocationTracking:", trackingStarted);

      if (trackingStarted) {
        // --- CHECKPOINT 4 ---
        console.log("Tracking started successfully. Saving ID to AsyncStorage...");
        await AsyncStorage.setItem('digitalId', id.trim());

        // --- CHECKPOINT 5 ---
        console.log("ID saved. Navigating to the map screen...");
        router.replace('/(tabs)/map');
      } else {
        Alert.alert(
          'Permission Error', 
          'Could not start location tracking. Please ensure you have granted "Allow all the time" location permissions for the Expo Go app in your phone\'s settings.'
        );
      }
    } catch (error) {
      // --- CATCH ALL ERRORS ---
      console.error("An error occurred during activation:", error);
      Alert.alert('Activation Failed', 'An unexpected error occurred. Please check the console for details.');
    } finally {
      setIsLoading(false); // Stop loading indicator
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Activate Safety Monitoring</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your Digital Tourist ID"
          value={id}
          onChangeText={setId}
          editable={!isLoading} // Disable input while loading
        />
        {isLoading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <Button title="Activate" onPress={handleActivate} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: '#333' },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    backgroundColor: 'white',
    padding: 12, 
    marginBottom: 20, 
    borderRadius: 8,
    fontSize: 16
  },
});

