import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

interface Usuario {
  nome: string;
  email: string;
  perfil: string;
}

interface AuthContextData {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    validarSessao();
  }, []);

  async function validarSessao() {
    try {
      const usuarioSalvo = await SecureStore.getItemAsync('vitus_usuario');
      const token = await SecureStore.getItemAsync('vitus_token');

      if (!usuarioSalvo || !token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/api/auth/me');
      const usuarioValidado: Usuario = {
        nome: response.data.nome,
        email: response.data.email,
        perfil: response.data.perfil,
      };

      await SecureStore.setItemAsync('vitus_usuario', JSON.stringify(usuarioValidado));
      setUsuario(usuarioValidado);
    } catch {
      await SecureStore.deleteItemAsync('vitus_token');
      await SecureStore.deleteItemAsync('vitus_usuario');
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, senha: string) {
    const response = await api.post('/api/auth/login', { email, senha });
    const { token, nome, perfil } = response.data;

    const usuarioLogado: Usuario = { nome, email, perfil };

    await SecureStore.setItemAsync('vitus_token', token);
    await SecureStore.setItemAsync('vitus_usuario', JSON.stringify(usuarioLogado));

    setUsuario(usuarioLogado);
  }

  async function logout() {
    await SecureStore.deleteItemAsync('vitus_token');
    await SecureStore.deleteItemAsync('vitus_usuario');
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}