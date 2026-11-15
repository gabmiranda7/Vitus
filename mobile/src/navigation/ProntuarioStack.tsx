import React from 'react';
import { useColorScheme } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PacientesProntuarioScreen from '../screens/prontuario/PacientesProntuarioScreen';
import ProntuarioDetalheScreen from '../screens/prontuario/ProntuarioDetalheScreen';
import { cores } from '../theme';

const Stack = createNativeStackNavigator();

export default function ProntuarioStack() {
  const isDark = useColorScheme() === 'dark';

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: isDark ? '#0d47a1' : cores.primaria },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="PacientesProntuario"
        component={PacientesProntuarioScreen}
        options={{ title: 'Prontuários' }}
      />
      <Stack.Screen
        name="ProntuarioDetalhe"
        component={ProntuarioDetalheScreen}
        options={({ route }: any) => ({ title: route.params?.nomePaciente ?? 'Prontuário' })}
      />
    </Stack.Navigator>
  );
}