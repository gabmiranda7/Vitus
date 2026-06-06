import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || ''
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const mensagem =
      error.response?.data?.message ||
      error.response?.data?.Message ||
      error.response?.data ||
      error.message ||
      'Erro inesperado';

    error.mensagemBack = typeof mensagem === 'string' ? mensagem : 'Erro inesperado';
    return Promise.reject(error);
  }
);

export default api;