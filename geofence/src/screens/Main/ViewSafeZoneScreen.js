import React from "react";
import { View, Text, StyleSheet, StatusBar } from "react-native";
import * as Maplibre from "@maplibre/maplibre-react-native";

export default function ViewSafeZoneScreen({ route }) {
  const cameraRef = useRef(null);

  const safeZone = route.params?.safeZone;
  if (!safeZone) return <Text>No Safe Zone Selected</Text>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.card}>
        <Text style={styles.heading}>Safe Zone</Text>
        <Text>Latitude: {safeZone.coordinates.latitude}</Text>
        <Text>Longitude: {safeZone.coordinates.longitude}</Text>
        <Text>Radius: {safeZone.radius} km</Text>
      </View>

      <View style={styles.mapContainer}>
        <Maplibre.MapView
          style={styles.map}
          styleURL="https://demotiles.maplibre.org/style.json"
        >
          <Maplibre.Camera
            ref={cameraRef}
            centerCoordinate={centerCoords} // initial center
            zoomLevel={14}
            animationMode="flyTo" // smooth animation
            animationDuration={1500}
          />
          <Maplibre.PointAnnotation
            id="safeZoneMarker"
            coordinate={[
              safeZone.coordinates.longitude,
              safeZone.coordinates.latitude,
            ]}
          />
          <Maplibre.CircleLayer
            id="safeZoneCircle"
            style={{
              circleRadius: safeZone.radius * 1000,
              circleColor: "rgba(0,255,0,0.3)",
              circleStrokeWidth: 2,
              circleStrokeColor: "green",
            }}
            coordinates={[
              safeZone.coordinates.longitude,
              safeZone.coordinates.latitude,
            ]}
          />
        </Maplibre.MapView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    margin: 10,
    borderRadius: 8,
  },
  heading: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  mapContainer: { flex: 1, margin: 10, borderRadius: 8, overflow: "hidden" },
  map: { flex: 1 },
});
