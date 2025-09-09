import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import API from '../../api';

const ChangeCredentialsScreen = () => {
  const { user, logout } = useContext(AuthContext);
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!email.trim()) return Alert.alert('Error', 'Email is required');
    try {
      setLoading(true);
      const payload = { email };
      if (password.trim()) payload.password = password;
      const res = await API.patch(`/users/${user._id}`, payload);
      if (res.data) {
        Alert.alert('Success', 'Credentials updated. Please sign in again.');
        await logout();
      }
    } catch (err) {
      console.log('Change credentials error', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to update credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Email</Text>
      <TextInput value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
      <Text style={styles.hint}>Leave password empty to keep current password</Text>
      <Text style={styles.label}>New Password</Text>
      <TextInput value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Update Credentials'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChangeCredentialsScreen;

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:'#fff' },
  label: { fontSize:14, fontWeight:'600', color:'#333', marginBottom:8 },
  input: { borderWidth:1, borderColor:'#e9ecef', padding:12, borderRadius:8, marginBottom:12 },
  button: { backgroundColor:'#008080', padding:14, borderRadius:8, alignItems:'center' },
  buttonText: { color:'#fff', fontWeight:'600' },
  hint: { marginBottom:8, color:'#666' }
});