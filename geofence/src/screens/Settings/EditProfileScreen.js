import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import API from '../../api';

const EditProfileScreen = () => {
  const { user, setUser } = useContext(AuthContext);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await API.patch(`/users/${user._id}`, { name });
      if (res.data) {
        // update local user
        const updated = { ...user, name };
        setUser(updated);
        Alert.alert('Success', 'Profile updated');
      }
    } catch (err) {
      console.log('Edit profile error', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Full Name</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />
      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: { flex:1, padding:16, backgroundColor:'#fff' },
  label: { fontSize:14, fontWeight:'600', color:'#333', marginBottom:8 },
  input: { borderWidth:1, borderColor:'#e9ecef', padding:12, borderRadius:8, marginBottom:12 },
  button: { backgroundColor:'#008080', padding:14, borderRadius:8, alignItems:'center' },
  buttonText: { color:'#fff', fontWeight:'600' }
});