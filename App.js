import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text } from 'react-native';
import { initDatabase } from './utils/database';

import DashboardScreen from './screens/DashboardScreen';
import FuelTrackerScreen from './screens/FuelTrackerScreen';
import RepairTrackerScreen from './screens/RepairTrackerScreen';
import MaintenanceScreen from './screens/MaintenanceScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initApp = async () => {
      try {
        await initDatabase();
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
          Error initializing app:
        </Text>
        <Text style={{ textAlign: 'center' }}>{error}</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Dashboard"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ title: 'Car Journal' }}
        />
        <Stack.Screen 
          name="FuelTracker" 
          component={FuelTrackerScreen}
          options={{ title: 'Fuel Tracker' }}
        />
        <Stack.Screen 
          name="RepairTracker" 
          component={RepairTrackerScreen}
          options={{ title: 'Repair Tracker' }}
        />
        <Stack.Screen 
          name="Maintenance" 
          component={MaintenanceScreen}
          options={{ title: 'Maintenance' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}