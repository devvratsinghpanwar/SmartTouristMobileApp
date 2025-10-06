import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://172.22.200.29:4000/api';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  targetLocation: {
    city: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    radius: number;
  };
  createdAt: string;
  expiresAt: string;
  isActive: boolean;
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [digitalId, setDigitalId] = useState<string | null>(null);

  useEffect(() => {
    loadDigitalId();
  }, []);

  useEffect(() => {
    if (digitalId) {
      fetchNotifications();
    }
  }, [digitalId]);

  const loadDigitalId = async () => {
    try {
      const storedDigitalId = await AsyncStorage.getItem('digitalId');
      setDigitalId(storedDigitalId);
    } catch (error) {
      console.error('Error loading digitalId:', error);
      Alert.alert('Error', 'Could not load your tourist ID');
    }
  };

  const fetchNotifications = async () => {
    if (!digitalId) return;

    try {
      console.log('Fetching notifications for:', digitalId);
      const response = await fetch(`${API_URL}/notifications/tourist/${digitalId}`);

      if (response.ok) {
        const result = await response.json();
        const data = result.success ? result.data : [];
        console.log('Received notifications:', data.length);
        setNotifications(data);
      } else {
        console.error('Failed to fetch notifications:', response.status);
        // If endpoint doesn't exist, fall back to empty array
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Don't show error to user, just use empty array
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <View style={styles.notificationItem}>
      <View style={styles.header}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
      </View>
      <Text style={styles.message}>{item.message}</Text>
      {item.targetLocation && (
        <Text style={styles.location}>
          📍 {item.targetLocation.city} ({item.targetLocation.radius}km radius)
        </Text>
      )}
      <View style={styles.footer}>
        <Text style={[styles.type, { backgroundColor: getTypeColor(item.type) }]}>
          {item.type.toUpperCase()}
        </Text>
        {item.expiresAt && (
          <Text style={styles.expires}>
            Expires: {formatDate(item.expiresAt)}
          </Text>
        )}
      </View>
    </View>
  );

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'emergency': return '#ff4444';
      case 'warning': return '#ff8800';
      case 'info': return '#4444ff';
      default: return '#888888';
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  if (!digitalId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Please activate your tourist ID first</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={item => item._id}
      renderItem={renderNotification}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      ListEmptyComponent={
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>Pull down to refresh</Text>
        </View>
      }
      contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
    />
  );
}

const styles = StyleSheet.create({
  notificationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    marginBottom: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  message: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 8,
  },
  location: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  type: {
    fontSize: 10,
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 60,
  },
  expires: {
    fontSize: 11,
    color: '#999',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
  },
});
