import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

const notifications = [
    { id: '1', title: 'Weather Advisory', message: 'Heavy rainfall expected in the northern hills today.'},
    { id: '2', title: 'Zone Alert', message: 'A local festival may cause traffic delays in the city center.'},
];

export default function NotificationsScreen() {
  return (
    <FlatList
      data={notifications}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.notificationItem}>
          <Text style={styles.title}>{item.title}</Text>
          <Text>{item.message}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  notificationItem: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  title: { fontWeight: 'bold', marginBottom: 5 },
});
