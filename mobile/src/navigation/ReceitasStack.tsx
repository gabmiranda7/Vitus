import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PacientesReceitasScreen from '../screens/PacientesReceitasScreen';
import HistoricoReceitasScreen from '../screens/HistoricoReceitasScreen';

const Stack = createNativeStackNavigator();

export default function ReceitasStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1976d2' },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="PacientesReceitas"
        component={PacientesReceitasScreen}
        options={{ title: 'Receitas' }}
      />
      <Stack.Screen
        name="HistoricoReceitas"
        component={HistoricoReceitasScreen}
        options={({ route }: any) => ({ title: route.params?.nomePaciente ?? 'Receitas' })}
      />
    </Stack.Navigator>
  );
}