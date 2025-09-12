import React, { useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  StatusBar,
  Image
} from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

const ProfileScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.profileHeader}>
            <Text style={styles.profileTitle}>Profile</Text>
          </View>
          
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
          
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              {user?.profilePicture?.url ? (
                <Image 
                  source={{ uri: user.profilePicture.url }} 
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitial}>{user?.name?.[0]?.toUpperCase() || 'U'}</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User Name'}</Text>
            <Text style={styles.userRole}>{user?.role || 'Member'}</Text>
          </View>
        </View>

        {/* Profile Details */}
        <View style={styles.detailsSection}>
          
          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Full Name</Text>
            <View style={styles.fieldContainer}>
              <View style={styles.fieldIcon}>
                <Text style={styles.iconText}>👤</Text>
              </View>
              <Text style={styles.fieldValue}>{user?.name || 'Hamad Hussain'}</Text>
            </View>
          </View>

          {/* Email Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email Address</Text>
            <View style={styles.fieldContainer}>
              <View style={styles.fieldIcon}>
                <Text style={styles.iconText}>✉️</Text>
              </View>
              <Text style={styles.fieldValue}>{user?.email || 'user@gmail.com'}</Text>
            </View>
          </View>

          {/* Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Address</Text>
            <View style={styles.fieldContainer}>
              <View style={styles.fieldIcon}>
                <Text style={styles.iconText}>📍</Text>
              </View>
              <Text style={styles.fieldValue}>
                {user?.address?.fullAddress || 
                 (user?.address?.street && user?.address?.city ? 
                  `${user.address.street}, ${user.address.city}, ${user.address.state} ${user.address.country} ${user.address.postalCode}`.trim() : 
                  'Add your address')}
              </Text>
            </View>
          </View>

          {/* Circle/Family Info */}
          {user?.circle && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Circle Name</Text>
              <View style={styles.fieldContainer}>
                <View style={styles.fieldIcon}>
                  <Text style={styles.iconText}>👥</Text>
                </View>
                <Text style={styles.fieldValue}>{user.circle}</Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate('EditProfile')}
            >
              <Text style={styles.actionButtonText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={() => navigation.navigate('ChangeCredentials')}
            >
              <Text style={styles.actionButtonText}>Change Password</Text>
            </TouchableOpacity>

            {user?.role === 'admin' && (
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => navigation.navigate('ManageFamilyScreen')}
              >
                <Text style={styles.actionButtonText}>Manage Family Members</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuButton: {
    padding: 5,
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: '#333',
    marginVertical: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ff7f5c',
  },
  headerSpacer: {
    width: 30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  backArrow: {
    fontSize: 20,
    color: '#666',
  },
  profileHeader: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  editIcon: {
    fontSize: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#ff7f5c',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2d9d91',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#2d9d91',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '700',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: '#2d9d91',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  detailsSection: {
    marginBottom: 30,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  fieldValue: {
    fontSize: 16,
    color: '#666',
    flex: 1,
  },
  actionButtons: {
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: '#2d9d91',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#2d9d91',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});