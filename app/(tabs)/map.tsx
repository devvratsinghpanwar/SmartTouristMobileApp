import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  if (!location) {
    return <View style={styles.container} />; // Or a loading indicator
  }

  const userRegion = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={userRegion}>
        <Marker
          coordinate={location.coords}
          title="Your Location"
        />
        {/* Example of a Geo-fence */}
        <Circle
          center={{ latitude: userRegion.latitude + 0.01, longitude: userRegion.longitude + 0.01 }}
          radius={1000} // in meters
          strokeColor="rgba(255, 0, 0, 0.5)"
          fillColor="rgba(255, 0, 0, 0.2)"
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
});
