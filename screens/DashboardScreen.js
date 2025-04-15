import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { executeSelectQuery, resetDatabase } from '../utils/database';

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

      // Get total kilometers and fuel costs
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

      // Get total repair costs
      const repairs = await executeSelectQuery('SELECT cost FROM repairs');
      const totalRepairs = repairs.reduce((sum, repair) => sum + parseFloat(repair.cost), 0);

      // Calculate average consumption
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
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
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomContainer: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  resetButton: {
    backgroundColor: '#FF3B30', // Red color for destructive action
  },
}); 