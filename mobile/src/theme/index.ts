import { MD3LightTheme } from 'react-native-paper';

export const cores = {
  primaria: '#1976d2',
  primariaEscura: '#1565c0',
  secundaria: '#7b1fa2',
  sucesso: '#2e7d32',
  aviso: '#ed6c02',
  erro: '#d32f2f',
  info: '#0288d1',

  // Gradientes por contexto (mesmo padrão do web)
  gradienteAzul: ['#1565c0', '#1976d2'],
  gradienteLaranja: ['#e65100', '#f57c00'],
  gradienteInfo: ['#0277bd', '#0288d1'],
  gradienteRoxo: ['#4a148c', '#7b1fa2'],
  gradienteVerde: ['#1b5e20', '#2e7d32'],
  gradienteVermelho: ['#b71c1c', '#d32f2f'],

  fundo: '#f5f5f5',
  textoSecundario: '#666',
  textoDesabilitado: '#999',
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: cores.primaria,
    secondary: cores.secundaria,
  },
};

export function corAvatar(nome: string) {
  const paleta = ['#1976d2', '#388e3c', '#7b1fa2', '#c62828', '#f57c00', '#0097a7'];
  return paleta[nome.charCodeAt(0) % paleta.length];
}

export function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}