import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LOCATION_TASK_NAME = "background-location-task";

// The API endpoint of your Next.js backend.
// For development, use your computer's local network IP address.
// Find it by running `ipconfig` (Windows) or `ifconfig` (macOS/Linux).
const API_URL = "http://192.168.56.1:3000/api/tourists"; // <-- IMPORTANT: REPLACE WITH YOUR IP

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Background location task error:", error);
    return;
  }
  if (data) {
    const { locations } = data as any;
    const location = locations[0];
    if (location) {
      const { latitude, longitude } = location.coords;
      console.log("Background location:", latitude, longitude);

      // Retrieve the tourist's digitalId from AsyncStorage
      const digitalId = await AsyncStorage.getItem("digitalId");

      if (digitalId) {
        try {
          await fetch(`${API_URL}/${digitalId}/location`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
          console.log(`Location update sent for ${digitalId}`);
        } catch (err) {
          console.error("Failed to send location update:", err);
        }
      }
    }
  }
});

export const startBackgroundLocationTracking = async (digitalId: string) => {
  console.log("requesting foreground location permission ... ");
  const { status: foregroundStatus } =
    await Location.requestForegroundPermissionsAsync();
  console.log("foreground permission status : ", foregroundStatus);
  if (foregroundStatus !== "granted") {
    console.error("Foreground location permission not granted");
    return false;
  }
  console.log("Requesting background location permission... ");
  const { status: backgroundStatus } =
    await Location.requestBackgroundPermissionsAsync();
  console.log("background perimission status: ", backgroundStatus);
  if (backgroundStatus !== "granted") {
    console.error("Background location permission not granted");
    return false;
  }

  console.log("permission granted started location updates ...");

  // Store digitalId in AsyncStorage for retrieval in the background task
  await AsyncStorage.setItem("digitalId", digitalId);

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10 * 60 * 1000, // 10 minutes for testing (1 hour = 60 * 60 * 1000)
    deferredUpdatesInterval: 10 * 60 * 1000,
    showsBackgroundLocationIndicator: true,
  });
  console.log("Started background location tracking for", digitalId);
  return true;
};
