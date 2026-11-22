import React from 'react';
import { ActivityIndicator, View, useColorScheme } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthStack from './src/navigation/AuthStack';
import TabNavigator from './src/navigation/TabNavigator';
import {
  lightTheme,
  darkTheme,
  navigationLightTheme,
  navigationDarkTheme,
} from './src/theme';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaProvider>
      <PaperProvider theme={isDark ? darkTheme : lightTheme}>
        <AuthProvider>
          <NavigationContainer theme={isDark ? navigationDarkTheme : navigationLightTheme}>
            <StatusBar style="light" />
            <Rotas />
          </NavigationContainer>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}