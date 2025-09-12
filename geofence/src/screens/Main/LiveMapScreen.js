import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthContext } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import API from '../../api';

export default function LiveMapScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const { socket } = useSocket();
  const [location, setLocation] = useState(null);
  const [geofences, setGeofences] = useState([]);
  const [members, setMembers] = useState([]);
  const [circleName, setCircleName] = useState('Live Map');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationTracking, setLocationTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const mapRef = useRef(null);
  const locationWatcher = useRef(null);
  const isFocused = useIsFocused();

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await API.get('/geofences/admin');
      const { circleName: cName, geofences: fetchedGeofences, members: fetchedMembers } = response.data;
      
      setCircleName(cName || 'Live Map');
      setGeofences(fetchedGeofences || []);
      setMembers(fetchedMembers || []);
    } catch (err) {
      console.log('Fetch data error', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  // Get current location
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for member location updates
    socket.on('memberLocationUpdate', (memberData) => {
      setMembers(prev => {
        const index = prev.findIndex(m => m._id === memberData._id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...memberData };
          return updated;
        } else {
          return [...prev, memberData];
        }
      });
      setLastUpdate(new Date());
    });

    // Listen for geofence notifications
    socket.on('geofenceNotification', (data) => {
      Alert.alert(
        'Geofence Alert',
        `${data.memberName} has ${data.type === 'entry' ? 'entered' : 'exited'} ${data.geofenceName}`,
        [{ text: 'OK' }]
      );
    });

    // Listen for admin geofence alerts
    socket.on('adminGeofenceAlert', (data) => {
      Alert.alert(
        'Zone Alert',
        `${data.memberName} has ${data.type === 'entry' ? 'entered' : 'exited'} ${data.geofenceName}`,
        [{ text: 'OK' }]
      );
    });

    return () => {
      socket.off('memberLocationUpdate');
      socket.off('geofenceNotification');
      socket.off('adminGeofenceAlert');
    };
  }, [socket]);

  // Start/stop location tracking
  const toggleLocationTracking = async () => {
    if (locationTracking) {
      stopLocationTracking();
    } else {
      startLocationTracking();
    }
  };

  const startLocationTracking = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      setLocationTracking(true);
      locationWatcher.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 50, // Update every 50 meters
        },
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Update local location
          setLocation({ coords: { latitude, longitude } });
          
          // Send to server via socket
          if (socket && user) {
            socket.emit('updateLocation', {
              userId: user._id,
              location: { lat: latitude, lng: longitude }
            });
          }
        }
      );
    } catch (error) {
      console.log('Location tracking error:', error);
      Alert.alert('Error', 'Failed to start location tracking');
      setLocationTracking(false);
    }
  };

  const stopLocationTracking = () => {
    if (locationWatcher.current) {
      locationWatcher.current.remove();
      locationWatcher.current = null;
    }
    setLocationTracking(false);
  };

  // Center map on user
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

  // Center map on member
  const centerMapOnMember = (member) => {
    if (mapRef.current && member.location) {
      mapRef.current.animateToRegion({
        latitude: member.location.lat,
        longitude: member.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  // Get zone colors
  const getZoneColor = (zoneType, active) => {
    if (!active) return 'rgba(128, 128, 128, 0.3)';
    switch (zoneType) {
      case 'safe': return 'rgba(76, 175, 80, 0.3)';
      case 'restricted': return 'rgba(244, 67, 54, 0.3)';
      case 'custom': return 'rgba(33, 150, 243, 0.3)';
      default: return 'rgba(76, 175, 80, 0.3)';
    }
  };

  const getZoneBorderColor = (zoneType, active) => {
    if (!active) return '#808080';
    switch (zoneType) {
      case 'safe': return '#4CAF50';
      case 'restricted': return '#F44336';
      case 'custom': return '#2196F3';
      default: return '#4CAF50';
    }
  };

  // Get member marker color
  const getMemberMarkerColor = (member) => {
    if (member.role === 'admin') return 'blue';
    if (member._id === user?._id) return 'green';
    return 'orange';
  };

  // Format last update time
  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - lastUpdate) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6A1B9A" />
      
      {/* Header */}
      <LinearGradient colors={['#6A1B9A', '#8E24AA']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{circleName}</Text>
          <Text style={styles.headerSubtitle}>
            {members.length} members • Last update: {formatLastUpdate()}
          </Text>
        </View>
        <TouchableOpacity onPress={centerMapOnUser} style={styles.userBtn}>
          <Text style={styles.userBtnText}>📍</Text>
        </TouchableOpacity>
      </LinearGradient>

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
        >
          {/* Member locations */}
          {members.map((member) => (
            <Marker
              key={member._id}
              coordinate={{
                latitude: member.location?.lat || 0,
                longitude: member.location?.lng || 0,
              }}
              title={member.name}
              description={`${member.role} • ${member.location ? 'Online' : 'Offline'}`}
              pinColor={getMemberMarkerColor(member)}
              onPress={() => {
                setSelectedMember(member);
                setShowMemberDetails(true);
              }}
            />
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
              strokeColor={getZoneBorderColor(geofence.zoneType, geofence.active)}
              strokeWidth={2}
            />
          ))}
        </MapView>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, locationTracking && styles.activeControlButton]}
          onPress={toggleLocationTracking}
        >
          <Text style={styles.controlButtonText}>
            {locationTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={fetchData}
        >
          <Text style={styles.controlButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Member Details Modal */}
      <Modal
        visible={showMemberDetails}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMemberDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Member Details</Text>
            
            {selectedMember && (
              <>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{selectedMember.name}</Text>
                  <Text style={styles.memberRole}>{selectedMember.role}</Text>
                  <Text style={styles.memberEmail}>{selectedMember.email}</Text>
                </View>
                
                <View style={styles.locationInfo}>
                  <Text style={styles.locationTitle}>Location</Text>
                  {selectedMember.location ? (
                    <>
                      <Text style={styles.locationText}>
                        Lat: {selectedMember.location.lat.toFixed(6)}
                      </Text>
                      <Text style={styles.locationText}>
                        Lng: {selectedMember.location.lng.toFixed(6)}
                      </Text>
                      <Text style={styles.locationStatus}>Online</Text>
                    </>
                  ) : (
                    <Text style={styles.locationStatus}>Offline</Text>
                  )}
                </View>
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowMemberDetails(false)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                  
                  {selectedMember.location && (
                    <TouchableOpacity
                      style={styles.centerButton}
                      onPress={() => {
                        centerMapOnMember(selectedMember);
                        setShowMemberDetails(false);
                      }}
                    >
                      <Text style={styles.centerButtonText}>Center on Map</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  userBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userBtnText: {
    fontSize: 20,
  },
  mapContainer: {
    flex: 1,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#fff',
  },
  controlButton: {
    backgroundColor: '#6A1B9A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  activeControlButton: {
    backgroundColor: '#F44336',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  memberInfo: {
    marginBottom: 20,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  locationInfo: {
    marginBottom: 20,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  centerButton: {
    flex: 1,
    backgroundColor: '#6A1B9A',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  centerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
