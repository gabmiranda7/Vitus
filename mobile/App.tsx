import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthStack from './src/navigation/AuthStack';
import TabNavigator from './src/navigation/TabNavigator';
import { theme } from './src/theme';

function Rotas() {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!usuario) {
    return <AuthStack />;
  }

  return <TabNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AuthProvider>
          <NavigationContainer>
            <Rotas />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}