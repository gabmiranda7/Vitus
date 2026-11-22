import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 60000,
});

let aoSessaoExpirada: (() => void) | null = null;

export function registrarSessaoExpirada(callback: (() => void) | null) {
  aoSessaoExpirada = callback;
}

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('vitus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const dados = error.response?.data;
    const mensagens = dados?.Messages ?? dados?.messages;
    let mensagem: string | null = mensagens?.[0] ?? null;

    if (!mensagem) {
      if (!error.response) {
        mensagem = error.code === 'ECONNABORTED'
          ? 'O servidor demorou para responder. Tente novamente'
          : 'Não foi possível conectar ao servidor';
      } else if (error.response.status === 403) {
        mensagem = 'Você não tem permissão para realizar esta ação';
      }
    }

    const ehLogin = error.config?.url?.includes('/api/auth/login');
    if (error.response?.status === 401 && !ehLogin) {
      aoSessaoExpirada?.();
      mensagem = mensagem ?? 'Sessão expirada. Faça login novamente';
    }

    error.mensagemBack = mensagem;
    return Promise.reject(error);
  }
);

export default api;