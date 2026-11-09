import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';
import api from '../services/api';

interface Usuario {
  nome: string;
  email: string;
  perfil: string;
  medicoId?: string;
  temFoto?: boolean;
}

interface AuthContextData {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  fotoUri: string | null;
  atualizarUsuario: (parcial: Partial<Usuario>, token?: string) => Promise<void>;
  recarregarFoto: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [versaoFoto, setVersaoFoto] = useState(0);

  useEffect(() => {
    validarSessao();
  }, []);

  const temFoto = !!usuario?.temFoto;
  const emailLogado = usuario?.email;

  useEffect(() => {
    if (!temFoto) {
      setFotoUri(null);
      return;
    }
    let cancelado = false;

    (async () => {
      try {
        const response = await api.get('/api/auth/me/foto', { responseType: 'arraybuffer' });
        const caminho = `${FileSystem.cacheDirectory}perfil_${Date.now()}.jpg`;
        await FileSystem.writeAsStringAsync(caminho, arrayBufferToBase64(response.data), {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (!cancelado) setFotoUri(caminho);
      } catch {
        if (!cancelado) setFotoUri(null);
      }
    })();

    return () => { cancelado = true; };
  }, [temFoto, versaoFoto, emailLogado]);

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
        medicoId: response.data.medicoId ?? undefined,
        temFoto: !!response.data.temFoto,
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
    const { token, nome, perfil, medicoId, temFoto } = response.data;

    const usuarioLogado: Usuario = { nome, email, perfil, medicoId: medicoId ?? undefined, temFoto: !!temFoto };

    await SecureStore.setItemAsync('vitus_token', token);
    await SecureStore.setItemAsync('vitus_usuario', JSON.stringify(usuarioLogado));

    setUsuario(usuarioLogado);
  }

  async function logout() {
    await SecureStore.deleteItemAsync('vitus_token');
    await SecureStore.deleteItemAsync('vitus_usuario');
    setFotoUri(null);
    setUsuario(null);
  }

  async function atualizarUsuario(parcial: Partial<Usuario>, token?: string) {
    if (!usuario) return;
    const novo = { ...usuario, ...parcial };
    if (token) await SecureStore.setItemAsync('vitus_token', token);
    await SecureStore.setItemAsync('vitus_usuario', JSON.stringify(novo));
    setUsuario(novo);
  }

  function recarregarFoto() {
    setVersaoFoto(v => v + 1);
  }

  return (
    <AuthContext.Provider value={{
      usuario, loading, login, logout,
      fotoUri: temFoto ? fotoUri : null,
      atualizarUsuario, recarregarFoto,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}