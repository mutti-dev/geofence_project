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
import API from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function GeofenceScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [safeZones, setSafeZones] = useState([]);
  const [members, setMembers] = useState([]);
  const [circleName, setCircleName] = useState("Geofences");
  const mapRef = useRef(null);
  const isFocused = useIsFocused();
  const socket = useRef(null);
  const { user } = useContext(AuthContext);

  // fetch geofences from backend for this user's circle
  const fetchGeofences = async () => {
    try {
      const token = user?.token || (await AsyncStorage.getItem("token"));
      if (!token) return;
      const { data } = await API.get("/geofences/circle", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { circleName: cName, geofences } = data || {};
      setCircleName(cName || "Geofences");
      const zones = (geofences || []).map((g) => ({
        id: g._id,
        coordinates: { latitude: g.center.lat, longitude: g.center.lng },
        radius: g.radius,
        safe: false,
        name: g.name,
        geofenceId: g._id,
      }));
      setSafeZones(zones);
    } catch (err) {
      console.log(
        "fetchGeofences error",
        err?.response?.data || err.message
      );
    }
  };

  useEffect(() => {
    fetchGeofences();
  }, [isFocused, user]);

  // Setup socket and listen for updates
  useEffect(() => {
    socket.current = io("https://7c92e792db0f.ngrok-free.app"); // replace with your backend URL

    // Join circle room
    if (user?.circle) socket.current.emit("joinCircle", { circleId: user.circle });

    // Listen for location updates of members
    socket.current.on("locationUpdate", (member) => {
      setMembers((prev) => {
        const index = prev.findIndex((m) => m._id === member._id);
        if (index >= 0) {
          const copy = [...prev];
          copy[index] = { ...copy[index], ...member };
          return copy;
        }
        return [...prev, member];
      });
    });

    // Optional: listen for geofence enter/exit notifications
    socket.current.on("geofenceNotification", (data) => {
      Alert.alert(data.message);
      // refresh geofences if needed
      fetchGeofences();
    });

    return () => socket.current && socket.current.disconnect();
  }, [user]);

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
        try {
          const newLoc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setLocation(newLoc);
        } catch (e) {
          console.log("Location update error", e);
        }
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

  // Resolve different possible coordinate shapes to a { latitude, longitude } object
  const resolveCoords = (zoneOrCenter) => {
    if (!zoneOrCenter) return null;
    if (
      zoneOrCenter.coordinates &&
      zoneOrCenter.coordinates.latitude != null &&
      zoneOrCenter.coordinates.longitude != null
    ) {
      return {
        latitude: zoneOrCenter.coordinates.latitude,
        longitude: zoneOrCenter.coordinates.longitude,
      };
    }
    if (zoneOrCenter.center && zoneOrCenter.center.lat != null && zoneOrCenter.center.lng != null) {
      return { latitude: zoneOrCenter.center.lat, longitude: zoneOrCenter.center.lng };
    }
    if (zoneOrCenter.latitude != null && zoneOrCenter.longitude != null) {
      return { latitude: zoneOrCenter.latitude, longitude: zoneOrCenter.longitude };
    }
    if (zoneOrCenter.coords && zoneOrCenter.coords.latitude != null && zoneOrCenter.coords.longitude != null) {
      return { latitude: zoneOrCenter.coords.latitude, longitude: zoneOrCenter.coords.longitude };
    }
    return null;
  };

  // Add new safe zone (for admins, create on server)
  const handleAddSafeZone = async (coordinates, radius, name = "Zone") => {
    try {
      const token = user?.token || (await AsyncStorage.getItem("token"));
      if (!token) return Alert.alert("Error", "Not authenticated");
      const payload = {
        name,
        center: { lat: coordinates.latitude, lng: coordinates.longitude },
        radius,
      };
      await API.post("/geofences", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchGeofences();
    } catch (err) {
      console.log(
        "handleAddSafeZone error",
        err?.response?.data || err.message
      );
      Alert.alert("Error", "Failed to add geofence");
    }
  };

  // Center map on user location
  const centerMapOnUser = () => {
    if (mapRef.current && location) {
      mapRef.current.animateCamera({ center: location.coords, zoom: 14 });
    }
  };

  // Prompt for new zone radius
  const handleMapPress = (coord) => {
    // only allow admins to add geofences
    if (user?.role !== 'admin') {
      return Alert.alert('Not allowed', 'Only circle admins can add geofences');
    }

    if (Platform.OS === 'ios') {
      Alert.prompt('New Safe Zone', 'Enter radius in km', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: (radius) => handleAddSafeZone(coord, parseFloat(radius) || 1) },
      ], 'plain-text', '1');
    } else {
      Alert.alert('New Safe Zone', 'Enter radius in km via input below', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Add', onPress: () => handleAddSafeZone(coord, 1) },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient colors={["#6A1B9A", "#8E24AA"]} style={styles.header}>
        <Text style={styles.headerTitle}>{circleName}</Text>
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
            latitude: location?.coords?.latitude || 33.6844,
            longitude: location?.coords?.longitude || 73.0479,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={user?.role === 'admin' ? (e) => handleMapPress(e.nativeEvent.coordinate) : undefined}
        >
          {/* Loop through safe zones */}
          {safeZones.map((zone) => (
            <React.Fragment key={zone.id}>
              {/* Loop through members */}
              {members.map((m) => (
                <Marker
                  key={m._id}
                  coordinate={resolveCoords(m.location) || resolveCoords(m.coords) || { latitude: 0, longitude: 0 }}
                  pinColor={m.role === "admin" ? "blue" : "orange"}
                  title={m.name}
                />
              ))}

              {/* Draw the geofence circle */}
              <Circle
                center={resolveCoords(zone) || { latitude: 0, longitude: 0 }}
                radius={(zone.radius || 0) * 1000} // assuming radius in km
                fillColor={zone.safe ? "rgba(76,175,80,0.2)" : "rgba(255,0,0,0.2)"}
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
            style={[styles.zoneItem, { backgroundColor: item.safe ? "#E8F5E9" : "#FFEBEE" }]}
            onPress={() => navigation.navigate("ViewSafeZone", { safeZone: item })}
          >
            {(() => {
              const c = resolveCoords(item);
              return (
                <>
                  <Text>Lat: {c && c.latitude != null ? c.latitude.toFixed(5) : "N/A"}</Text>
                  <Text>Lon: {c && c.longitude != null ? c.longitude.toFixed(5) : "N/A"}</Text>
                  <Text>Name: {item.name}</Text>
                  <Text>Radius: {item.radius} km</Text>
                  <Text>Status: {item.safe ? "✅ Safe" : "⚠️ Outside"}</Text>
                </>
              );
            })()}
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
