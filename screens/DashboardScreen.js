import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { executeSelectQuery, resetDatabase } from '../utils/database';
import styles from '../styles/DashboardScreen.styles';

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState({
    totalKm: "0.0",
    totalFuelCost: "0.00",
    avgConsumption: "0.0",
    totalRepairs: "0.00"
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const fuelEntries = await executeSelectQuery(
        'SELECT kilometers, liters, price_per_liter FROM fuel_entries ORDER BY date DESC'
      );

      let totalKm = 0;
      let totalFuelCost = 0;
      let totalLiters = 0;
      let kmDiff = 0;

      if (fuelEntries.length > 0) {
        totalKm = parseFloat(fuelEntries[0].kilometers);
        kmDiff = totalKm - (parseFloat(fuelEntries[fuelEntries.length - 1]?.kilometers) || 0);
        
        fuelEntries.forEach(entry => {
          totalFuelCost += parseFloat(entry.liters) * parseFloat(entry.price_per_liter);
          totalLiters += parseFloat(entry.liters);
        });
      }

      const repairs = await executeSelectQuery('SELECT cost FROM repairs');
      const totalRepairs = repairs.reduce((sum, repair) => sum + parseFloat(repair.cost), 0);

      const avgConsumption = kmDiff > 0 ? (totalLiters / kmDiff) * 100 : 0;

      setStats({
        totalKm: totalKm.toFixed(1),
        totalFuelCost: totalFuelCost.toFixed(2),
        avgConsumption: avgConsumption.toFixed(1),
        totalRepairs: totalRepairs.toFixed(2)
      });
    } catch (error) {
      console.error('Error loading stats:', error);
      setError('Failed to load statistics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const setup = async () => {
      try {
        if (isMounted) {
          await loadStats();
        }
      } catch (error) {
        console.error('Error loading stats:', error);
        if (isMounted) {
          setError('Failed to load statistics. Please try again.');
          setIsLoading(false);
        }
      }
    };

    setup();

    const unsubscribe = navigation.addListener('focus', () => {
      if (isMounted) {
        loadStats();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [navigation]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading statistics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadStats}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Kilometers</Text>
            <Text style={styles.statValue}>{stats.totalKm} km</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Fuel Cost</Text>
            <Text style={styles.statValue}>${stats.totalFuelCost}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg. Consumption</Text>
            <Text style={styles.statValue}>{stats.avgConsumption} L/100km</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Repairs</Text>
            <Text style={styles.statValue}>${stats.totalRepairs}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('FuelTracker')}
          >
            <Text style={styles.buttonText}>Fuel Tracker</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('RepairTracker')}
          >
            <Text style={styles.buttonText}>Repair Tracker</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Maintenance')}
          >
            <Text style={styles.buttonText}>Maintenance</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.button, styles.resetButton]}
          onPress={() => {
            Alert.alert(
              'Reset Database',
              'Are you sure you want to reset the database? This will delete all your data.',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await resetDatabase();
                      await loadStats();
                      Alert.alert('Success', 'Database has been reset successfully');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to reset database');
                    }
                  },
                },
              ],
            );
          }}
        >
          <Text style={styles.buttonText}>Reset Database</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 