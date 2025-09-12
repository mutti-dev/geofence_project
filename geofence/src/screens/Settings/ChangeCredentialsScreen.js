import React, { useState, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import API from '../../api';
import { validateEmail, validatePassword } from '../../utils/validation';

const ChangeCredentialsScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handleCurrentPasswordChange = (text) => {
    setCurrentPassword(text);
    setCurrentPasswordError('');
  };

  const handleNewPasswordChange = (text) => {
    setNewPassword(text);
    setNewPasswordError('');
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    setConfirmPasswordError('');
  };

  const handleSave = async () => {
    // Clear previous errors
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');

    // Validation
    if (!currentPassword.trim()) {
      setCurrentPasswordError('Current password is required');
      return;
    }

    if (!newPassword.trim()) {
      setNewPasswordError('New password is required');
      return;
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setNewPasswordError(passwordValidation.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await API.put('/users/profile/password', {
        currentPassword,
        newPassword
      });
      
      if (res.data) {
        Alert.alert('Success', 'Password changed successfully. Please sign in again.', [
          { text: 'OK', onPress: () => logout() }
        ]);
      }
    } catch (err) {
      console.log('Change password error', err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || 'Failed to change password';
      
      if (errorMessage.includes('Current password is incorrect')) {
        setCurrentPasswordError(errorMessage);
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Password</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          
          {/* Current Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Current Password *</Text>
            <TextInput 
              value={currentPassword} 
              onChangeText={handleCurrentPasswordChange} 
              style={[styles.input, currentPasswordError && styles.inputError]}
              secureTextEntry
              placeholder="Enter your current password"
              placeholderTextColor="#999"
            />
            {currentPasswordError ? <Text style={styles.errorText}>{currentPasswordError}</Text> : null}
          </View>

          {/* New Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>New Password *</Text>
            <TextInput 
              value={newPassword} 
              onChangeText={handleNewPasswordChange} 
              style={[styles.input, newPasswordError && styles.inputError]}
              secureTextEntry
              placeholder="Enter new password (min 8 chars, uppercase, lowercase, number, special char)"
              placeholderTextColor="#999"
            />
            {newPasswordError ? <Text style={styles.errorText}>{newPasswordError}</Text> : null}
          </View>

          {/* Confirm Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm New Password *</Text>
            <TextInput 
              value={confirmPassword} 
              onChangeText={handleConfirmPasswordChange} 
              style={[styles.input, confirmPasswordError && styles.inputError]}
              secureTextEntry
              placeholder="Confirm your new password"
              placeholderTextColor="#999"
            />
            {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
          </View>

          {/* Password Requirements */}
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <Text style={styles.requirement}>• At least 8 characters long</Text>
            <Text style={styles.requirement}>• Contains uppercase letter</Text>
            <Text style={styles.requirement}>• Contains lowercase letter</Text>
            <Text style={styles.requirement}>• Contains number</Text>
            <Text style={styles.requirement}>• Contains special character</Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
            onPress={handleSave} 
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Changing Password...' : 'Change Password'}
            </Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ChangeCredentialsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backArrow: {
    fontSize: 20,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 40,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: 4,
  },
  requirementsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requirement: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  saveButton: {
    backgroundColor: '#2d9d91',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#2d9d91',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});