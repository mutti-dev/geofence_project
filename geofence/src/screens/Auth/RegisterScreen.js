import React, { useState, useContext } from "react";
import { 
  View, 
  TextInput, 
  Text, 
  Alert, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar
} from "react-native";
import { AuthContext } from "../../contexts/AuthContext";

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member"); // 'admin' or 'member'
  const [circleName, setCircleName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    console.log("Button pressed with:", { name, email, password, role, circleName, inviteCode });
    
    // Validation
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }
    
    if (role === "admin" && !circleName.trim()) {
      Alert.alert("Error", "Please enter a circle name");
      return;
    }
    
    if (role === "member" && !inviteCode.trim()) {
      Alert.alert("Error", "Please enter an invite code");
      return;
    }

    // Build payload with role and relevant circle info
    const payload = { name, email, password, role };
    if (role === "admin") payload.circleName = circleName;
    if (role === "member") payload.inviteCode = inviteCode;

    try {
      const res = await register(payload);
      console.log("Register response:", res);

      // consider success when backend returned a user or token
      if (res && (res.user || res.token || res._id)) {
        Alert.alert("Success", "Registered successfully!");
        navigation.navigate("Login");
      } else {
        // try to show backend message
        const msg = res?.message || res?.error || 'Registration failed';
        Alert.alert("Register Failed", msg);
      }
    } catch (err) {
      console.log('Register error', err.response?.data || err.message || err);
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      Alert.alert('Register Failed', msg);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor="#008080" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join your circle today</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          
          {/* Basic Info */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput 
              placeholder="Enter your full name" 
              value={name} 
              onChangeText={setName} 
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput 
              placeholder="Enter your email" 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address" 
              style={styles.input}
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput 
              placeholder="Create a strong password" 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry 
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          {/* Role Selection */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>Choose your role</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity 
                onPress={() => setRole("admin")} 
                style={[styles.roleButton, role === "admin" && styles.roleButtonActive]}
              >
                <Text style={[styles.roleButtonText, role === "admin" && styles.roleButtonTextActive]}>
                  Admin
                </Text>
                <Text style={[styles.roleButtonSubtext, role === "admin" && styles.roleButtonSubtextActive]}>
                  Create a new circle
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setRole("member")} 
                style={[styles.roleButton, role === "member" && styles.roleButtonActive]}
              >
                <Text style={[styles.roleButtonText, role === "member" && styles.roleButtonTextActive]}>
                  Member
                </Text>
                <Text style={[styles.roleButtonSubtext, role === "member" && styles.roleButtonSubtextActive]}>
                  Join existing circle
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Conditional Fields */}
          {role === "admin" ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Circle Name</Text>
              <TextInput 
                placeholder="Enter your circle name" 
                value={circleName} 
                onChangeText={setCircleName} 
                style={styles.input}
                placeholderTextColor="#999"
              />
              <Text style={styles.inputHint}>This will be the name of your new circle</Text>
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Invite Code</Text>
              <TextInput 
                placeholder="Enter invite code" 
                value={inviteCode} 
                onChangeText={setInviteCode} 
                style={styles.input}
                placeholderTextColor="#999"
                autoCapitalize="characters"
              />
              <Text style={styles.inputHint}>Get this code from your circle admin</Text>
            </View>
          )}

          {/* Register Button */}
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Create Account</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity 
            style={styles.loginLink} 
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkHighlight}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
    color: '#2c3e50',
  },
  inputHint: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  roleContainer: {
    marginBottom: 24,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  roleButtonActive: {
    borderColor: '#008080',
    backgroundColor: '#e6f7f7',
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 4,
  },
  roleButtonTextActive: {
    color: '#008080',
  },
  roleButtonSubtext: {
    fontSize: 12,
    color: '#adb5bd',
    textAlign: 'center',
  },
  roleButtonSubtextActive: {
    color: '#006666',
  },
  registerButton: {
    backgroundColor: '#008080',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#008080',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 16,
    color: '#6c757d',
  },
  loginLinkHighlight: {
    color: '#008080',
    fontWeight: '600',
  },
});