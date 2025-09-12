import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import API from "../../api";
import { ThemeContext } from "../../contexts/ThemeContext";
import { AuthContext } from "../../contexts/AuthContext";
import * as Clipboard from "expo-clipboard";
import { MaterialIcons } from "@expo/vector-icons";

const AddPersonScreen = () => {
  const { currentTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);
  console.log("user", user);  

  const [generatedCode, setGeneratedCode] = useState("");
  const [members, setMembers] = useState([]);

  const [joinCode, setJoinCode] = useState("");
  const [invite, setInvite] = useState(null);
  console.log("invite", invite);
  const [expiresAt, setExpiresAt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const token = user?.token || "";
  if (!token) {
    setIsLoading(false);
    setIsRefreshing(false);
    Alert.alert("Error", "You are not logged in");
    return;
  }

  const colors =
    currentTheme === "dark"
      ? {
          background: "#121212",
          text: "#fff",
          card: "#1e1e1e",
          cardBg: "#2c2c2c",
          button1: "#008080",
          button2: "#e74c3c",
          inputBorder: "#404040",
          inputBg: "#2c2c2c",
          headerBg: "rgba(30, 30, 30, 0.95)",
          shadow: "rgba(0, 0, 0, 0.5)",
          accent: "#34495e",
          success: "#27ae60",
          warning: "#f39c12",
        }
      : {
          background: "#f8f9fa",
          text: "#2c3e50",
          card: "#ffffff",
          cardBg: "#ffffff",
          button1: "#008080",
          button2: "#e74c3c",
          inputBorder: "#e9ecef",
          inputBg: "#f8f9fa",
          headerBg: "rgba(255, 255, 255, 0.95)",
          shadow: "rgba(0, 0, 0, 0.1)",
          accent: "#ecf0f1",
          success: "#27ae60",
          warning: "#f39c12",
        };

  // Fetch members
  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const token = user?.token || (await AsyncStorage.getItem("token"));
      if (!token) return Alert.alert("Error", "Not authenticated");

      const { data } = await API.get("/circles/all", {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("Fetched members:", data);
      setMembers(data || []);
    } catch (err) {
      console.log("fetchMembers error", err?.response?.data || err.message);
      Alert.alert("Error", "Unable to load members");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const onRefresh = () => {
    fetchMembers(true);
  };

  // Request invite code
  const handleGenerate = async () => {
    try {
      setIsGenerating(true);

      const { data } = await API.post(
        `/circles/${user.circle}/generate-invite`, // URL
        {}, // body payload (empty object if no body)
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const code = data.invite.code;
      const expiresAt = data.invite.expiresAt;
      setInvite(code);
      setExpiresAt(expiresAt);
      Alert.alert("Success", `Invite code generated: ${code}`);
    } catch (err) {
      console.log(err.response?.data || err.message);
      Alert.alert("Error", "Unable to generate invite");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(invite);
    Alert.alert("Copied", "Invite code copied to clipboard!");
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>
        Circle Management
      </Text>
      <Text style={[styles.headerSubtitle, { color: colors.text }]}>
        Manage your family circle
      </Text>
    </View>
  );

  const renderMemberItem = ({ item, index }) => (
    <View
      style={[
        styles.memberCard,
        {
          backgroundColor: colors.cardBg,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={styles.memberHeader}>
        <View
          style={[
            styles.memberAvatar,
            {
              backgroundColor:
                item.role === "admin" ? colors.warning : colors.button1,
            },
          ]}
        >
          <Text style={styles.memberInitial}>{item.name[0]}</Text>
        </View>

        <View style={styles.memberInfo}>
          <Text style={[styles.memberName, { color: colors.text }]}>
            {item.name}
          </Text>
          <View style={styles.roleContainer}>
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor:
                    item.role === "admin" ? colors.warning : colors.success,
                },
              ]}
            >
              <Text style={styles.roleText}>
                {item.role === "admin" ? "👑 Admin" : "👤 Member"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.memberStats}>
        <Text style={[styles.memberDetail, { color: colors.text }]}>
          Joined: {new Date().toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No Members Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.text }]}>
        Generate an invite code to add family members to your circle
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={currentTheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {renderHeader()}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[colors.button1]}
            tintColor={colors.button1}
          />
        }
      >
        {/* COMMENTED STYLED CODE - Generate Code Section */}
        {/* <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🔐 Generate Invite Code
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>
              Create a secure code for new members
            </Text>
          </View>
          
          <TouchableOpacity
            style={[
              styles.primaryButton, 
              { backgroundColor: colors.button1 },
              isGenerating && styles.buttonDisabled
            ]}
            onPress={handleGenerateCode}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Generate New Code</Text>
            )}
          </TouchableOpacity>
          
          {generatedCode ? (
            <View style={[styles.codeContainer, { backgroundColor: colors.accent }]}>
              <Text style={[styles.codeLabel, { color: colors.text }]}>
                Generated Code:
              </Text>
              <Text style={[styles.codeText, { color: colors.button1 }]}>
                {generatedCode}
              </Text>
              <Text style={[styles.codeHint, { color: colors.text }]}>
                Share this code with the person you want to add
              </Text>
            </View>
          ) : null}
        </View> */}

        {/* COMMENTED STYLED CODE - Join Member Section */}
        {/* <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              ➕ Add New Member
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>
              Enter the invite code to join a member
            </Text>
          </View>
          
          <View style={styles.inputContainer}>
            <TextInput
              placeholder="Enter invite code..."
              placeholderTextColor={colors.text + "60"}
              style={[
                styles.input,
                { 
                  color: colors.text, 
                  borderColor: colors.inputBorder,
                  backgroundColor: colors.inputBg 
                },
              ]}
              value={joinCode}
              onChangeText={setJoinCode}
              autoCapitalize="characters"
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.primaryButton, 
              { backgroundColor: colors.button2 },
              (!joinCode.trim() || isLoading) && styles.buttonDisabled
            ]}
            onPress={handleJoinMember}
            disabled={!joinCode.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Add Member</Text>
            )}
          </TouchableOpacity>
        </View> */}

        {/* Member List Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              👨‍👩‍👧‍👦 Family Members
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>
              {members.length} {members.length === 1 ? "member" : "members"} in
              your circle
            </Text>
          </View>

          {isLoading && !isRefreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.button1} />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Loading members...
              </Text>
            </View>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(item) => item._id}
              renderItem={renderMemberItem}
              ListEmptyComponent={renderEmptyState}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </View>

        {/* Circle Invite Code Section */}
        <View style={[styles.section, { backgroundColor: colors.cardBg }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              🎯 Circle Invite Code
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>
              Generate a new invite code for your circle
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: colors.success },
              isGenerating && styles.buttonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Generate Circle Invite</Text>
            )}
          </TouchableOpacity>

          {invite && (
            <View
              style={[
                styles.inviteContainer,
                { backgroundColor: colors.accent },
              ]}
            >
              <View style={styles.inviteHeader}>
                <Text style={[styles.inviteLabel, { color: colors.text }]}>
                  Active Invite Code
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: 8,
                }}
              >
                <Text
                  style={[
                    styles.inviteCode,
                    { color: colors.success, flex: 1 },
                  ]}
                >
                  {invite}
                </Text>

                <TouchableOpacity
                  onPress={handleCopyCode}
                  style={{ marginLeft: 8 }}
                >
                  <MaterialIcons
                    name="content-copy"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>

              <Text style={[styles.inviteExpiry, { color: colors.text }]}>
                Expires: {new Date(expiresAt).toLocaleString()}
              </Text>
              <Text style={[styles.inviteHint, { color: colors.text }]}>
                Share this code with people you want to invite to your circle
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default AddPersonScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 12,
    padding: 20,
    borderRadius: 16,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  primaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  codeContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  codeLabel: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
  },
  codeText: {
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 8,
  },
  codeHint: {
    fontSize: 12,
    textAlign: "center",
    opacity: 0.8,
  },
  memberCard: {
    padding: 16,
    borderRadius: 12,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  memberInitial: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: "row",
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  memberStats: {
    marginTop: 8,
  },
  memberDetail: {
    fontSize: 12,
    opacity: 0.8,
  },
  separator: {
    height: 12,
  },
  listContainer: {
    paddingTop: 8,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: "center",
    lineHeight: 20,
  },
  inviteContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  inviteHeader: {
    marginBottom: 8,
  },
  inviteLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  inviteCode: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 8,
  },
  inviteExpiry: {
    fontSize: 12,
    marginBottom: 8,
    opacity: 0.8,
  },
  inviteHint: {
    fontSize: 12,
    opacity: 0.8,
    textAlign: "center",
  },
  logoutButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
