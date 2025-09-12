import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { AuthContext } from "../../contexts/AuthContext";
import API from "../../api";
import * as ImagePicker from "expo-image-picker";
import { validateName } from "../../utils/validation";

const EditProfileScreen = ({ navigation }) => {
  const { user, setUser, logout } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || "");
  const [address, setAddress] = useState({
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    country: user?.address?.country || "",
    postalCode: user?.address?.postalCode || "",
    fullAddress: user?.address?.fullAddress || "",
  });
  const [profilePicture, setProfilePicture] = useState(
    user?.profilePicture?.url || ""
  );
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    // Request permission for image picker
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Sorry, we need camera roll permissions to upload profile pictures."
        );
      }
    })();
  }, []);

  const handleImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfilePicture(imageUri);
      }
    } catch (error) {
      console.log("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const handleNameChange = (text) => {
    setName(text);
    setNameError("");
  };

  const handleAddressChange = (field, value) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogout = () => {
    logout();
    navigation.navigate("Login");
  };

  const handleSave = async () => {
    // Clear previous errors
    setNameError("");

    // Validate name
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      setNameError(nameValidation.message);
      return;
    }

    try {
      setLoading(true);

      // Update profile data
      const profileData = {
        name,
        address: {
          ...address,
          fullAddress:
            `${address.street}, ${address.city}, ${address.state}, ${address.country} ${address.postalCode}`.trim(),
        },
      };

      const res = await API.put("/users/profile", profileData);

      if (res.data) {
        // Update profile picture if changed
        if (profilePicture && profilePicture !== user?.profilePicture?.url) {
          await API.put("/users/profile/picture", {
            profilePicture: {
              url: profilePicture,
              publicId: `profile_${user._id}_${Date.now()}`,
            },
          });
        }

        // Update local user state
        const updated = {
          ...user,
          name: res.data.user.name,
          address: res.data.user.address,
          profilePicture: res.data.user.profilePicture,
        };
        setUser(updated);

        Alert.alert("Success", "Profile updated successfully", [
          { text: "OK", onPress: () => handleLogout() },
        ]);
      }
    } catch (err) {
      console.log("Edit profile error", err.response?.data || err.message);
      Alert.alert("Error", "Failed to update profile");
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

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Profile Picture Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.profilePictureContainer}>
            <TouchableOpacity
              style={styles.profilePictureWrapper}
              onPress={handleImagePicker}
            >
              {profilePicture ? (
                <Image
                  source={{ uri: profilePicture }}
                  style={styles.profilePicture}
                />
              ) : (
                <View style={styles.profilePicturePlaceholder}>
                  <Text style={styles.profilePictureText}>
                    {name[0]?.toUpperCase() || "U"}
                  </Text>
                </View>
              )}
              <View style={styles.cameraIcon}>
                <Text style={styles.cameraIconText}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.profilePictureHint}>Tap to change photo</Text>
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          {/* Name Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              value={name}
              onChangeText={handleNameChange}
              style={[styles.input, nameError && styles.inputError]}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
            />
            {nameError ? (
              <Text style={styles.errorText}>{nameError}</Text>
            ) : null}
          </View>
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Information</Text>

          {/* Street Address */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Street Address</Text>
            <TextInput
              value={address.street}
              onChangeText={(text) => handleAddressChange("street", text)}
              style={styles.input}
              placeholder="Enter street address"
              placeholderTextColor="#999"
            />
          </View>

          {/* City and State Row */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                value={address.city}
                onChangeText={(text) => handleAddressChange("city", text)}
                style={styles.input}
                placeholder="City"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>State</Text>
              <TextInput
                value={address.state}
                onChangeText={(text) => handleAddressChange("state", text)}
                style={styles.input}
                placeholder="State"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          {/* Country and Postal Code Row */}
          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                value={address.country}
                onChangeText={(text) => handleAddressChange("country", text)}
                style={styles.input}
                placeholder="Country"
                placeholderTextColor="#999"
              />
            </View>
            <View style={[styles.fieldGroup, styles.halfWidth]}>
              <Text style={styles.label}>Postal Code</Text>
              <TextInput
                value={address.postalCode}
                onChangeText={(text) => handleAddressChange("postalCode", text)}
                style={styles.input}
                placeholder="Postal Code"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? "Saving..." : "Save Changes"}
          </Text>
        </TouchableOpacity>

        {/* Change Password Button */}
        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => navigation.navigate("ChangeCredentials")}
        >
          <Text style={styles.changePasswordButtonText}>Change Password</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backArrow: {
    fontSize: 20,
    color: "#333",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  headerSpacer: {
    width: 40,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  profilePictureContainer: {
    alignItems: "center",
  },
  profilePictureWrapper: {
    position: "relative",
    marginBottom: 8,
  },
  profilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#2d9d91",
  },
  profilePicturePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#2d9d91",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#2d9d91",
  },
  profilePictureText: {
    color: "#ffffff",
    fontSize: 36,
    fontWeight: "700",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2d9d91",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  cameraIconText: {
    fontSize: 14,
  },
  profilePictureHint: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#ffffff",
  },
  inputError: {
    borderColor: "#ff4444",
    borderWidth: 2,
  },
  errorText: {
    color: "#ff4444",
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfWidth: {
    width: "48%",
  },
  saveButton: {
    backgroundColor: "#2d9d91",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#2d9d91",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  changePasswordButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#2d9d91",
  },
  changePasswordButtonText: {
    color: "#2d9d91",
    fontSize: 16,
    fontWeight: "600",
  },
});
