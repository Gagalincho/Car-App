import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { executeQuery, executeSelectQuery } from '../utils/database';
import styles from '../styles/Maintenance.styles';

export default function MaintenanceScreen() {
  const [maintenanceItems, setMaintenanceItems] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: '',
    description: '',
    next_due_date: '',
    next_due_km: '',
    notes: ''
  });

  useEffect(() => {
    loadMaintenanceItems();
  }, []);

  const loadMaintenanceItems = async () => {
    try {
      const results = await executeSelectQuery(
        'SELECT *, COALESCE(completed, 0) as completed FROM maintenance ORDER BY completed ASC, date DESC'
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
    if (!formData.type || !formData.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await executeQuery(
        'INSERT INTO maintenance (date, type, description, next_due_date, next_due_km, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [
          formData.date,
          formData.type,
          formData.description,
          formData.next_due_date,
          formData.next_due_km ? parseFloat(formData.next_due_km) : null,
          formData.notes
        ]
      );

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: '',
        description: '',
        next_due_date: '',
        next_due_km: '',
        notes: ''
      });

      // Reload maintenance items
      loadMaintenanceItems();
    } catch (error) {
      console.error('Error adding maintenance item:', error);
      Alert.alert('Error', 'Failed to add maintenance item');
    }
  };

  const handleMarkAsDone = async (id) => {
    try {
      await executeQuery(
        'UPDATE maintenance SET completed = 1, last_maintenance_km = next_due_km WHERE id = ?',
        [id]
      );
      loadMaintenanceItems();
      Alert.alert('Success', 'Maintenance marked as done');
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
          value={formData.date}
          onChangeText={(value) => handleInputChange('date', value)}
          placeholder="Date (YYYY-MM-DD)"
        />
        
        <TextInput
          style={styles.input}
          value={formData.type}
          onChangeText={(value) => handleInputChange('type', value)}
          placeholder="Type (e.g., Oil Change)"
        />
        
        <TextInput
          style={styles.input}
          value={formData.description}
          onChangeText={(value) => handleInputChange('description', value)}
          placeholder="Description"
        />
        
        <TextInput
          style={styles.input}
          value={formData.next_due_date}
          onChangeText={(value) => handleInputChange('next_due_date', value)}
          placeholder="Next Due Date (YYYY-MM-DD)"
        />
        
        <TextInput
          style={styles.input}
          value={formData.next_due_km}
          onChangeText={(value) => handleInputChange('next_due_km', value.replace(',', '.'))}
          placeholder="Next Due at (km)"
          keyboardType="decimal-pad"
        />
        
        <TextInput
          style={styles.input}
          value={formData.notes}
          onChangeText={(value) => handleInputChange('notes', value)}
          placeholder="Notes (optional)"
          multiline
        />
        
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Add Maintenance</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.maintenanceContainer}>
        <Text style={styles.sectionTitle}>Active Maintenance</Text>
        {maintenanceItems
          .filter(item => !item.completed)
          .map(item => (
            <View key={item.id} style={styles.maintenanceCard}>
              <Text style={styles.maintenanceDate}>{item.date}</Text>
              <View style={styles.maintenanceDetails}>
                <Text style={styles.maintenanceType}>{item.type}</Text>
                <Text style={styles.detailText}>{item.description}</Text>
                {item.next_due_date && (
                  <Text style={styles.nextDue}>Next due: {item.next_due_date}</Text>
                )}
                {item.next_due_km && (
                  <Text style={styles.nextDue}>Next due at: {item.next_due_km} km</Text>
                )}
              </View>
              {item.notes && <Text style={styles.notes}>Notes: {item.notes}</Text>}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.markDoneButton}
                  onPress={() => handleMarkAsDone(item.id)}
                >
                  <Text style={styles.markDoneButtonText}>✓ Mark as Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
      </View>

      <View style={styles.maintenanceContainer}>
        <Text style={[styles.sectionTitle, styles.completedTitle]}>Completed Maintenance</Text>
        {maintenanceItems
          .filter(item => item.completed)
          .map(item => (
            <View key={item.id} style={[styles.maintenanceCard, styles.completedCard]}>
              <Text style={[styles.maintenanceDate, styles.completedText]}>{item.date}</Text>
              <View style={styles.maintenanceDetails}>
                <Text style={[styles.maintenanceType, styles.completedText]}>{item.type}</Text>
                <Text style={[styles.detailText, styles.completedText]}>{item.description}</Text>
                {item.next_due_date && (
                  <Text style={[styles.nextDue, styles.completedText]}>Next due: {item.next_due_date}</Text>
                )}
                {item.next_due_km && (
                  <Text style={[styles.nextDue, styles.completedText]}>Next due at: {item.next_due_km} km</Text>
                )}
              </View>
              {item.notes && <Text style={[styles.notes, styles.completedText]}>Notes: {item.notes}</Text>}
            </View>
          ))}
      </View>
    </ScrollView>
  );
} 