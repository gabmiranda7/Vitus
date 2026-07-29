import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DashboardScreen from '../screens/DashboardScreen';
import ConsultasScreen from '../screens/ConsultasScreen';
import ProntuarioStack from './ProntuarioStack';
import PacientesScreen from '../screens/PacientesScreen';
import PerfilScreen from '../screens/PerfilScreen';
import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { usuario } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1976d2' },
        headerTintColor: '#fff',
        tabBarActiveTintColor: '#1976d2',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Vitus',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Consultas"
        component={ConsultasScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-clock" color={color} size={size} />
          ),
        }}
      />
      {usuario?.perfil === 'Recepcionista' && (
        <Tab.Screen
          name="Pacientes"
          component={PacientesScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account-multiple" color={color} size={size} />
            ),
          }}
        />
      )}
      {(usuario?.perfil === 'Medico' || usuario?.perfil === 'Enfermeiro') && (
        <Tab.Screen
          name="Prontuarios"
          component={ProntuarioStack}
          options={{
            headerShown: false,
            title: 'Prontuários',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="folder-account" color={color} size={size} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="Perfil"
        component={PerfilScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}