import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const SettingButton = ({ title, icon, onPress, isActive, colors = {} }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, { backgroundColor: colors.cardColor || '#fff', borderColor: colors.borderColor || '#eee' }] }>
      <View style={styles.left}>
        <MaterialCommunityIcons name={icon} size={20} color={colors.accent || '#FFA500'} />
        <Text style={[styles.title, { color: colors.textColor || '#000' }]}>{title}</Text>
      </View>
      <View style={styles.right}>
        <Text style={{ color: isActive ? (colors.primary || '#008080') : (colors.textSecondary || '#666') }}>{isActive ? 'On' : 'Off'}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default SettingButton;

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 10 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { marginLeft: 8, fontSize: 14, fontWeight: '600' },
  right: {},
});