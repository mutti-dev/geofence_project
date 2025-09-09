import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from "react-native";
import * as Maplibre from "@maplibre/maplibre-react-native";

export default function AddSafeZoneScreen({ navigation, route }) {
  const addSafeZone = route.params?.addSafeZone;
  console.log("AddSafeZoneScreen params:", route.params); 
  const [mapLocation, setMapLocation] = useState(null);
  const [radius, setRadius] = useState("");
  const cameraRef = useRef(null);

  // Move camera to selected location
  useEffect(() => {
    if (mapLocation && cameraRef.current?.setCamera) {
      cameraRef.current.setCamera({
        centerCoordinate: [mapLocation.longitude, mapLocation.latitude],
        zoomLevel: 14,
        animationDuration: 1000,
      });
    }
  }, [mapLocation]);

  const handleDone = () => {
    if (!mapLocation || !radius)
      return Alert.alert("Error", "Select location and radius");
    addSafeZone(mapLocation, parseFloat(radius));
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Selected location info */}
      <View style={styles.card}>
        <Text style={styles.heading}>Selected Location</Text>
        <Text>Latitude: {mapLocation?.latitude ?? "Select location"}</Text>
        <Text>Longitude: {mapLocation?.longitude ?? "Select location"}</Text>
      </View>

      {/* Radius input + Done button */}
      <View
        style={[styles.card, { flexDirection: "row", alignItems: "center" }]}
      >
        <TextInput
          style={[styles.inputText, { flex: 1 }]}
          placeholder="Radius (km)"
          keyboardType="numeric"
          value={radius.toString()}
          onChangeText={(text) => setRadius(text)}
        />
        <TouchableOpacity style={styles.button} onPress={handleDone}>
          <Text style={{ color: "#fff" }}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <Maplibre.MapView
          style={styles.map}
          styleURL="https://demotiles.maplibre.org/style.json"
          onPress={(e) => {
            const coords = e.geometry?.coordinates;
            if (coords)
              setMapLocation({ longitude: coords[0], latitude: coords[1] });
          }}
        >
          <Maplibre.Camera
            ref={cameraRef}
            centerCoordinate={
              mapLocation
                ? [mapLocation.longitude, mapLocation.latitude]
                : [73.0479, 33.6844]
            }
            zoomLevel={mapLocation ? 14 : 5}
            animationMode="flyTo"
          />

          {/* Circle showing safe zone */}
          {mapLocation && radius ? (
            <Maplibre.ShapeSource
              id="safeZoneSource"
              shape={{
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [mapLocation.longitude, mapLocation.latitude],
                },
              }}
            >
              <Maplibre.CircleLayer
                id="safeZoneCircle"
                style={{
                  circleRadius: parseFloat(radius) * 1000, // km -> meters
                  circleColor: "rgba(0,255,0,0.3)",
                  circleStrokeWidth: 2,
                  circleStrokeColor: "green",
                }}
              />
            </Maplibre.ShapeSource>
          ) : null}

          {/* Marker at selected location */}
          {mapLocation && (
            <Maplibre.PointAnnotation
              id="selectedLocation"
              coordinate={[mapLocation.longitude, mapLocation.latitude]}
            />
          )}
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
  inputText: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 5,
    borderRadius: 5,
    height: 40,
  },
  button: {
    marginLeft: 10,
    padding: 10,
    backgroundColor: "#008080",
    borderRadius: 5,
  },
  mapContainer: { flex: 1, margin: 10, borderRadius: 8, overflow: "hidden" },
  map: { flex: 1 },
});
