import React, { useEffect, useState, useContext, useRef } from "react";
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  StatusBar,
  ActivityIndicator,
  Animated,
  Alert
} from "react-native";
import * as Maplibre from "@maplibre/maplibre-react-native";

import MapMarker from "../../components/MapMarker";
import CircleMember from "../../components/CircleMember";
import { ThemeContext } from "../../contexts/ThemeContext";
import { AuthContext } from "../../contexts/AuthContext";
import io from "socket.io-client";
import API from "../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";


// Socket server URL
const SOCKET_URL = "https://5825c59b9163.ngrok-free.app";

// defensive exports: maplibre package may export default or named MapView/Marker
const MapViewLib = Maplibre.MapView || Maplibre.default || Maplibre;
const MarkerLib = Maplibre.Marker || Maplibre.PointAnnotation || Maplibre.MarkerView || null;

const MapScreen = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const colors =
    currentTheme === "dark"
      ? { 
          background: "#121212", 
          text: "#fff",
          cardBg: "#1e1e1e",
          headerBg: "rgba(18, 18, 18, 0.95)",
          membersBg: "rgba(30, 30, 30, 0.95)",
          shadow: "rgba(0, 0, 0, 0.5)"
        }
      : { 
          background: "#fff", 
          text: "#2c3e50",
          cardBg: "#ffffff",
          headerBg: "rgba(255, 255, 255, 0.95)",
          membersBg: "rgba(255, 255, 255, 0.95)",
          shadow: "rgba(0, 0, 0, 0.1)"
        };

  const [members, setMembers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  
  const mapRef = useRef(null);
  const socketRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  // Animate camera to a new coordinate (expects [lng, lat])
  const moveCamera = (coord) => {
    if (!mapRef.current || !coord) return;
    const [lng, lat] = coord;
    // try setCamera (maplibre), flyTo, or animateToRegion (react-native-maps)
    try {
      if (typeof mapRef.current.setCamera === 'function') {
        mapRef.current.setCamera({ centerCoordinate: coord, zoomLevel: 14, animationDuration: 1500 });
        return;
      }
      if (typeof mapRef.current.flyTo === 'function') {
        mapRef.current.flyTo([lng, lat], 1500);
        return;
      }
      if (typeof mapRef.current.animateToRegion === 'function') {
        mapRef.current.animateToRegion({ latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 1000);
        return;
      }
    } catch (e) {
      console.log('moveCamera error', e.message || e);
    }
  };

  // Animate member selection
  const selectMember = (member) => {
    setSelectedMember(member);
    const lng = member.location?.lng ?? member.location?.longitude ?? 73.0479;
    const lat = member.location?.lat ?? member.location?.latitude ?? 33.6844;
    moveCamera([lng, lat]);
    
    // Animate slide up effect
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Auto hide after 3 seconds
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start(() => setSelectedMember(null));
      timeoutRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    // if no user or circle, stop loading and don't initialize
    if (!user || !user.circle) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const loadMembers = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) {
          Alert.alert("Error", "You are not logged in");
          setIsLoading(false);
          return;
        }
        const { data } = await API.get("/users/circle-members", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!mounted) return;
        setMembers(data || []);
        setIsLoading(false);
      } catch (error) {
        console.log("Error fetching members:", error);
        Alert.alert("Error", "Failed to fetch members");
        setIsLoading(false);
      }
    };

    loadMembers();

    // connect socket and join circle room
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to socket server");
      setSocketConnected(true);
      socket.emit("joinCircle", { circleId: user.circle });
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("locationUpdate", (updatedMember) => {
      // Ensure location fields are normalized (backend may send lat/lng)
      setMembers((prev) => {
        const exists = prev.find((m) => m._id === updatedMember._id);
        if (exists) {
          return prev.map((m) => (m._id === updatedMember._id ? { ...m, ...updatedMember } : m));
        } else {
          return [...prev, updatedMember];
        }
      });

      // Animate camera to updated member (ensure order [lng, lat])
      const lng = updatedMember.location?.lng ?? updatedMember.location?.longitude ?? 73.0479;
      const lat = updatedMember.location?.lat ?? updatedMember.location?.latitude ?? 33.6844;
      moveCamera([lng, lat]);
    });

    return () => {
      mounted = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.emit("leaveCircle", { circleId: user.circle });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user]);

  // Center coords fallback (use first member if present)
  const centerCoords = members.length
    ? [members[0]?.location?.lng ?? members[0]?.location?.longitude ?? 73.0479, members[0]?.location?.lat ?? members[0]?.location?.latitude ?? 33.6844]
    : [73.0479, 33.6844];

  useEffect(() => {
    if (members.length > 0) {
      moveCamera(centerCoords);
    }
  }, [members]);

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
      <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {user?.name || 'Guest'}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.text }]}>
          Circle Map
        </Text>
      </View>
      
      <View style={styles.headerStats}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.text }]}>{members.length}</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Members</Text>
        </View>
        
        <View style={styles.connectionStatus}>
          <View style={[
            styles.connectionDot, 
            { backgroundColor: socketConnected ? '#27ae60' : '#e74c3c' }
          ]} />
          <Text style={[styles.connectionText, { color: colors.text }]}>
            {socketConnected ? 'Live' : 'Offline'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSelectedMemberCard = () => {
    if (!selectedMember) return null;
    
    return (
      <Animated.View 
        style={[
          styles.selectedMemberCard,
          { 
            backgroundColor: colors.cardBg,
            transform: [{
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [100, 0],
              })
            }]
          }
        ]}
      >
        <View style={styles.selectedMemberHeader}>
          <View style={styles.selectedMemberAvatar}>
            <Text style={styles.selectedMemberInitial}>
              {selectedMember.name[0]}
            </Text>
          </View>
          <View style={styles.selectedMemberInfo}>
            <Text style={[styles.selectedMemberName, { color: colors.text }]}>
              {selectedMember.name}
            </Text>
            <Text style={[styles.selectedMemberStatus, { color: colors.text }]}>
              {selectedMember._id === admin?._id ? 'Circle Admin' : 'Member'}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderLoadingState = () => (
    <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color="#008080" />
      <Text style={[styles.loadingText, { color: colors.text }]}>
        Loading circle map...
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <>
        <StatusBar 
          barStyle={currentTheme === "dark" ? "light-content" : "dark-content"} 
          backgroundColor={colors.background} 
        />
        {renderLoadingState()}
      </>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={currentTheme === "dark" ? "light-content" : "dark-content"} 
        backgroundColor="transparent"
        translucent
      />
      
      {renderHeader()}

      <MapViewLib
        ref={mapRef}
        style={styles.map}
        styleURL="https://demotiles.maplibre.org/debug-tiles/style.json"
        localizeLabels={true}
      >
        {members.map((member) => {
          const lng = member.location?.lng ?? member.location?.longitude ?? 73.0479;
          const lat = member.location?.lat ?? member.location?.latitude ?? 33.6844;
          if (MarkerLib) {
            return (
              <MarkerLib key={member._id} coordinate={[lng, lat]}>
                <MapMarker 
                  member={member} 
                  isAdmin={member._id === admin?._id}
                  isSelected={selectedMember?._id === member._id}
                />
              </MarkerLib>
            );
          }
          // fallback: render MapMarker directly if Marker component not available
          return (
            <MapMarker
              key={member._id}
              member={member}
              isAdmin={member._id === admin?._id}
              isSelected={selectedMember?._id === member._id}
            />
          );
        })}
      </MapViewLib>

      {/* Members Circle Scroll */}
      <View style={[styles.membersContainer, { backgroundColor: colors.membersBg }]}>
        <View style={styles.membersHeader}>
          <Text style={[styles.membersTitle, { color: colors.text }]}>Circle Members</Text>
          <TouchableOpacity 
            style={styles.centerButton}
            onPress={() => moveCamera(centerCoords)}
          >
            <Text style={styles.centerButtonText}>📍</Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.membersScrollContainer}
        >
          {members.map((member) => (
            <TouchableOpacity
              key={member._id}
              onPress={() => selectMember(member)}
              activeOpacity={0.7}
            >
              <CircleMember 
                member={member} 
                isAdmin={member._id === admin?._id}
                theme={currentTheme}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {renderSelectedMemberCard()}
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  map: { 
    flex: 1 
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  headerStats: {
    alignItems: 'flex-end',
  },
  statItem: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  membersContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backdropFilter: 'blur(10px)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  membersTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  centerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#008080',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#008080',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  centerButtonText: {
    fontSize: 16,
  },
  membersScrollContainer: {
    paddingHorizontal: 4,
  },
  selectedMemberCard: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedMemberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedMemberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#008080',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedMemberInitial: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  selectedMemberInfo: {
    flex: 1,
  },
  selectedMemberName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  selectedMemberStatus: {
    fontSize: 14,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
});