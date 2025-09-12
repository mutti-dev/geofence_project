import React, { useState, useRef, useEffect, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  SafeAreaView,
} from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../../contexts/AuthContext";
import { API_URL } from "../../utils/constants";
import API from "../../api";



export default function AddSafeZoneScreen({ navigation, route }) {
  const addSafeZone = route.params?.addSafeZone;
  const [mapLocation, setMapLocation] = useState(null);
  const [radius, setRadius] = useState("");
  const [name, setName] = useState(""); // ✅ New state for safe zone name
  const mapRef = useRef(null);
  const { user } = useContext(AuthContext);

  const handleDone = () => {
    if (!mapLocation || !radius || !name) 
      return Alert.alert("Error", "Select location, radius, and name");

    addSafeZone({ coordinates: mapLocation, radius: parseFloat(radius), name:name });

    // Emit to backend so other circle members get new zone
   

    const {data} = API.post(`/circles/add-safezone`,{
      body: JSON.stringify({
        circleId: user.circle,
        coordinates: mapLocation,
        radius: parseFloat(radius),
        name,
      }),
    })

    console.log("AddSafeScreen Data", data)

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <LinearGradient colors={["#4A148C", "#6A1B9A"]} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Safe Zone</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Safe Zone Name Input */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Safe Zone Name</Text>
        <TextInput
          style={styles.inputText}
          placeholder="Enter safe zone name"
          value={name}
          onChangeText={setName}
        />
      </View>

      {/* Location Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Selected Location</Text>
        <Text>
          Latitude: {mapLocation?.latitude?.toFixed(6) ?? "Select location"}
        </Text>
        <Text>
          Longitude: {mapLocation?.longitude?.toFixed(6) ?? "Select location"}
        </Text>
      </View>

      {/* Radius Input */}
      <View style={[styles.card, { flexDirection: "row", alignItems: "center" }]}>
        <TextInput
          style={[styles.inputText, { flex: 1 }]}
          placeholder="Radius (km)"
          keyboardType="numeric"
          value={radius.toString()}
          onChangeText={setRadius}
        />
        <TouchableOpacity style={styles.button} onPress={handleDone}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: 33.6844,
            longitude: 73.0479,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onPress={(e) => setMapLocation(e.nativeEvent.coordinate)}
        >
          {mapLocation && <Marker coordinate={mapLocation} />}
          {mapLocation && radius ? (
            <Circle
              center={mapLocation}
              radius={parseFloat(radius) * 1000}
              fillColor="rgba(0,200,0,0.2)"
              strokeColor="#008080"
              strokeWidth={2}
            />
          ) : null}
        </MapView>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backText: { fontSize: 20, color: "#fff", fontWeight: "bold" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },

  card: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#4A148C",
  },

  inputText: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    height: 40,
    backgroundColor: "#fff",
  },
  button: {
    marginLeft: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#4A148C",
    borderRadius: 8,
  },

  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
  },
  map: { flex: 1 },
});
