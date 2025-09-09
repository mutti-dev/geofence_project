import React, { useEffect, useState } from "react";
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

export default function MainScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [safeZones, setSafeZones] = useState([]);
  const isFocused = useIsFocused();

  useEffect(() => {
    let intervalId;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return Alert.alert("Permission denied");

      intervalId = setInterval(async () => {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(loc);

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

  const getDistance = (lat1, lon1, lat2, lon2) => {
    let R = 6371;
    let dLat = ((lat2 - lat1) * Math.PI) / 180;
    let dLon = ((lon2 - lon1) * Math.PI) / 180;
    let a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

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

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Current Location</Text>
      <Text>Lat: {location?.coords.latitude.toFixed(5) ?? "Loading..."}</Text>
      <Text>Lon: {location?.coords.longitude.toFixed(5) ?? "Loading..."}</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          navigation.navigate("AddSafeZoneScreen", { addSafeZone })
        }
      >
        <Text style={{ color: "#fff" }}>Add Safe Zone</Text>
      </TouchableOpacity>

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
              navigation.navigate("ViewSafeZoneScreen", { safeZone: item })
            }
          >
            <Text>Lat: {item.coordinates.latitude}</Text>
            <Text>Lon: {item.coordinates.longitude}</Text>
            <Text>Radius: {item.radius} km</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  heading: { fontSize: 18, fontWeight: "bold", marginVertical: 10 },
  button: {
    backgroundColor: "#008080",
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
  },
  zoneCard: {
    padding: 10,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
});
