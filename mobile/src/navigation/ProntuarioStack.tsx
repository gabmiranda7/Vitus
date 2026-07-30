import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PacientesProntuarioScreen from '../screens//prontuario/PacientesProntuarioScreen';
import ProntuarioDetalheScreen from '../screens/prontuario/ProntuarioDetalheScreen';

const Stack = createNativeStackNavigator();

export default function ProntuarioStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1976d2' },
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