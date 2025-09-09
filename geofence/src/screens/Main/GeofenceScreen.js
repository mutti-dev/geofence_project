import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  SafeAreaView,
  Platform,
} from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import * as Location from "expo-location";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import io from "socket.io-client";
import { AuthContext } from "../../contexts/AuthContext";


export default function GeofenceScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [safeZones, setSafeZones] = useState([]);
  const mapRef = useRef(null);
  const isFocused = useIsFocused();
  const socket = useRef(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    socket.current = io("https://7c92e792db0f.ngrok-free.app"); // replace with your backend URL

    // Join circle room
    socket.current.emit("joinCircle", { circleId: user.circle });

    // Listen for location updates of members
    socket.current.on("locationUpdate", (member) => {
      // Update safeZones or members markers accordingly
      console.log("Member location update:", member);
    });

    // Optional: listen for geofence enter/exit notifications
    socket.current.on("geofenceNotification", (data) => {
      Alert.alert(data.message);
    });

    return () => socket.current.disconnect();
  }, []);

  useEffect(() => {
    if (!socket.current) return;
    let locInterval = setInterval(() => {
      if (location) {
        socket.current.emit("updateLocation", {
          userId: user._id,
          location: location.coords,
        });
      }
    }, 5000);

    return () => clearInterval(locInterval);
  }, [location]);

  // Request location permission & track location
  useEffect(() => {
    let intervalId;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required");
        return;
      }

      // Initial location fetch
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);

      // Update user location every 2 seconds
      intervalId = setInterval(async () => {
        const newLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(newLoc);

        // Update safe status for all zones
        setSafeZones((prev) =>
          prev.map((zone) => {
            const distance = getDistance(
              newLoc.coords.latitude,
              newLoc.coords.longitude,
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
    const R = 6371; // Radius of Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Add new safe zone
  const addSafeZone = (coordinates, radius) => {
    if (!radius || isNaN(radius)) {
      Alert.alert("Invalid radius", "Please enter a valid number");
      return;
    }
    setSafeZones((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        coordinates,
        radius: parseFloat(radius),
        safe: false,
      },
    ]);
  };

  // Center map on user location
  const centerMapOnUser = () => {
    if (mapRef.current && location) {
      mapRef.current.animateCamera({
        center: location.coords,
        zoom: 14,
      });
    }
  };

  // Prompt for new zone radius
  const handleMapPress = (coord) => {
    if (Platform.OS === "ios") {
      Alert.prompt(
        "New Safe Zone",
        "Enter radius in km",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Add", onPress: (radius) => addSafeZone(coord, radius) },
        ],
        "plain-text",
        "1"
      );
    } else {
      // Android workaround
      Alert.alert("New Safe Zone", "Enter radius in km via input below", [
        { text: "Cancel", style: "cancel" },
        { text: "Add", onPress: () => addSafeZone(coord, 1) }, // default 1km
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#6A1B9A", "#8E24AA"]} style={styles.header}>
        <Text style={styles.headerTitle}>Geofences</Text>
        <TouchableOpacity onPress={centerMapOnUser} style={styles.userBtn}>
          <Text style={styles.userBtnText}>📍</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location?.coords.latitude || 33.6844,
            longitude: location?.coords.longitude || 73.0479,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={(e) => handleMapPress(e.nativeEvent.coordinate)}
        >
          {/* Loop through safe zones */}
          {safeZones.map((zone) => (
            <React.Fragment key={zone.id}>
              {/* Loop through members */}
              {members.map((m) => (
                <Marker
                  key={m._id}
                  coordinate={m.location}
                  pinColor={m.role === "admin" ? "blue" : "orange"}
                  title={m.name}
                />
              ))}

              {/* Draw the geofence circle */}
              <Circle
                center={zone.coordinates}
                radius={zone.radius * 1000} // assuming radius in km
                fillColor={
                  zone.safe ? "rgba(76,175,80,0.2)" : "rgba(255,0,0,0.2)"
                }
                strokeColor={zone.safe ? "#4CAF50" : "#F44336"}
                strokeWidth={2}
              />
            </React.Fragment>
          ))}
        </MapView>
      </View>

      {/* Safe Zone List */}
      <FlatList
        data={safeZones}
        keyExtractor={(item) => item.id.toString()}
        style={styles.zoneList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.zoneItem,
              { backgroundColor: item.safe ? "#E8F5E9" : "#FFEBEE" },
            ]}
            onPress={() =>
              navigation.navigate("ViewSafeZone", { safeZone: item })
            }
          >
            <Text>Lat: {item.coordinates.latitude.toFixed(5)}</Text>
            <Text>Lon: {item.coordinates.longitude.toFixed(5)}</Text>
            <Text>Radius: {item.radius} km</Text>
            <Text>Status: {item.safe ? "✅ Safe" : "⚠️ Outside"}</Text>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  userBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  userBtnText: { fontSize: 18, color: "#fff" },

  mapContainer: { flex: 1, margin: 10, borderRadius: 12, overflow: "hidden" },
  map: { flex: 1 },

  zoneList: { maxHeight: 200, marginHorizontal: 10 },
  zoneItem: {
    padding: 12,
    borderRadius: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: "#ccc",
  },
});
