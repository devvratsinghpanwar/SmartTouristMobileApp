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
      // --- CHECKPOINT 1.5: Validate Digital ID exists ---
      console.log("Validating Digital ID with server...");
      const validationResponse = await fetch(`http://172.22.200.29:4000/api/tourists/${id.trim()}`);

      if (!validationResponse.ok) {
        if (validationResponse.status === 404) {
          Alert.alert(
            'Invalid Digital ID',
            'The Digital Tourist ID you entered was not found. Please check the ID and try again.\n\nMake sure you copied it exactly as provided during registration.'
          );
        } else {
          Alert.alert('Validation Error', 'Could not validate your Digital ID. Please check your internet connection and try again.');
        }
        return;
      }

      const touristData = await validationResponse.json();
      console.log("Digital ID validated successfully for:", touristData.kyc?.name || 'Tourist');

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
        Alert.alert(
          'Activation Successful!',
          `Welcome ${touristData.kyc?.name || 'Tourist'}! Your safety monitoring is now active.`,
          [{ text: 'Continue', onPress: () => router.replace('/(tabs)/map') }]
        );
      } else {
        Alert.alert(
          'Permission Error',
          'Could not start location tracking. Please ensure you have granted "Allow all the time" location permissions for the Expo Go app in your phone\'s settings.'
        );
      }
    } catch (error) {
      // --- CATCH ALL ERRORS ---
      console.error("An error occurred during activation:", error);
      Alert.alert('Activation Failed', 'An unexpected error occurred. Please check your internet connection and try again.');
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

