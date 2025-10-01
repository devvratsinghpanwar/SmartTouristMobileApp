// Simple script to clear AsyncStorage for testing
// Run this in the Expo app console or add it temporarily to your app

import AsyncStorage from '@react-native-async-storage/async-storage';

export const clearStoredData = async () => {
  try {
    await AsyncStorage.removeItem('digitalId');
    console.log('Digital ID cleared from storage');
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};

// You can also clear all AsyncStorage data
export const clearAllStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('All AsyncStorage data cleared');
    return true;
  } catch (error) {
    console.error('Error clearing all storage:', error);
    return false;
  }
};
