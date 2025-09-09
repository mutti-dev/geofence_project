import React from "react";
import { View, Text, StyleSheet } from "react-native";

const MapMarker = ({ member, isAdmin = false, isSelected = false }) => {
  const markerColor = isAdmin ? '#e74c3c' : '#008080';
  const pulseColor = isSelected ? '#f39c12' : markerColor;

  return (
    <View style={styles.markerContainer}>
      {/* Pulse animation ring for selected marker */}
      {isSelected && (
        <View style={[
          styles.pulseRing,
          { 
            borderColor: pulseColor,
            backgroundColor: `${pulseColor}20`
          }
        ]} />
      )}
      
      {/* Main marker */}
      <View style={[
        styles.marker,
        { 
          backgroundColor: markerColor,
          borderColor: isSelected ? '#f39c12' : '#fff',
          borderWidth: isSelected ? 3 : 2,
        }
      ]}>
        {/* Admin crown */}
        {isAdmin && (
          <View style={styles.crownContainer}>
            <Text style={styles.crown}>👑</Text>
          </View>
        )}
        
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.initial}>{member.name[0]}</Text>
        </View>
        
        {/* Online status */}
        <View style={[
          styles.statusDot,
          { backgroundColor: member.isOnline !== false ? '#27ae60' : '#95a5a6' }
        ]} />
      </View>
      
      {/* Marker pointer */}
      <View style={[styles.pointer, { borderTopColor: markerColor }]} />
      
      {/* Name label */}
      <View style={[
        styles.nameLabel,
        { 
          backgroundColor: markerColor,
          borderColor: isSelected ? '#f39c12' : markerColor,
        }
      ]}>
        <Text style={styles.nameText} numberOfLines={1}>
          {member.name}
        </Text>
        
        {/* Location accuracy indicator */}
        <View style={styles.accuracyIndicator}>
          <Text style={styles.accuracyText}>📍</Text>
        </View>
      </View>
      
      {/* Shadow for depth */}
      <View style={[
        styles.shadow,
        { backgroundColor: `${markerColor}40` }
      ]} />
    </View>
  );
};

export default MapMarker;

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    top: -10,
    opacity: 0.6,
  },
  marker: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  crownContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  crown: {
    fontSize: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initial: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  nameLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 120,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  nameText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  accuracyIndicator: {
    marginLeft: 4,
  },
  accuracyText: {
    fontSize: 10,
  },
  shadow: {
    position: 'absolute',
    bottom: -25,
    width: 40,
    height: 8,
    borderRadius: 20,
    opacity: 0.3,
  },
});