import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { executeQuery, executeSelectQuery } from '../utils/database';
import styles from '../styles/Maintenance.styles';

export default function MaintenanceScreen() {
  const [maintenanceItems, setMaintenanceItems] = useState([]);
  const [formData, setFormData] = useState({
    type: '',
    interval_km: '',
    last_maintenance_km: ''
  });

  useEffect(() => {
    loadMaintenanceItems();
  }, []);

  const loadMaintenanceItems = async () => {
    try {
      const results = await executeSelectQuery(
        'SELECT * FROM maintenance ORDER BY type ASC'
      );
      setMaintenanceItems(results);
    } catch (error) {
      console.error('Error loading maintenance items:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.type || !formData.interval_km || !formData.last_maintenance_km) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await executeQuery(
        'INSERT INTO maintenance (type, interval_km, last_maintenance_km) VALUES (?, ?, ?)',
        [
          formData.type,
          parseInt(formData.interval_km),
          parseInt(formData.last_maintenance_km)
        ]
      );

      // Reset form
      setFormData({
        type: '',
        interval_km: '',
        last_maintenance_km: ''
      });

      // Reload maintenance items
      loadMaintenanceItems();
    } catch (error) {
      console.error('Error adding maintenance item:', error);
      Alert.alert('Error', 'Failed to add maintenance item');
    }
  };

  const handleMarkAsDone = async (id, currentKm) => {
    try {
      await executeQuery(
        'UPDATE maintenance SET last_maintenance_km = ? WHERE id = ?',
        [currentKm, id]
      );
      loadMaintenanceItems();
    } catch (error) {
      console.error('Error updating maintenance:', error);
      Alert.alert('Error', 'Failed to update maintenance');
    }
  };

  const calculateNextMaintenance = (item) => {
    const nextKm = parseInt(item.last_maintenance_km) + parseInt(item.interval_km);
    const currentKm = maintenanceItems.length > 0 ? 
      Math.max(...maintenanceItems.map(item => parseInt(item.last_maintenance_km))) : 0;
    return nextKm - currentKm;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Add Maintenance Item</Text>
        
        <TextInput
          style={styles.input}
          value={formData.type}
          onChangeText={(value) => handleInputChange('type', value)}
          placeholder="Type (e.g., Oil Change)"
        />
        
        <TextInput
          style={styles.input}
          value={formData.interval_km}
          onChangeText={(value) => handleInputChange('interval_km', value)}
          placeholder="Interval (km)"
          keyboardType="numeric"
        />
        
        <TextInput
          style={styles.input}
          value={formData.last_maintenance_km}
          onChangeText={(value) => handleInputChange('last_maintenance_km', value)}
          placeholder="Last Maintenance (km)"
          keyboardType="numeric"
        />
        
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Add Maintenance</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.maintenanceContainer}>
        <Text style={styles.sectionTitle}>Maintenance Schedule</Text>
        {maintenanceItems.map(item => {
          const kmUntilNext = calculateNextMaintenance(item);
          return (
            <View key={item.id} style={styles.maintenanceCard}>
              <Text style={styles.maintenanceType}>{item.type}</Text>
              <View style={styles.maintenanceDetails}>
                <Text>Interval: Every {item.interval_km} km</Text>
                <Text>Last done at: {item.last_maintenance_km} km</Text>
                <Text style={[
                  styles.kmRemaining,
                  kmUntilNext <= 1000 && { color: '#FF3B30' }
                ]}>
                  {kmUntilNext > 0 ? 
                    `${kmUntilNext} km until next` : 
                    'Overdue!'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.markDoneButton}
                onPress={() => handleMarkAsDone(item.id, item.last_maintenance_km)}
              >
                <Text style={styles.markDoneButtonText}>Mark as Done</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
} 