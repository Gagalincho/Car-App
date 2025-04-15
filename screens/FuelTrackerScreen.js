import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { executeQuery, executeSelectQuery } from '../utils/database';
import styles from '../styles/FuelTracker.styles';

export default function FuelTrackerScreen() {
  const [entries, setEntries] = useState([]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    kilometers: '',
    liters: '',
    price_per_liter: '',
    notes: ''
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const results = await executeSelectQuery(
        'SELECT * FROM fuel_entries ORDER BY date DESC, id DESC'
      );
      setEntries(results);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!formData.kilometers || !formData.liters || !formData.price_per_liter) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await executeQuery(
        'INSERT INTO fuel_entries (date, kilometers, liters, price_per_liter, notes) VALUES (?, ?, ?, ?, ?)',
        [
          formData.date,
          parseFloat(formData.kilometers),
          parseFloat(formData.liters),
          parseFloat(formData.price_per_liter),
          formData.notes
        ]
      );

      setFormData({
        date: new Date().toISOString().split('T')[0],
        kilometers: '',
        liters: '',
        price_per_liter: '',
        notes: ''
      });

      loadEntries();
    } catch (error) {
      console.error('Error adding entry:', error);
      Alert.alert('Error', 'Failed to add fuel entry');
    }
  };

  const calculateConsumption = (entry, prevEntry) => {
    if (!prevEntry) return null;
    const kmDiff = entry.kilometers - prevEntry.kilometers;
    if (kmDiff <= 0) return null;
    const consumption = (entry.liters / kmDiff) * 100;
    return consumption.toFixed(1);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Add Fuel Entry</Text>
        
        <TextInput
          style={styles.input}
          value={formData.date}
          onChangeText={(value) => handleInputChange('date', value)}
          placeholder="Date (YYYY-MM-DD)"
        />
        
        <TextInput
          style={styles.input}
          value={formData.kilometers}
          onChangeText={(value) => handleInputChange('kilometers', value.replace(',', '.'))}
          placeholder="Kilometers"
          keyboardType="decimal-pad"
        />
        
        <TextInput
          style={styles.input}
          value={formData.liters}
          onChangeText={(value) => handleInputChange('liters', value.replace(',', '.'))}
          placeholder="Liters"
          keyboardType="decimal-pad"
        />
        
        <TextInput
          style={styles.input}
          value={formData.price_per_liter}
          onChangeText={(value) => handleInputChange('price_per_liter', value.replace(',', '.'))}
          placeholder="Price per Liter"
          keyboardType="decimal-pad"
        />
        
        <TextInput
          style={styles.input}
          value={formData.notes}
          onChangeText={(value) => handleInputChange('notes', value)}
          placeholder="Notes"
          multiline
        />
        
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Add Entry</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.entriesContainer}>
        <Text style={styles.sectionTitle}>Fuel History</Text>
        {entries.map((entry, index) => (
          <View key={entry.id} style={styles.entryCard}>
            <Text style={styles.entryDate}>{entry.date}</Text>
            <View style={styles.entryDetails}>
              <Text style={styles.detailText}>Kilometers: {parseFloat(entry.kilometers).toFixed(1)} km</Text>
              <Text style={styles.detailText}>Liters: {parseFloat(entry.liters).toFixed(2)} L</Text>
              <Text style={styles.detailText}>Price/L: ${parseFloat(entry.price_per_liter).toFixed(2)}</Text>
              <Text style={styles.detailText}>Total: ${(entry.liters * entry.price_per_liter).toFixed(2)}</Text>
              <Text style={styles.consumption}>
                Consumption: {calculateConsumption(entry, entries[index + 1]) || 'N/A'} L/100km
              </Text>
            </View>
            {entry.notes && <Text style={styles.notes}>Notes: {entry.notes}</Text>}
          </View>
        ))}
      </View>
    </ScrollView>
  );
} 