import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import API from '../../api';

const ManageFamilyScreen = () => {
  const { user } = useContext(AuthContext);
  const [members, setMembers] = useState([]);
  const [invite, setInvite] = useState(null);

  const loadMembers = async () => {
    try {
      const res = await API.get(`/circles/${user.circle}`);
      setMembers(res.data.members || []);
    } catch (err) {
      console.log('Load members error', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to load members');
    }
  };

  useEffect(() => { if (user && user.circle) loadMembers(); }, [user]);

  const handleGenerateInvite = async () => {
    try {
      const res = await API.post(`/circles/${user.circle}/generate-invite`);
      setInvite(res.data.invite);
      Alert.alert('Invite', `Code: ${res.data.invite.code}`);
    } catch (err) {
      console.log('Generate invite error', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to generate invite');
    }
  };

  const handleRemove = async (memberId) => {
    try {
      await API.delete(`/circles/${user.circle}/members/${memberId}`);
      setMembers(members.filter(m => m._id !== memberId));
    } catch (err) {
      console.log('Remove member error', err.response?.data || err.message);
      Alert.alert('Error', 'Failed to remove member');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Family</Text>
        <TouchableOpacity style={styles.generate} onPress={handleGenerateInvite}><Text style={styles.generateText}>Generate Invite</Text></TouchableOpacity>
      </View>
      <FlatList data={members} keyExtractor={i => i._id} renderItem={({item}) => (
        <View style={styles.item}>
          <Text style={styles.name}>{item.name} {item.role === 'admin' ? '(Admin)' : ''}</Text>
          {user._id === item._id ? null : (
            <TouchableOpacity onPress={() => handleRemove(item._id)} style={styles.remove}><Text style={styles.removeText}>Remove</Text></TouchableOpacity>
          )}
        </View>
      )} ListEmptyComponent={() => <Text style={{padding:20}}>No members</Text>} />
    </View>
  );
};

export default ManageFamilyScreen;

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff' },
  header: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16 },
  title: { fontSize:18, fontWeight:'700' },
  generate: { backgroundColor:'#008080', padding:10, borderRadius:8 },
  generateText: { color:'#fff' },
  item: { padding:16, borderBottomWidth:1, borderBottomColor:'#eee', flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  name: { fontSize:16 },
  remove: { padding:8, backgroundColor:'#ff7f50', borderRadius:6 },
  removeText: { color:'#fff' }
});