import React, { useState, useEffect } from "react";
import { StyleSheet, View, Alert, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import MapView, { Marker, Circle, Polygon } from "react-native-maps";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';

interface GeoFence {
  _id: string;
  name: string;
  type: "safe_zone" | "restricted_zone" | "alert_zone" | "emergency_zone" | "danger_zone" | "restricted_area" | "tourist_zone";
  riskLevel?: "low" | "medium" | "high" | "critical";
  geometry: {
    type: "Polygon" | "Circle";
    coordinates: number[][] | number[]; // Polygon uses number[][], Circle uses number[]
    radius?: number;
  };
  isActive: boolean;
}

const API_URL = "http://172.22.200.29:4000/api/dashboard"; // Updated with your network IP

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [geoFences, setGeoFences] = useState<GeoFence[]>([]);
  const [digitalId, setDigitalId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
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

      // Get digital ID from storage, or set default for testing
      let storedDigitalId = await AsyncStorage.getItem("digitalId");
      if (!storedDigitalId) {
        // Set default tourist ID for testing
        storedDigitalId = "TID-sample123456";
        await AsyncStorage.setItem("digitalId", storedDigitalId);
        console.log("Set default digitalId:", storedDigitalId);
      }
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

  const refreshMapData = async () => {
    setIsRefreshing(true);
    try {
      await fetchGeoFences();
      // Also refresh current location
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    } catch (error) {
      console.error("Failed to refresh map data:", error);
      Alert.alert("Refresh Failed", "Unable to refresh map data. Please check your internet connection.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const getGeoFenceColor = (geoFence: GeoFence) => {
    // Use risk level if available, otherwise fall back to type-based colors
    if (geoFence.riskLevel) {
      switch (geoFence.riskLevel) {
        case "low":
          return { stroke: "rgba(34, 197, 94, 0.8)", fill: "rgba(34, 197, 94, 0.2)" }; // Green
        case "medium":
          return { stroke: "rgba(251, 191, 36, 0.8)", fill: "rgba(251, 191, 36, 0.2)" }; // Yellow/Orange
        case "high":
          return { stroke: "rgba(239, 68, 68, 0.8)", fill: "rgba(239, 68, 68, 0.2)" }; // Red
        case "critical":
          return { stroke: "rgba(147, 51, 234, 0.8)", fill: "rgba(147, 51, 234, 0.2)" }; // Purple
      }
    }

    // Fallback to type-based colors for backward compatibility
    switch (geoFence.type) {
      case "safe_zone":
      case "tourist_zone":
        return { stroke: "rgba(34, 197, 94, 0.8)", fill: "rgba(34, 197, 94, 0.2)" }; // Green
      case "alert_zone":
        return { stroke: "rgba(251, 191, 36, 0.8)", fill: "rgba(251, 191, 36, 0.2)" }; // Yellow/Orange
      case "restricted_zone":
      case "restricted_area":
      case "danger_zone":
        return { stroke: "rgba(239, 68, 68, 0.8)", fill: "rgba(239, 68, 68, 0.2)" }; // Red
      case "emergency_zone":
        return { stroke: "rgba(147, 51, 234, 0.8)", fill: "rgba(147, 51, 234, 0.2)" }; // Purple
      default:
        return { stroke: "rgba(156, 163, 175, 0.8)", fill: "rgba(156, 163, 175, 0.2)" }; // Gray
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
      {/* Header with refresh button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Map View</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshMapData}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="refresh" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

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
          const colors = getGeoFenceColor(geoFence);

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
        <Text style={styles.legendTitle}>Risk Zones</Text>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: "rgba(34, 197, 94, 0.6)" },
            ]}
          />
          <Text style={styles.legendText}>Low Risk</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: "rgba(251, 191, 36, 0.6)" },
            ]}
          />
          <Text style={styles.legendText}>Medium Risk</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: "rgba(239, 68, 68, 0.6)" },
            ]}
          />
          <Text style={styles.legendText}>High Risk</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: "rgba(147, 51, 234, 0.6)" },
            ]}
          />
          <Text style={styles.legendText}>Critical Risk</Text>
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
  header: {
    height: 60,
    backgroundColor: "#4A90E2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  refreshButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  map: { width: "100%", flex: 1 },
  legend: {
    position: "absolute",
    top: 65,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: 12,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 140,
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
