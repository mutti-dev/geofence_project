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
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          
          {/* Username Input */}
          <View style={styles.inputGroup}>
            <TextInput 
              placeholder="Username" 
              value={name} 
              onChangeText={setName} 
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <TextInput 
              placeholder="Email" 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address" 
              style={styles.input}
              placeholderTextColor="#999"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <TextInput 
              placeholder="Password" 
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry 
              style={styles.input}
              placeholderTextColor="#999"
            />
          </View>

          {/* Role Selection */}
          <View style={styles.roleContainer}>
            <Text style={styles.roleLabel}>Select Role</Text>
            <View style={styles.roleButtons}>
              <TouchableOpacity 
                onPress={() => setRole("member")} 
                style={styles.roleOption}
              >
                <View style={styles.radioContainer}>
                  <View style={[styles.radioButton, role === "member" && styles.radioButtonSelected]}>
                    {role === "member" && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.roleText}>Member</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => setRole("admin")} 
                style={styles.roleOption}
              >
                <View style={styles.radioContainer}>
                  <View style={[styles.radioButton, role === "admin" && styles.radioButtonSelected]}>
                    {role === "admin" && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.roleText}>Admin</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Conditional Fields */}
          {role === "admin" ? (
            <View style={styles.inputGroup}>
              <TextInput 
                placeholder="Enter Circle Name As Admin" 
                value={circleName} 
                onChangeText={setCircleName} 
                style={styles.input}
                placeholderTextColor="#999"
              />
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <TextInput 
                placeholder="Enter invite code" 
                value={inviteCode} 
                onChangeText={setInviteCode} 
                style={styles.input}
                placeholderTextColor="#999"
                autoCapitalize="characters"
              />
            </View>
          )}

          {/* Register Button */}
          <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
            <Text style={styles.registerButtonText}>Sign Up</Text>
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity 
            style={styles.loginLink} 
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginLinkText}>
              Already have an account? <Text style={styles.loginLinkHighlight}>Login</Text>
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
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#2d9d91',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#333',
  },
  roleContainer: {
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  roleOption: {
    flex: 1,
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#2d9d91',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2d9d91',
  },
  roleText: {
    fontSize: 16,
    color: '#333',
  },
  registerButton: {
    backgroundColor: '#ff7f5c',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 16,
    color: '#666',
  },
  loginLinkHighlight: {
    color: '#2d9d91',
    fontWeight: '600',
  },
});