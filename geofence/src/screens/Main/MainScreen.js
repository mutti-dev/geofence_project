import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { useIsFocused } from "@react-navigation/native";
import MapView, { Marker, Circle } from "react-native-maps";
import io from "socket.io-client";
import { AuthContext } from "../../contexts/AuthContext";

export default function MainScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [safeZones, setSafeZones] = useState([]);
  const [members, setMembers] = useState([]); // Track circle members
  const isFocused = useIsFocused();
  const socket = useRef(null);
  const { user } = useContext(AuthContext);

  console.log("MainScreen user:", user);

  const USER_ID = user._id; // replace with real user ID
  const CIRCLE_ID = user.circle; // replace with user's circle ID
  const SERVER_URL = "https://7c92e792db0f.ngrok-free.app"; // backend

  // Initialize Socket.IO
  useEffect(() => {
    socket.current = io(SERVER_URL);

    // Join circle room
    socket.current.emit("joinCircle", { circleId: CIRCLE_ID });

    // Listen for location updates of members
    socket.current.on("locationUpdate", (member) => {
      setMembers((prev) => {
        const index = prev.findIndex((m) => m._id === member._id);
        if (index >= 0) {
          prev[index] = member;
        } else {
          prev.push(member);
        }
        return [...prev];
      });
    });

    // Listen for geofence notifications
    socket.current.on("geofenceNotification", (data) => {
      Alert.alert(data.message);
    });

    return () => socket.current.disconnect();
  }, []);

  // Send user location to server every 5 sec
  useEffect(() => {
    if (!socket.current) return;
    const locInterval = setInterval(() => {
      if (location) {
        socket.current.emit("updateLocation", {
          userId: USER_ID,
          location: location.coords,
        });
      }
    }, 5000);

    return () => clearInterval(locInterval);
  }, [location]);

  // Track user location and update safe zones
  useEffect(() => {
    let intervalId;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied");
        return;
      }

      // Initial location
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);

      intervalId = setInterval(async () => {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(loc);

        // Update safe zone status
        setSafeZones((prev) =>
          prev.map((zone) => {
            const distance = getDistance(
              loc.coords.latitude,
              loc.coords.longitude,
              zone.coordinates.latitude,
              zone.coordinates.longitude
            );
            return { ...zone, safe: distance <= zone.radius };
          })
        );
      }, 2000);
    })();

    return () => clearInterval(intervalId);
  }, [isFocused]);

  // Haversine formula to calculate distance (km)
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Add Safe Zone
  const addSafeZone = (location, radius) => {
    setSafeZones((prev) => [
      ...prev,
      { id: prev.length + 1, coordinates: location, radius, safe: false },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Current Location</Text>
      <Text>Lat: {location?.coords.latitude.toFixed(5) ?? "Loading..."}</Text>
      <Text>Lon: {location?.coords.longitude.toFixed(5) ?? "Loading..."}</Text>

      {/* Button to Add Safe Zone */}
      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate("AddSafeZoneScreen", { addSafeZone })
        }
      >
        <Text style={{ color: "#fff", fontWeight: "bold" }}>
          + Add Safe Zone
        </Text>
      </TouchableOpacity>

      {/* Safe Zones List */}
      <FlatList
        data={safeZones}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.zoneCard,
              { backgroundColor: item.safe ? "rgba(0,255,0,0.2)" : "#fff" },
            ]}
            onPress={() =>
              navigation.navigate("ViewSafeZone", { safeZone: item })
            }
          >
            <Text>Lat: {item.coordinates.latitude.toFixed(5)}</Text>
            <Text>Lon: {item.coordinates.longitude.toFixed(5)}</Text>
            <Text>Radius: {item.radius} km</Text>
            <Text>
              Status: {item.safe ? "Inside Safe Zone ✅" : "Outside ❌"}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Map showing members */}
      {location && (
        <MapView
          style={{ flex: 1, marginTop: 10 }}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
        >
          {members
            .filter((m) => m.location?.lat && m.location?.lng)
            .map((m) => (
              <Marker
                key={m._id}
                coordinate={{
                  latitude: m.location.lat,
                  longitude: m.location.lng,
                }}
                title={m.name}
              />
            ))}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  heading: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  button: {
    backgroundColor: "#008080",
    padding: 12,
    marginVertical: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  zoneCard: {
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
});
