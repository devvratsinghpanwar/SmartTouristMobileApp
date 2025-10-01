import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// REMINDER: Use the same IP Address as in your locationTask.ts
const API_URL = 'http://172.22.32.63:4000/api/tourists';

export default function AlertsScreen() {
  const [isSending, setIsSending] = useState(false);

  const sendDistressSignal = async () => {
    setIsSending(true);
    try {
      const digitalId = await AsyncStorage.getItem('digitalId');
      if (!digitalId) {
        Alert.alert("Error", "Could not find your ID. Please restart the app.");
        return;
      }
      
      const response = await fetch(`${API_URL}/${digitalId}/alert`, {
        method: 'PATCH',
      });

      if (response.ok) {
        Alert.alert('Signal Sent!', 'Authorities have been notified of your emergency and location.');
      } else {
        throw new Error('Server responded with an error.');
      }

    } catch (error) {
      console.error("Failed to send distress signal:", error);
      Alert.alert("Failed", "Could not send the signal. Please try again or call emergency services directly.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.panicButton} 
        onPress={sendDistressSignal}
        disabled={isSending}
      >
        {isSending ? (
          <ActivityIndicator size="large" color="white" />
        ) : (
          <Text style={styles.panicButtonText}>SEND DISTRESS SIGNAL</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.infoText}>Press in case of a real emergency.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f0f0f0' },
  panicButton: {
    backgroundColor: '#dc2626', // A strong red color
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
    borderWidth: 5,
    borderColor: '#fecaca'
  },
  panicButtonText: { color: 'white', fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
  infoText: { marginTop: 25, fontSize: 16, color: 'gray' },
});
