import React, { useState, useEffect } from "react";
import { StyleSheet, View, Alert, Text, TouchableOpacity } from "react-native";
import MapView, { Marker, Circle, Polygon } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

interface GeoFence {
  _id: string;
  name: string;
  type: "safe_zone" | "restricted_zone" | "alert_zone" | "emergency_zone";
  geometry: {
    type: "Polygon" | "Circle";
    coordinates: number[][] | number[]; // Polygon uses number[][], Circle uses number[]
    radius?: number;
  };
  isActive: boolean;
}

const API_URL = "http://172.22.32.63:4000/api/dashboard"; // Updated with your network IP

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [geoFences, setGeoFences] = useState<GeoFence[]>([]);
  const [digitalId, setDigitalId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Get permissions and current location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);

      // Get digital ID from storage
      const storedDigitalId = await AsyncStorage.getItem("digitalId");
      setDigitalId(storedDigitalId);

      // Fetch geo-fences
      await fetchGeoFences();
    })();
  }, []);

  const fetchGeoFences = async () => {
    try {
      const response = await fetch(`${API_URL}/geofences`);
      if (response.ok) {
        const geoFencesData = await response.json();
        setGeoFences(geoFencesData);
      }
    } catch (error) {
      console.error("Failed to fetch geo-fences:", error);
    }
  };

  const getGeoFenceColor = (type: string) => {
    switch (type) {
      case "safe_zone":
        return { stroke: "rgba(0, 255, 0, 0.8)", fill: "rgba(0, 255, 0, 0.2)" };
      case "restricted_zone":
        return { stroke: "rgba(255, 0, 0, 0.8)", fill: "rgba(255, 0, 0, 0.2)" };
      case "alert_zone":
        return {
          stroke: "rgba(255, 165, 0, 0.8)",
          fill: "rgba(255, 165, 0, 0.2)",
        };
      case "emergency_zone":
        return {
          stroke: "rgba(255, 0, 255, 0.8)",
          fill: "rgba(255, 0, 255, 0.2)",
        };
      default:
        return {
          stroke: "rgba(128, 128, 128, 0.8)",
          fill: "rgba(128, 128, 128, 0.2)",
        };
    }
  };

  const resetApp = async () => {
    Alert.alert(
      "Reset App",
      "This will clear your stored Digital ID and return you to the activation screen. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("digitalId");
              router.replace("/activation");
            } catch (error) {
              console.error("Error clearing storage:", error);
              Alert.alert("Error", "Failed to reset app. Please try again.");
            }
          },
        },
      ]
    );
  };

  if (!location) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading location...</Text>
      </View>
    );
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
        {/* User location marker */}
        <Marker
          coordinate={location.coords}
          title="Your Location"
          description={
            digitalId ? `Tourist ID: ${digitalId}` : "Tourist Location"
          }
          pinColor="blue"
        />

        {/* Render geo-fences */}
        {geoFences.map((geoFence) => {
          const colors = getGeoFenceColor(geoFence.type);

          if (geoFence.geometry.type === "Circle") {
            // coordinates for circle is [longitude, latitude]
            const coords = geoFence.geometry.coordinates as number[];
            const longitude = coords[0];
            const latitude = coords[1];
            const center = {
              latitude: latitude,
              longitude: longitude,
            };

            return (
              <Circle
                key={geoFence._id}
                center={center}
                radius={geoFence.geometry.radius || 1000}
                strokeColor={colors.stroke}
                fillColor={colors.fill}
                strokeWidth={2}
              />
            );
          } else if (geoFence.geometry.type === "Polygon") {
            const coords = geoFence.geometry.coordinates as number[][];
            const coordinates = coords.map((coord) => ({
              latitude: coord[1],
              longitude: coord[0],
            }));

            return (
              <Polygon
                key={geoFence._id}
                coordinates={coordinates}
                strokeColor={colors.stroke}
                fillColor={colors.fill}
                strokeWidth={2}
              />
            );
          }

          return null;
        })}
      </MapView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Zones</Text>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: "rgba(0, 255, 0, 0.5)" },
            ]}
          />
          <Text style={styles.legendText}>Safe Zone</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: "rgba(255, 165, 0, 0.5)" },
            ]}
          />
          <Text style={styles.legendText}>Alert Zone</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: "rgba(255, 0, 0, 0.5)" },
            ]}
          />
          <Text style={styles.legendText}>Restricted Zone</Text>
        </View>
        <TouchableOpacity style={styles.resetButton} onPress={resetApp}>
          <Text style={styles.resetButtonText}>Reset App</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: "center", alignItems: "center" },
  map: { width: "100%", height: "100%" },
  legend: {
    position: "absolute",
    top: 50,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
  resetButton: {
    backgroundColor: "#ff4444",
    padding: 8,
    borderRadius: 5,
    marginTop: 10,
    alignItems: "center",
  },
  resetButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
});
