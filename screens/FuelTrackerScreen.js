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
        'SELECT * FROM fuel_entries ORDER BY id DESC'
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
      // Get the latest entry before adding the new one
      const previousEntries = await executeSelectQuery(
        'SELECT * FROM fuel_entries ORDER BY id DESC LIMIT 1'
      );
      
      const totalCost = parseFloat(formData.liters) * parseFloat(formData.price_per_liter);
      
      // Add the new entry
      await executeQuery(
        'INSERT INTO fuel_entries (date, kilometers, liters, price_per_liter, total_cost, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [
          formData.date,
          parseFloat(formData.kilometers),
          parseFloat(formData.liters),
          parseFloat(formData.price_per_liter),
          totalCost,
          formData.notes
        ]
      );

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        kilometers: '',
        liters: '',
        price_per_liter: '',
        notes: ''
      });

      // Reload entries to show the new entry with consumption
      loadEntries();

      // If there was a previous entry, calculate and show consumption
      if (previousEntries && previousEntries.length > 0) {
        const prevEntry = previousEntries[0];
        const currentKm = parseFloat(formData.kilometers);
        const prevKm = parseFloat(prevEntry.kilometers);
        const kmDiff = currentKm - prevKm;
        
        if (kmDiff > 0) {
          const consumption = (parseFloat(formData.liters) / kmDiff) * 100;
          Alert.alert(
            'Entry Added',
            `Fuel consumption: ${consumption.toFixed(1)} L/100km`
          );
        }
      }
    } catch (error) {
      console.error('Error adding entry:', error);
      Alert.alert('Error', 'Failed to add fuel entry');
    }
  };

  const calculateConsumption = (entry) => {
    // Get the values from the current entry
    const kilometers = parseFloat(entry.kilometers);
    const liters = parseFloat(entry.liters);
    
    // Calculate consumption using current entry's data
    // Formula: (liters / kilometers) * 100 to get L/100km
    const consumption = (liters / kilometers) * 100;
    
    // Validate the result
    if (isNaN(consumption) || !isFinite(consumption) || kilometers <= 0) return null;
    
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
        {entries.map((entry) => {
          const consumption = calculateConsumption(entry);
          
          return (
            <View key={entry.id} style={styles.entryCard}>
              <Text style={styles.entryDate}>{entry.date}</Text>
              <View style={styles.entryDetails}>
                <Text style={styles.detailText}>Kilometers: {parseFloat(entry.kilometers).toFixed(1)} km</Text>
                <Text style={styles.detailText}>Liters: {parseFloat(entry.liters).toFixed(2)} L</Text>
                <Text style={styles.detailText}>Price/L: ${parseFloat(entry.price_per_liter).toFixed(2)}</Text>
                <Text style={styles.detailText}>Total: ${parseFloat(entry.total_cost).toFixed(2)}</Text>
                <Text style={[styles.detailText, styles.consumption]}>
                  Consumption: {consumption ? `${consumption} L/100km` : 'N/A'}
                </Text>
              </View>
              {entry.notes && <Text style={styles.notes}>Notes: {entry.notes}</Text>}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
} 