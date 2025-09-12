import React, { useEffect, useState, useRef, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView,
  SafeAreaView,
  Button,
} from "react-native";
import * as Location from "expo-location";
import { useIsFocused } from "@react-navigation/native";
import MapView, { Marker } from "react-native-maps";

import { AuthContext } from "../../contexts/AuthContext";
import { useSocket } from "../../contexts/SocketContext";

import { ThemeContext } from "../../contexts/ThemeContext";

export default function MainScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [safeZones, setSafeZones] = useState([]);

  const [members, setMembers] = useState([]); // Track circle members
  const isFocused = useIsFocused();

  const { user } = useContext(AuthContext);
  const { colors } = useContext(ThemeContext) || {};
  const { socket, notifications } = useSocket();

  const USER_ID = user._id; // replace with real user ID
  const CIRCLE_ID = user.circle; // replace with user's circle ID

  // Initialize Socket.IO
  useEffect(() => {
    // Join circle room
    socket.emit("joinCircle", { circleId: CIRCLE_ID });

    // Listen for location updates of members
    socket.on("locationUpdate", (member) => {
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
    socket.on("geofenceNotification", (data) => {
      Alert.alert(data.message);
    });

    return () => socket.disconnect();
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

  // Normalize coordinates from various shapes to { latitude, longitude }
  const resolveCoords = (obj) => {
    if (!obj) return null;
    if (
      obj.coordinates &&
      obj.coordinates.latitude != null &&
      obj.coordinates.longitude != null
    ) {
      return {
        latitude: obj.coordinates.latitude,
        longitude: obj.coordinates.longitude,
      };
    }
    if (obj.center && obj.center.lat != null && obj.center.lng != null) {
      return { latitude: obj.center.lat, longitude: obj.center.lng };
    }
    if (obj.lat != null && obj.lng != null)
      return { latitude: obj.lat, longitude: obj.lng };
    if (obj.latitude != null && obj.longitude != null)
      return { latitude: obj.latitude, longitude: obj.longitude };
    if (
      obj.coords &&
      obj.coords.latitude != null &&
      obj.coords.longitude != null
    ) {
      return { latitude: obj.coords.latitude, longitude: obj.coords.longitude };
    }
    return null;
  };

  // Add Safe Zone
  const addSafeZone = (location, radius) => {
    // normalize radius to a positive number (km)
    let parsed =
      typeof radius === "string" ? parseFloat(radius) : Number(radius);
    if (!parsed || isNaN(parsed) || parsed <= 0) parsed = 1; // default 1 km
    const resolved = resolveCoords(location) || location;
    setSafeZones((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        coordinates: resolved,
        radius: parsed,
        safe: false,
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors?.backgroundColor }]}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors?.cardColor,
              borderBottomColor: colors?.borderColor,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors?.textColor }]}>
            Location Tracker
          </Text>
          <Text style={[styles.subtitle, { color: colors?.textSecondary }]}>
            Your current position and safe zones
          </Text>
        </View>

        {/* Current Location Card */}
        <View
          style={[
            styles.locationCard,
            {
              backgroundColor: colors?.cardColor,
              shadowColor: colors?.textColor,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors?.textColor }]}>
              📍 Current Location
            </Text>
          </View>
          <View style={styles.locationInfo}>
            <View style={styles.coordRow}>
              <Text
                style={[styles.coordLabel, { color: colors?.textSecondary }]}
              >
                Latitude:
              </Text>
              <Text style={[styles.coordValue, { color: colors?.textColor }]}>
                {location?.coords?.latitude != null
                  ? location.coords.latitude.toFixed(5)
                  : "Loading..."}
              </Text>
            </View>
            <View style={styles.coordRow}>
              <Text
                style={[styles.coordLabel, { color: colors?.textSecondary }]}
              >
                Longitude:
              </Text>
              <Text style={[styles.coordValue, { color: colors?.textColor }]}>
                {location?.coords?.longitude != null
                  ? location.coords.longitude.toFixed(5)
                  : "Loading..."}
              </Text>
            </View>
          </View>
        </View>

        {/* Add Safe Zone Button */}
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors?.accent }]}
          onPress={() =>
            navigation.navigate("AddSafeZoneScreen", { addSafeZone })
          }
          activeOpacity={0.8}
        >
          <Text style={[styles.addButtonText, { color: colors?.textColor }]}>
            + Add New Safe Zone
          </Text>
        </TouchableOpacity>

        {/* Safe Zones Section */}
        <View style={styles.safeZonesSection}>
          <Text style={[styles.sectionTitle, { color: colors?.textColor }]}>
            🛡️ Safe Zones ({safeZones.length})
          </Text>

          {safeZones.length === 0 ? (
            <View
              style={[
                styles.emptyState,
                {
                  backgroundColor: colors?.surfaceColor,
                  borderColor: colors?.borderColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.emptyStateText,
                  { color: colors?.textSecondary },
                ]}
              >
                No safe zones added yet
              </Text>
              <Text
                style={[
                  styles.emptyStateSubText,
                  { color: colors?.textSecondary },
                ]}
              >
                Tap the button above to create your first safe zone
              </Text>
            </View>
          ) : (
            <FlatList
              data={safeZones}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.zoneCard,
                    {
                      backgroundColor: colors?.cardColor,
                      borderLeftColor: item.safe ? "#28a745" : "#ffc107",
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate("ViewSafeZone", {
                      safeZone: { ...item, name: item.name || "Safe Zone" },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.zoneHeader}>
                    <Text
                      style={[styles.zoneName, { color: colors?.textColor }]}
                    >
                      {item.name || "Safe Zone"}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        item.safe
                          ? { backgroundColor: "#d4edda" }
                          : { backgroundColor: "#fff3cd" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: colors?.textSecondary },
                        ]}
                      >
                        {item.safe ? "SAFE" : "OUTSIDE"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.zoneDetails}>
                    <View style={styles.detailRow}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: colors?.textSecondary },
                        ]}
                      >
                        Location:
                      </Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: colors?.textColor },
                        ]}
                      >
                        {item.coordinates?.latitude != null &&
                        item.coordinates?.longitude != null
                          ? `${item.coordinates.latitude.toFixed(
                              3
                            )}, ${item.coordinates.longitude.toFixed(3)}`
                          : "N/A"}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text
                        style={[
                          styles.detailLabel,
                          { color: colors?.textSecondary },
                        ]}
                      >
                        Radius:
                      </Text>
                      <Text
                        style={[
                          styles.detailValue,
                          { color: colors?.textColor },
                        ]}
                      >
                        {item.radius != null ? `${item.radius} km` : "N/A"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statusRow}>
                    <Text
                      style={[
                        styles.statusIndicator,
                        item.safe ? { color: "#28a745" } : { color: "#fd7e14" },
                      ]}
                    >
                      {item.safe
                        ? "✅ Inside Safe Zone"
                        : "⚠️ Outside Safe Zone"}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Map Section */}
        <View style={styles.mapSection}>
          <Text style={[styles.sectionTitle, { color: colors?.textColor }]}>
            🗺️ Live Map
          </Text>
          {location ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location.coords.latitude,
                  longitude: location.coords.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                showsUserLocation
              >
                {members
                  .map((m) => ({
                    ...m,
                    _coords: resolveCoords(m.location) || resolveCoords(m),
                  }))
                  .filter((m) => m._coords)
                  .map((m) => (
                    <Marker
                      key={m._id}
                      coordinate={{
                        latitude: m._coords.latitude,
                        longitude: m._coords.longitude,
                      }}
                      title={m.name}
                    />
                  ))}
              </MapView>
            </View>
          ) : (
            <View
              style={[
                styles.mapPlaceholder,
                { backgroundColor: colors?.surfaceColor },
              ]}
            >
              <Text
                style={[
                  styles.mapPlaceholderText,
                  { color: colors?.textSecondary },
                ]}
              >
                Loading map...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  // Header Styles
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",

    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6c757d",
    fontWeight: "400",
  },

  // Location Card Styles
  locationCard: {
    backgroundColor: "#ffffff",
    margin: 16,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
  },
  locationInfo: {
    gap: 12,
  },
  coordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  coordLabel: {
    fontSize: 16,
    color: "#495057",
    fontWeight: "500",
  },
  coordValue: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "600",
    fontFamily: "monospace",
  },

  // Button Styles
  addButton: {
    backgroundColor: "#ff7f50",
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Safe Zones Section
  safeZonesSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 16,
  },

  // Empty State
  emptyState: {
    backgroundColor: "#ffffff",
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderStyle: "dashed",
  },
  emptyStateText: {
    fontSize: 18,
    color: "#6c757d",
    fontWeight: "500",
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    color: "#adb5bd",
    textAlign: "center",
    lineHeight: 20,
  },

  // Zone Card Styles
  zoneCard: {
    backgroundColor: "#ffffff",
    padding: 20,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderLeftWidth: 4,
  },
  safeZoneActive: {
    borderLeftColor: "#28a745",
    backgroundColor: "#f8fff8",
  },
  safeZoneInactive: {
    borderLeftColor: "#ffc107",
    backgroundColor: "#fffef8",
  },

  zoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  zoneName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusSafe: {
    backgroundColor: "#d4edda",
  },
  statusUnsafe: {
    backgroundColor: "#fff3cd",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2c3e50",
  },

  zoneDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 15,
    color: "#6c757d",
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 15,
    color: "#495057",
    fontWeight: "600",
    fontFamily: "monospace",
  },

  statusRow: {
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingTop: 16,
  },
  statusIndicator: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  statusTextSafe: {
    color: "#28a745",
  },
  statusTextUnsafe: {
    color: "#fd7e14",
  },

  // Map Section
  mapSection: {
    margin: 16,
    marginTop: 8,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  map: {
    height: 300,
    width: "100%",
  },
  mapPlaceholder: {
    height: 300,
    backgroundColor: "#e9ecef",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholderText: {
    fontSize: 16,
    color: "#6c757d",
    fontWeight: "500",
  },
});
