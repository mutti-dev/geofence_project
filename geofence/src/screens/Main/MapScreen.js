import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import { ThemeContext } from "../../contexts/ThemeContext";
import { AuthContext } from "../../contexts/AuthContext";
import io from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location"; // ✅ expo-location
import { useNavigation } from "@react-navigation/native";

const SOCKET_URL = "https://7c92e792db0f.ngrok-free.app";

const MapScreen = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();
  const [userLocation, setUserLocation] = useState(null);

  const colors =
    currentTheme === "dark"
      ? { background: "#121212", text: "#fff", cardBg: "#1e1e1e" }
      : { background: "#fff", text: "#2c3e50", cardBg: "#ffffff" };

  const [members, setMembers] = useState([]);
  const [safeZones, setSafeZones] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const mapRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);
  const socketRef = useRef(null);
  const locationWatcher = useRef(null);

  // Haversine formula
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

  const moveCamera = (coords) => {
    if (mapRef.current) {
      mapRef.current.animateCamera(
        { center: coords, zoom: 14 },
        { duration: 1000 }
      );
    }
  };

  const selectMember = (member) => {
    if (!member) return;
    setSelectedMember(member);

    const lng = member.location?.longitude ?? 73.0479;
    const lat = member.location?.latitude ?? 33.6844;
    moveCamera({ latitude: lat, longitude: lng });

    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }).start(
        () => setSelectedMember(null)
      );
    }, 3000);
  };

  // ✅ Safe zone add
  const addSafeZone = (location, radius) => {
    if (!location || !location.latitude || !location.longitude || !radius) {
      Alert.alert("Error", "Invalid location or radius");
      return;
    }
    setSafeZones((prev) => [
      ...prev,
      {
        id: Date.now(),
        coordinates: location,
        radius: parseFloat(radius),
        safe: false,
      },
    ]);
  };

  // ✅ Location watcher using expo-location
  const startLocationWatch = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Cannot access location");
      return;
    }

    locationWatcher.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 50,
      },
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });

        // Emit to socket
        if (socketRef.current && user) {
          socketRef.current.emit("locationUpdate", {
            userId: user._id,
            location: { latitude, longitude },
            timestamp: Date.now(),
          });
        }

        // Safe zone check
        setSafeZones((prev) =>
          prev.map((zone) => {
            const distance = getDistance(
              latitude,
              longitude,
              zone.coordinates.latitude,
              zone.coordinates.longitude
            );
            return { ...zone, safe: distance <= zone.radius };
          })
        );
      }
    );
  };

  const stopLocationWatch = () => {
    if (locationWatcher.current) {
      locationWatcher.current.remove();
      locationWatcher.current = null;
    }
  };

  // Load members + socket setup
  useEffect(() => {
    let mounted = true;

    const loadMembers = async () => {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      }
      const data = []; // replace with API
      if (!mounted) return;
      setMembers(data);
      setAdmin(data.find((m) => m.isAdmin) || null);
      setIsLoading(false);
    };

    const setupSocket = () => {
      const socket = io(SOCKET_URL, { timeout: 10000, forceNew: true });
      socketRef.current = socket;

      socket.on("connect", () => {
        if (user) socket.emit("join", { userId: user._id });
      });

      socket.on("locationUpdate", (member) => {
        setMembers((prev) => {
          const exists = prev.find((m) => m._id === member._id);
          if (exists) {
            return prev.map((m) =>
              m._id === member._id ? { ...m, ...member } : m
            );
          }
          return [...prev, member];
        });
      });
    };

    loadMembers();
    setupSocket();

    return () => {
      mounted = false;
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user]);

  // Start watching only if safe zones exist
  useEffect(() => {
    if (safeZones.length > 0) startLocationWatch();
    return () => stopLocationWatch();
  }, [safeZones.length]);

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color="#008080" />
        <Text style={{ color: colors.text }}>Loading map...</Text>
      </View>
    );
  }

  const centerCoords =
    members.length && members[0]?.location
      ? {
          latitude: members[0].location.latitude ?? 33.6844,
          longitude: members[0].location.longitude ?? 73.0479,
        }
      : { latitude: 33.6844, longitude: 73.0479 };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={currentTheme === "dark" ? "light-content" : "dark-content"}
      />

      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          ...centerCoords,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true} // ✅ force karo
        showsMyLocationButton={true} // ✅ android pe button bhi aayega
      >
        {members.map(
          (member) =>
            member?._id &&
            member.location?.latitude &&
            member.location?.longitude && (
              <Marker
                key={member._id}
                coordinate={{
                  latitude: member.location.latitude,
                  longitude: member.location.longitude,
                }}
                onPress={() => selectMember(member)}
              >
                <View
                  style={{
                    backgroundColor:
                      member._id === admin?._id ? "gold" : "blue",
                    padding: 5,
                    borderRadius: 10,
                  }}
                >
                  <Text
                    style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}
                  >
                    {member.name ? member.name[0].toUpperCase() : "?"}
                  </Text>
                </View>
              </Marker>
            )
        )}
        {userLocation && (
          <Marker coordinate={userLocation} title="You" pinColor="blue" />
        )}
        {safeZones.map(
          (zone) =>
            zone?.coordinates && (
              <Circle
                key={zone.id}
                center={{
                  latitude: zone.coordinates.latitude,
                  longitude: zone.coordinates.longitude,
                }}
                radius={zone.radius * 1000}
                fillColor={
                  zone.safe ? "rgba(0,255,0,0.3)" : "rgba(255,0,0,0.3)"
                }
                strokeColor={zone.safe ? "green" : "red"}
                strokeWidth={2}
              />
            )
        )}
      </MapView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          navigation.navigate("AddSafeZoneScreen", { addSafeZone })
        }
      >
        <Text style={{ color: "#fff", fontSize: 14, fontWeight: "bold" }}>
          + Add Safe Zone
        </Text>
      </TouchableOpacity>

      {selectedMember && (
        <Animated.View
          style={[
            styles.selectedMemberCard,
            {
              backgroundColor: colors.cardBg,
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text
            style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}
          >
            {selectedMember.name || "Unknown User"}
          </Text>
          <Text style={{ color: colors.text, fontSize: 14 }}>
            {selectedMember._id === admin?._id ? "Circle Admin" : "Member"}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#008080",
    padding: 12,
    borderRadius: 50,
    elevation: 5,
  },
  selectedMemberCard: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
