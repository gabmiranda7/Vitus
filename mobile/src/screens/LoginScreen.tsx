import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function handleLogin() {
    setErro('');
    if (!email.trim() || !senha.trim()) {
      setErro('Preencha email e senha');
      return;
    }
    setLoading(true);
    try {
      await login(email, senha);
    } catch (error: any) {
      setErro(error.mensagemBack ?? 'Erro ao fazer login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Surface style={styles.card} elevation={2}>
        <Text variant="headlineMedium" style={styles.titulo}>Vitus</Text>
        <Text variant="bodyMedium" style={styles.subtitulo}>Entre com sua conta</Text>

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          mode="outlined"
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.botao}
        >
          Entrar
        </Button>
      </Surface>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#e3f2fd',
  },
  card: {
    padding: 24,
    borderRadius: 16,
  },
  titulo: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#1565c0',
    marginBottom: 4,
  },
  subtitulo: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
  },
  botao: {
    marginTop: 8,
    paddingVertical: 4,
  },
  erro: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
  },
});