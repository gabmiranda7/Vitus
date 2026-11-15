import React from 'react';
import { TouchableOpacity, useColorScheme } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PacientesProntuarioScreen from '../screens/prontuario/PacientesProntuarioScreen';
import ProntuarioDetalheScreen from '../screens/prontuario/ProntuarioDetalheScreen';
import AvatarUsuario from '../components/AvatarUsuario';
import { cores } from '../theme';

const Stack = createNativeStackNavigator();

export default function ProntuarioStack() {
  const isDark = useColorScheme() === 'dark';

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: isDark ? '#0d47a1' : cores.primaria },
        headerTintColor: '#fff',
        headerRight: () => (
          <TouchableOpacity
            onPress={() => (navigation.getParent() ?? navigation).navigate('Perfil')}
            style={{ marginRight: 4 }}
          >
            <AvatarUsuario size={32} cor="rgba(255,255,255,0.25)" />
          </TouchableOpacity>
        ),
      })}
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