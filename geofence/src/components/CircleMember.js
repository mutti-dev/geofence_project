import React from "react";
import { View, Text, StyleSheet } from "react-native";

const CircleMember = ({ member, isAdmin = false, theme = "light" }) => {
  const colors = theme === "dark" 
    ? { 
        text: "#fff", 
        subtext: "#aaa",
        adminBg: "#ff6b6b",
        memberBg: "#008080",
        shadow: "rgba(0, 0, 0, 0.5)"
      } 
    : { 
        text: "#2c3e50", 
        subtext: "#7f8c8d",
        adminBg: "#e74c3c",
        memberBg: "#008080",
        shadow: "rgba(0, 0, 0, 0.15)"
      };

  return (
    <View style={styles.memberContainer}>
      {/* Status Badge */}
      {isAdmin && (
        <View style={[styles.adminBadge, { backgroundColor: colors.adminBg }]}>
          <Text style={styles.adminBadgeText}>👑</Text>
        </View>
      )}
      
      {/* Avatar with enhanced styling */}
      <View style={[
        styles.avatar, 
        { 
          backgroundColor: isAdmin ? colors.adminBg : colors.memberBg,
          shadowColor: isAdmin ? colors.adminBg : colors.memberBg,
        }
      ]}>
        <Text style={styles.initial}>{member.name[0]}</Text>
        
        {/* Online status indicator */}
        <View style={[
          styles.onlineIndicator,
          { backgroundColor: member.isOnline !== false ? '#27ae60' : '#95a5a6' }
        ]} />
      </View>
      
      {/* Member info */}
      <View style={styles.memberInfo}>
        <Text 
          style={[styles.name, { color: colors.text }]} 
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {member.name}
        </Text>
        <Text style={[styles.status, { color: colors.subtext }]}>
          {isAdmin ? "Admin" : "Member"}
        </Text>
        
        {/* Location status */}
        {member.location && (
          <View style={styles.locationStatus}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={[styles.locationText, { color: colors.subtext }]}>
              Active
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default CircleMember;

const styles = StyleSheet.create({
  memberContainer: {
    alignItems: "center",
    marginHorizontal: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    minWidth: 80,
    position: 'relative',
  },
  adminBadge: {
    position: 'absolute',
    top: -4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
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
  adminBadgeText: {
    fontSize: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: 'relative',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  initial: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
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
  memberInfo: {
    alignItems: 'center',
    maxWidth: 80,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  status: {
    fontSize: 11,
    textAlign: "center",
    marginBottom: 4,
    fontWeight: '500',
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39, 174, 96, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  locationIcon: {
    fontSize: 10,
    marginRight: 2,
  },
  locationText: {
    fontSize: 10,
    fontWeight: '500',
  },
});