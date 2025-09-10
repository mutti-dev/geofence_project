import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import { LinearGradient } from 'expo-linear-gradient';

export default function ViewSafeZoneScreen({ route, navigation }) {
  const cameraRef = useRef(null);
  const safeZone = route.params?.safeZone;
  // console.log("Viewing Safe Zone:", safeZone);

  if (!safeZone) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>⚠️ No Safe Zone Selected</Text>
        <TouchableOpacity
          style={styles.goBackBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleCenterMap = () => {
    if (cameraRef.current) {
      cameraRef.current.animateCamera({
        center: safeZone.coordinates,
        zoom: 14,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A148C" />

      {/* Header */}
      <LinearGradient colors={["#6A1B9A", "#4A148C"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Text style={styles.headerBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safe Zone</Text>
        <TouchableOpacity onPress={handleCenterMap} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>📍</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Zone Details</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Latitude:</Text>
          <Text style={styles.infoValue}>
            {safeZone.coordinates.latitude.toFixed(6)}°
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Longitude:</Text>
          <Text style={styles.infoValue}>
            {safeZone.coordinates.longitude.toFixed(6)}°
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Radius:</Text>
          <Text style={styles.infoValue}>{safeZone.radius} km</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Area:</Text>
          <Text style={styles.infoValue}>
            {(Math.PI * Math.pow(safeZone.radius, 2)).toFixed(2)} km²
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: safeZone.safe ? "#E8F5E9" : "#FFEBEE" },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: safeZone.safe ? "#2E7D32" : "#D32F2F" },
            ]}
          >
            {safeZone.safe ? "✅ Currently Safe" : "⚠️ Outside Zone"}
          </Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={cameraRef}
          style={styles.map}
          initialRegion={{
            latitude: safeZone.coordinates.latitude,
            longitude: safeZone.coordinates.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation={true}
        >
          <Marker coordinate={safeZone.coordinates} title="Safe Zone">
            <View style={styles.marker}>
              <Text style={styles.markerText}>🛡️</Text>
            </View>
          </Marker>
          <Circle
            center={safeZone.coordinates}
            radius={safeZone.radius * 1000}
            fillColor="rgba(76,175,80,0.2)"
            strokeColor="#4CAF50"
            strokeWidth={3}
          />
        </MapView>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#4CAF50" }]}
        >
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: "#F44336" }]}
        >
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  goBackBtn: { backgroundColor: "#4A148C", padding: 12, borderRadius: 25 },
  goBackText: { color: "#fff", fontSize: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  headerBtnText: { fontSize: 20, color: "#fff", fontWeight: "bold" },
  headerTitle: { fontSize: 20, color: "#fff", fontWeight: "bold" },

  infoCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    elevation: 3,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#4A148C",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: { fontSize: 14, color: "#555" },
  infoValue: { fontSize: 14, fontWeight: "bold", color: "#000" },
  statusBadge: {
    marginTop: 12,
    padding: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  statusText: { fontSize: 14, fontWeight: "600" },

  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
  },
  map: { flex: 1 },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  markerText: { fontSize: 18 },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  actionBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 5,
  },
  actionText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
