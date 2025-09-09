import React, { useEffect, useState, useContext, useRef } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Animated,
  Alert,
} from "react-native";
import * as Maplibre from "@maplibre/maplibre-react-native";
import { ThemeContext } from "../../contexts/ThemeContext";
import { AuthContext } from "../../contexts/AuthContext";
import io from "socket.io-client";
import API from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Geolocation from "react-native-geolocation-service";
import { PermissionsAndroid, Platform } from "react-native";

// Socket server URL
const SOCKET_URL =
  process.env.SOCKET_URL || "https://7c92e792db0f.ngrok-free.app";

const MapScreen = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const navigation = useNavigation();

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
  const cameraRef = useRef(null);
  const socketRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  // Move camera
  const moveCamera = ([lng, lat]) => {
    if (!cameraRef.current?.setCamera) return;
    cameraRef.current.setCamera({
      centerCoordinate: [lng, lat],
      zoomLevel: 14,
      animationDuration: 1000,
    });
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: "Location Permission",
          message: "App needs access to your location",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  useEffect(() => {
    requestLocationPermission().then((granted) => {
      if (!granted) Alert.alert("Permission denied", "Cannot access location");
    });
  }, []);

  // Select member animation
  const selectMember = (member) => {
    setSelectedMember(member);
    const lng = member.location?.lng ?? member.location?.longitude ?? 73.0479;
    const lat = member.location?.lat ?? member.location?.latitude ?? 33.6844;
    moveCamera([lng, lat]);

    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start(() => setSelectedMember(null));
    }, 3000);
  };

  // Distance function
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Add safe zone
  const addSafeZone = (location, radius) => {
    setSafeZones((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        coordinates: location,
        radius: parseFloat(radius),
        safe: false,
      },
    ]);
  };

  // Load members + socket setup
  useEffect(() => {
    let mounted = true;
    const loadMembers = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Token missing");

        const { data } = await API.get("/users/circle-members", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!mounted) return;
        setMembers(data || []);
        setAdmin(data.find((m) => m.isAdmin) || null);
        setIsLoading(false);
      } catch (err) {
        console.log(err);
        Alert.alert("Error", "Failed to load members");
        setIsLoading(false);
      }
    };
    loadMembers();

    // Socket.io
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => console.log("Socket connected"));

    socket.on("locationUpdate", (member) => {
      setMembers((prev) => {
        const exists = prev.find((m) => m._id === member._id);
        if (exists) {
          return prev.map((m) =>
            m._id === member._id ? { ...m, ...member } : m
          );
        } else {
          return [...prev, member];
        }
      });
    });

    return () => {
      mounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    let watchId = null;

    if (safeZones.length > 0) {
      watchId = Geolocation.watchPosition(
        (position) => {
          // Update safe zones
        },
        (error) => console.log("Location error:", error),
        {
          enableHighAccuracy: false,
          timeout: 20000,
          maximumAge: 60000,
          distanceFilter: 50, // Only update if moved 50 meters
        }
      );
    }

    return () => {
      if (watchId) Geolocation.clearWatch(watchId);
    };
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
        <Text style={{ color: colors.text }}>Loading circle map...</Text>
      </View>
    );
  }

  const centerCoords = members.length
    ? [
        members[0]?.location?.lng ?? members[0]?.location?.longitude ?? 73.0479,
        members[0]?.location?.lat ?? members[0]?.location?.latitude ?? 33.6844,
      ]
    : [73.0479, 33.6844];

  const renderSelectedMemberCard = () => {
    if (!selectedMember) return null;
    return (
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
        <Text style={{ color: colors.text }}>{selectedMember.name}</Text>
        <Text style={{ color: colors.text }}>
          {selectedMember._id === admin?._id ? "Circle Admin" : "Member"}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={currentTheme === "dark" ? "light-content" : "dark-content"}
      />

      <Maplibre.MapView
        ref={mapRef}
        style={styles.map}
        styleURL="https://demotiles.maplibre.org/style.json"
      >
        <Maplibre.Camera
          ref={cameraRef}
          centerCoordinate={centerCoords}
          zoomLevel={14}
          animationMode="flyTo"
        />

        {/* Members */}
        {members.map((member) => {
          const lng =
            member.location?.lng ?? member.location?.longitude ?? 73.0479;
          const lat =
            member.location?.lat ?? member.location?.latitude ?? 33.6844;
          return (
            <Maplibre.PointAnnotation
              key={member._id}
              coordinate={[lng, lat]}
              onSelected={() => selectMember(member)}
            >
              <View
                style={{
                  backgroundColor: member._id === admin?._id ? "gold" : "blue",
                  padding: 5,
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "#fff" }}>{member.name[0]}</Text>
              </View>
            </Maplibre.PointAnnotation>
          );
        })}

        {/* Safe Zones */}
        {safeZones.map((zone) => (
          <Maplibre.CircleLayer
            key={zone.id}
            id={`safeZone-${zone.id}`}
            style={{
              circleRadius: zone.radius * 1000, // convert km to meters for visualization
              circleColor: zone.safe
                ? "rgba(0,255,0,0.3)"
                : "rgba(255,0,0,0.3)",
              circleStrokeWidth: 2,
              circleStrokeColor: zone.safe ? "green" : "red",
            }}
            coordinates={[
              zone.coordinates.longitude,
              zone.coordinates.latitude,
            ]}
          />
        ))}
      </Maplibre.MapView>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          navigation.navigate("AddSafeZoneScreen", { addSafeZone: addSafeZone })
        }
      >
        <Text style={{ color: "#fff" }}>+ Add Safe Zone</Text>
      </TouchableOpacity>

      {renderSelectedMemberCard()}
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
    padding: 10,
    borderRadius: 50,
  },
  selectedMemberCard: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
