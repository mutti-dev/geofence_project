// --- Geofence/Map Screen: Enhanced with search, labels, and live member markers ---
import React, { useState, useEffect, useRef, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Platform,
  TextInput,
  Modal,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Image,
} from "react-native";
import MapView, { Marker, Circle, Callout } from "react-native-maps";
import * as Location from "expo-location";
import { useIsFocused } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../../contexts/AuthContext";
import API from "../../api";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
// import { GooglePlacesAutocomplete } from "expo-google-places-autocomplete";

export default function GeofenceManagementScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [location, setLocation] = useState(null);
  const [geofences, setGeofences] = useState([]);
  console.log("geofences", geofences);
  const [members, setMembers] = useState([]);
  console.log("members", members);
  const [circleName, setCircleName] = useState("Geofence Management");
  const [isCreatingZone, setIsCreatingZone] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [zoneName, setZoneName] = useState("");
  const [zoneDescription, setZoneDescription] = useState("");
  const [zoneRadius, setZoneRadius] = useState(100); // in meters
  const [zoneType, setZoneType] = useState("safe");
  const [loading, setLoading] = useState(false);
  const [selectedGeofence, setSelectedGeofence] = useState(null);
  const [showGeofenceDetails, setShowGeofenceDetails] = useState(false);

  const mapRef = useRef(null);
  const isFocused = useIsFocused();

  const GOOGLE_MAPS_API_KEY =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    "AIzaSyDuu206kDJe12RY8TUVnEUn3QMz2cVt-OU";
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Fetch geofences and members
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await API.get("/geofences/admin", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      console.log("API response:", response.data); // <-- Check if you get data
      const {
        circleName: cName,
        geofences: fetchedGeofences = [],
        members: fetchedMembers = [],
      } = response.data || {};

      setCircleName(cName || "Geofence Management");
      setGeofences(fetchedGeofences);
      setMembers(fetchedMembers);
    } catch (err) {
      console.log("Fetch data error", err.response?.data || err.message);
      Alert.alert("Error", "Failed to load geofence data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused && user?.role === "admin") {
      fetchData();
    }
  }, [isFocused, user]);

  // Get current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const handleMapPress = (event) => {
    if (user?.role !== "admin") return;

    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);
    setIsCreatingZone(true);
  };

  const handleCreateZone = async () => {
    if (!zoneName.trim()) {
      Alert.alert("Error", "Please enter a zone name");
      return;
    }

    try {
      setLoading(true);
      const response = await API.post("/geofences", {
        name: zoneName.trim(),
        description: zoneDescription.trim(),
        center: {
          lat: selectedLocation.latitude,
          lng: selectedLocation.longitude,
        },
        radius: zoneRadius,
        zoneType,
        active: true,
        notifications: {
          onEntry: true,
          onExit: false,
          notifyAdmin: true,
          notifyMember: false,
        },
      });

      if (response.data) {
        Alert.alert("Success", "Safe zone created successfully");
        setZoneName("");
        setZoneDescription("");
        setZoneRadius(100);
        setZoneType("safe");
        setSelectedLocation(null);
        setIsCreatingZone(false);
        fetchData(); // Refresh the list
      }
    } catch (err) {
      console.log("Create zone error", err.response?.data || err.message);
      Alert.alert("Error", "Failed to create safe zone");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (geofenceId) => {
    Alert.alert(
      "Delete Zone",
      "Are you sure you want to delete this safe zone?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await API.delete(`/geofences/${geofenceId}`);
              Alert.alert("Success", "Safe zone deleted successfully");
              fetchData();
            } catch (err) {
              console.log(
                "Delete zone error",
                err.response?.data || err.message
              );
              Alert.alert("Error", "Failed to delete safe zone");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleZoneStatus = async (geofenceId) => {
    try {
      setLoading(true);
      const response = await API.patch(`/geofences/${geofenceId}/toggle`);
      if (response.data) {
        Alert.alert("Success", response.data.message);
        fetchData();
      }
    } catch (err) {
      console.log("Toggle zone error", err.response?.data || err.message);
      Alert.alert("Error", "Failed to toggle zone status");
    } finally {
      setLoading(false);
    }
  };

  const centerMapOnUser = () => {
    if (mapRef.current && location) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const getZoneColor = (zoneType, active) => {
    if (!active) return "rgba(128, 128, 128, 0.3)";
    switch (zoneType) {
      case "safe":
        return "rgba(76, 175, 80, 0.3)";
      case "restricted":
        return "rgba(244, 67, 54, 0.3)";
      case "custom":
        return "rgba(33, 150, 243, 0.3)";
      default:
        return "rgba(76, 175, 80, 0.3)";
    }
  };

  const getZoneBorderColor = (zoneType, active) => {
    if (!active) return "#808080";
    switch (zoneType) {
      case "safe":
        return "#4CAF50";
      case "restricted":
        return "#F44336";
      case "custom":
        return "#2196F3";
      default:
        return "#4CAF50";
    }
  };

  if (user?.role !== "admin") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.unauthorizedContainer}>
          <Text style={styles.unauthorizedText}>Access Denied</Text>
          <Text style={styles.unauthorizedSubtext}>
            Only admins can manage geofences
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6A1B9A" />

      {/* Header */}
      <LinearGradient colors={["#6A1B9A", "#8E24AA"]} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{circleName}</Text>
        <TouchableOpacity onPress={centerMapOnUser} style={styles.userBtn}>
          <Text style={styles.userBtnText}>📍</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Search Bar */}
      <View
        style={{
          zIndex: 10,
          position: "absolute",
          top: Platform.OS === "ios" ? 60 : 30,
          left: 10,
          right: 10,
        }}
      >
        <GooglePlacesAutocomplete
          placeholder="Search for a place"
          fetchDetails={true} // must be boolean
          onPress={(data, details = null) => {
            if (details?.geometry?.location) {
              const { lat, lng } = details.geometry.location;
              setSelectedLocation({ latitude: lat, longitude: lng });
              setIsCreatingZone(true);
              mapRef.current?.animateToRegion({
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              });
            }
          }}
          query={{
            key: GOOGLE_MAPS_API_KEY,
            language: "en",
          }}
          styles={{
            container: { flex: 1 },
            textInput: styles.searchInput,
            listView: { backgroundColor: "#fff" },
          }}
          onFail={(error) =>
            console.log("GooglePlacesAutocomplete error:", error)
          }
          enablePoweredByContainer={false}
        />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location?.coords?.latitude || 33.6844,
            longitude: location?.coords?.longitude || 73.0479,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
          showsMyLocationButton={false}
          onPress={handleMapPress}
        >
          {/* Selected location marker */}
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              title="New Zone Location"
              pinColor="red"
            />
          )}

          {/* Member locations */}
          {members.map((member) => (
            <Marker
              key={member._id}
              coordinate={{
                latitude: member.location?.lat || 0,
                longitude: member.location?.lng || 0,
              }}
              title={member.name}
              description={member.role}
              onPress={() => {
                setSelectedMember(member);
                setShowProfileModal(true);
              }}
              zIndex={3}
            >
              <View style={styles.memberMarkerContainer}>
                {member.profilePicture?.url ? (
                  <Image
                    source={{ uri: member.profilePicture.url }}
                    style={styles.memberAvatar}
                  />
                ) : (
                  <View style={styles.memberAvatarFallback}>
                    <Text style={styles.memberAvatarText}>
                      {member.name[0]?.toUpperCase() || "?"}
                    </Text>
                  </View>
                )}
                <Text style={styles.memberMarkerName}>{member.name}</Text>
              </View>
            </Marker>
          ))}

          {/* Geofence circles */}
          {geofences.map((geofence) => (
            <Circle
              key={geofence._id}
              center={{
                latitude: geofence.center.lat,
                longitude: geofence.center.lng,
              }}
              radius={geofence.radius}
              fillColor={getZoneColor(geofence.zoneType, geofence.active)}
              strokeColor={getZoneBorderColor(
                geofence.zoneType,
                geofence.active
              )}
              strokeWidth={2}
            />
          ))}

          {/* Geofence labels */}
          {geofences.map((geofence) => (
            <Marker
              key={geofence._id + "_label"}
              coordinate={{
                latitude: geofence.center.lat,
                longitude: geofence.center.lng,
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
              zIndex={2}
              flat
              tappable={false}
            >
              <View style={styles.geofenceLabelContainer}>
                <Text style={styles.geofenceLabelText}>{geofence.name}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Zone List */}
      <View style={styles.zoneListContainer}>
        <Text style={styles.zoneListTitle}>
          Safe Zones ({geofences.length})
        </Text>
        <ScrollView
          style={styles.zoneList}
          showsVerticalScrollIndicator={false}
        >
          {geofences.map((geofence) => (
            <TouchableOpacity
              key={geofence._id}
              style={styles.zoneItem}
              onPress={() => {
                setSelectedGeofence(geofence);
                setShowGeofenceDetails(true);
              }}
            >
              <View style={styles.zoneInfo}>
                <Text style={styles.zoneName}>{geofence.name}</Text>
                <Text style={styles.zoneDescription}>
                  {geofence.description || "No description"}
                </Text>
                <Text style={styles.zoneDetails}>
                  Radius: {geofence.radius}m • Type: {geofence.zoneType}
                </Text>
              </View>
              <View style={styles.zoneActions}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    {
                      backgroundColor: geofence.active ? "#4CAF50" : "#F44336",
                    },
                  ]}
                  onPress={() => handleToggleZoneStatus(geofence._id)}
                >
                  <Text style={styles.statusButtonText}>
                    {geofence.active ? "Active" : "Inactive"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteZone(geofence._id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Create Zone Modal */}
      <Modal
        visible={isCreatingZone}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCreatingZone(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Safe Zone</Text>

            <TextInput
              style={styles.input}
              placeholder="Zone Name *"
              value={zoneName}
              onChangeText={setZoneName}
              placeholderTextColor="#999"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={zoneDescription}
              onChangeText={setZoneDescription}
              multiline
              numberOfLines={3}
              placeholderTextColor="#999"
            />

            <View style={styles.radiusContainer}>
              <Text style={styles.radiusLabel}>Radius: {zoneRadius}m</Text>
              <TouchableOpacity
                style={styles.radiusButton}
                onPress={() => {
                  const newRadius =
                    zoneRadius === 1000 ? 100 : zoneRadius + 100;
                  setZoneRadius(newRadius);
                }}
              >
                <Text style={styles.radiusButtonText}>Change</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsCreatingZone(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, loading && styles.disabledButton]}
                onPress={handleCreateZone}
                disabled={loading}
              >
                <Text style={styles.createButtonText}>
                  {loading ? "Creating..." : "Create Zone"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Geofence Details Modal */}
      <Modal
        visible={showGeofenceDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGeofenceDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Zone Details</Text>

            {selectedGeofence && (
              <>
                <Text style={styles.detailText}>
                  Name: {selectedGeofence.name}
                </Text>
                <Text style={styles.detailText}>
                  Description: {selectedGeofence.description || "None"}
                </Text>
                <Text style={styles.detailText}>
                  Type: {selectedGeofence.zoneType}
                </Text>
                <Text style={styles.detailText}>
                  Radius: {selectedGeofence.radius}m
                </Text>
                <Text style={styles.detailText}>
                  Status: {selectedGeofence.active ? "Active" : "Inactive"}
                </Text>
                <Text style={styles.detailText}>
                  Created:{" "}
                  {new Date(selectedGeofence.createdAt).toLocaleDateString()}
                </Text>
              </>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowGeofenceDetails(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Member Profile Modal */}
      <Modal
        visible={showProfileModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <View style={styles.profileModalOverlay}>
          <View style={styles.profileModalContent}>
            {selectedMember && (
              <>
                {selectedMember.profilePicture?.url ? (
                  <Image
                    source={{ uri: selectedMember.profilePicture.url }}
                    style={styles.profileModalAvatar}
                  />
                ) : (
                  <View style={styles.profileModalAvatarFallback}>
                    <Text style={styles.profileModalAvatarText}>
                      {selectedMember.name[0]?.toUpperCase() || "?"}
                    </Text>
                  </View>
                )}
                <Text style={styles.profileModalName}>
                  {selectedMember.name}
                </Text>
                <Text style={styles.profileModalRole}>
                  {selectedMember.role}
                </Text>
                <Text style={styles.profileModalEmail}>
                  {selectedMember.email}
                </Text>
                <TouchableOpacity
                  style={styles.profileModalCloseBtn}
                  onPress={() => setShowProfileModal(false)}
                >
                  <Text style={styles.profileModalCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6A1B9A" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  unauthorizedText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F44336",
    marginBottom: 8,
  },
  unauthorizedSubtext: {
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  userBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  userBtnText: {
    fontSize: 20,
  },
  mapContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  zoneListContainer: {
    height: 200,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  zoneListTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  zoneList: {
    flex: 1,
  },
  zoneItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  zoneInfo: {
    flex: 1,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  zoneDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  zoneDetails: {
    fontSize: 12,
    color: "#999",
  },
  zoneActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  statusButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: "#F44336",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  radiusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  radiusLabel: {
    fontSize: 16,
    color: "#333",
  },
  radiusButton: {
    backgroundColor: "#6A1B9A",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
  },
  radiusButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  createButton: {
    flex: 1,
    backgroundColor: "#6A1B9A",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#ccc",
  },
  detailText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: "#6A1B9A",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchInput: {
    height: 44,
    borderRadius: 8,
    backgroundColor: "#fff",
    fontSize: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderColor: "#e0e0e0",
    borderWidth: 1,
  },
  geofenceLabelContainer: {
    backgroundColor: "rgba(76,175,80,0.9)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  geofenceLabelText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  memberMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#fff",
    marginBottom: 2,
  },
  memberAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2d9d91",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  memberAvatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  memberMarkerName: {
    color: "#333",
    fontSize: 12,
    fontWeight: "600",
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 6,
    paddingHorizontal: 4,
    marginTop: 2,
  },
  profileModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  profileModalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: 300,
  },
  profileModalAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  profileModalAvatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2d9d91",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  profileModalAvatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 36,
  },
  profileModalName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  profileModalRole: {
    fontSize: 16,
    color: "#2d9d91",
    marginBottom: 2,
  },
  profileModalEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  profileModalCloseBtn: {
    backgroundColor: "#6A1B9A",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 10,
  },
  profileModalCloseText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
