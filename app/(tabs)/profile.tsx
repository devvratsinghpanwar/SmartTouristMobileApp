import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://172.22.200.29:4000/api/tourists';

interface Tourist {
  digitalId: string;
  kyc: {
    name: string;
    nationality: string;
    passportNumber: string;
    phoneNumber: string;
    emergencyContact: string;
  };
  itinerary: {
    startDate: string;
    endDate: string;
    destinations: string[];
    accommodations: string[];
    activities: string[];
  };
  safetyStatus: string;
  lastLocationUpdate: string;
}

export default function ProfileScreen() {
  const [tourist, setTourist] = useState<Tourist | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingItinerary, setEditingItinerary] = useState(false);
  const [itineraryForm, setItineraryForm] = useState({
    startDate: '',
    endDate: '',
    destinations: '',
    accommodations: '',
    activities: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const digitalId = await AsyncStorage.getItem('digitalId');
      if (!digitalId) {
        Alert.alert('Error', 'Tourist ID not found. Please restart the app.');
        return;
      }

      const response = await fetch(`${API_URL}/${digitalId}/profile`);
      const data = await response.json();

      if (response.ok && data.success) {
        setTourist(data.tourist);
        // Initialize form with current itinerary
        if (data.tourist.itinerary) {
          setItineraryForm({
            startDate: data.tourist.itinerary.startDate || '',
            endDate: data.tourist.itinerary.endDate || '',
            destinations: data.tourist.itinerary.destinations?.join(', ') || '',
            accommodations: data.tourist.itinerary.accommodations?.join(', ') || '',
            activities: data.tourist.itinerary.activities?.join(', ') || '',
          });
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to fetch profile. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  const handleUpdateItinerary = async () => {
    try {
      const digitalId = await AsyncStorage.getItem('digitalId');
      if (!digitalId) return;

      const updatedItinerary = {
        startDate: itineraryForm.startDate,
        endDate: itineraryForm.endDate,
        destinations: itineraryForm.destinations.split(',').map(d => d.trim()).filter(d => d),
        accommodations: itineraryForm.accommodations.split(',').map(a => a.trim()).filter(a => a),
        activities: itineraryForm.activities.split(',').map(a => a.trim()).filter(a => a),
      };

      const response = await fetch(`${API_URL}/${digitalId}/itinerary`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itinerary: updatedItinerary }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Success', 'Itinerary updated successfully!');
        setEditingItinerary(false);
        fetchProfile(); // Refresh profile data
      } else {
        Alert.alert('Error', data.message || 'Failed to update itinerary');
      }
    } catch (error) {
      console.error('Error updating itinerary:', error);
      Alert.alert('Error', 'Failed to update itinerary. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'safe': return '#4CAF50';
      case 'danger': return '#F44336';
      case 'alert': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'safe': return 'shield-checkmark';
      case 'danger': return 'warning';
      case 'alert': return 'alert-circle';
      default: return 'help-circle';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!tourist) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-circle-outline" size={80} color="#ccc" />
        <Text style={styles.errorText}>Profile not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchProfile}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color="#007AFF" />
        </View>
        <Text style={styles.name}>{tourist.kyc.name}</Text>
        <Text style={styles.digitalId}>ID: {tourist.digitalId}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tourist.safetyStatus) }]}>
          <Ionicons name={getStatusIcon(tourist.safetyStatus)} size={16} color="white" />
          <Text style={styles.statusText}>{tourist.safetyStatus.toUpperCase()}</Text>
        </View>
      </View>

      {/* Personal Information */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <View style={styles.infoRow}>
          <Ionicons name="flag-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>Nationality:</Text>
          <Text style={styles.infoValue}>{tourist.kyc.nationality}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="document-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>Passport:</Text>
          <Text style={styles.infoValue}>{tourist.kyc.passportNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>Phone:</Text>
          <Text style={styles.infoValue}>{tourist.kyc.phoneNumber}</Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="medical-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>Emergency Contact:</Text>
          <Text style={styles.infoValue}>{tourist.kyc.emergencyContact}</Text>
        </View>
      </View>

      {/* Itinerary Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Travel Itinerary</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditingItinerary(!editingItinerary)}
          >
            <Ionicons name={editingItinerary ? "close" : "pencil"} size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {editingItinerary ? (
          <View style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Start Date</Text>
              <TextInput
                style={styles.input}
                value={itineraryForm.startDate}
                onChangeText={(text) => setItineraryForm(prev => ({ ...prev, startDate: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Date</Text>
              <TextInput
                style={styles.input}
                value={itineraryForm.endDate}
                onChangeText={(text) => setItineraryForm(prev => ({ ...prev, endDate: text }))}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Destinations (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={itineraryForm.destinations}
                onChangeText={(text) => setItineraryForm(prev => ({ ...prev, destinations: text }))}
                placeholder="Jaipur, Delhi, Agra"
                multiline
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Accommodations (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={itineraryForm.accommodations}
                onChangeText={(text) => setItineraryForm(prev => ({ ...prev, accommodations: text }))}
                placeholder="Hotel Name, Guest House"
                multiline
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Activities (comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={itineraryForm.activities}
                onChangeText={(text) => setItineraryForm(prev => ({ ...prev, activities: text }))}
                placeholder="Sightseeing, Shopping, Cultural Tours"
                multiline
              />
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleUpdateItinerary}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.itineraryView}>
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Duration:</Text>
              <Text style={styles.infoValue}>
                {tourist.itinerary?.startDate} to {tourist.itinerary?.endDate}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Destinations:</Text>
              <Text style={styles.infoValue}>
                {tourist.itinerary?.destinations?.join(', ') || 'Not specified'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="bed-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Accommodations:</Text>
              <Text style={styles.infoValue}>
                {tourist.itinerary?.accommodations?.join(', ') || 'Not specified'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="star-outline" size={20} color="#666" />
              <Text style={styles.infoLabel}>Activities:</Text>
              <Text style={styles.infoValue}>
                {tourist.itinerary?.activities?.join(', ') || 'Not specified'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Last Update */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <Text style={styles.infoLabel}>Last Update:</Text>
          <Text style={styles.infoValue}>
            {new Date(tourist.lastLocationUpdate).toLocaleString()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 10,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  digitalId: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  section: {
    backgroundColor: 'white',
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  editButton: {
    padding: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
    minWidth: 120,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  editForm: {
    marginTop: 10,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  itineraryView: {
    marginTop: 10,
  },
});
