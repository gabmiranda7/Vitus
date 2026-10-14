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
    const data = error.response?.data;
    let mensagem: string | undefined;

    if (typeof data === 'string' && data.trim()) mensagem = data;
    else if (Array.isArray(data?.Messages) && data.Messages.length) mensagem = data.Messages[0];
    else if (Array.isArray(data?.messages) && data.messages.length) mensagem = data.messages[0];
    else if (typeof data?.message === 'string') mensagem = data.message;
    else if (typeof data?.Message === 'string') mensagem = data.Message;

    if (!mensagem) {
      if (!error.response) mensagem = 'Não foi possível conectar ao servidor';
      else if (error.response.status === 401) mensagem = 'Sessão expirada. Faça login novamente';
      else if (error.response.status === 403) mensagem = 'Você não tem permissão para realizar esta ação';
      else mensagem = 'Ocorreu um erro inesperado';
    }

    error.mensagemBack = mensagem;
    return Promise.reject(error);
  }
);

export default api;