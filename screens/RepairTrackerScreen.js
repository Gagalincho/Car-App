import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { executeQuery, executeSelectQuery } from '../utils/database';
import styles from '../styles/RepairTracker.styles';

export default function RepairTrackerScreen() {
  const [repairs, setRepairs] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: '',
    notes: ''
  });

  useEffect(() => {
    loadRepairs();
  }, []);

  const loadRepairs = async () => {
    try {
      const results = await executeSelectQuery(
        'SELECT * FROM repairs ORDER BY id DESC'
      );
      setRepairs(results);
    } catch (error) {
      console.error('Error loading repairs:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.description || !formData.cost) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await executeQuery(
        'INSERT INTO repairs (date, description, cost, notes) VALUES (?, ?, ?, ?)',
        [
          formData.date,
          formData.description,
          parseFloat(formData.cost),
          formData.notes
        ]
      );

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        cost: '',
        notes: ''
      });

      // Reload repairs
      loadRepairs();
    } catch (error) {
      console.error('Error adding repair:', error);
      Alert.alert('Error', 'Failed to add repair');
    }
  };

  const calculateTotalCost = () => {
    return repairs.reduce((sum, repair) => sum + repair.cost, 0).toFixed(2);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Add Repair</Text>
        
        <TextInput
          style={styles.input}
          value={formData.date}
          onChangeText={(value) => handleInputChange('date', value)}
          placeholder="Date (YYYY-MM-DD)"
        />
        
        <TextInput
          style={styles.input}
          value={formData.description}
          onChangeText={(value) => handleInputChange('description', value)}
          placeholder="Description"
        />
        
        <TextInput
          style={styles.input}
          value={formData.cost}
          onChangeText={(value) => handleInputChange('cost', value.replace(',', '.'))}
          placeholder="Cost"
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
          <Text style={styles.buttonText}>Add Repair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.repairsContainer}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total Repairs Cost:</Text>
          <Text style={styles.totalValue}>${calculateTotalCost()}</Text>
        </View>

        <Text style={styles.sectionTitle}>Repair History</Text>
        {repairs.map(repair => (
          <View key={repair.id} style={styles.repairCard}>
            <Text style={styles.repairDate}>{repair.date}</Text>
            <View style={styles.repairDetails}>
              <Text style={styles.repairDescription}>{repair.description}</Text>
              <Text style={styles.repairCost}>Cost: ${parseFloat(repair.cost).toFixed(2)}</Text>
            </View>
            {repair.notes && <Text style={styles.notes}>Notes: {repair.notes}</Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  );
} 