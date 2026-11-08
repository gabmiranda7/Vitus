import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import api from '../services/api';
import { Usuario } from '../types';

interface AuthContextData {
  usuario: Usuario | null;
  login: (usuario: Usuario) => void;
  logout: () => void;
  isAuthenticated: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  fotoUrl: string | null;
  atualizarUsuario: (parcial: Partial<Usuario>) => void;
  recarregarFoto: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const token = localStorage.getItem('token');
    const nome = localStorage.getItem('nome');
    const email = localStorage.getItem('email');
    const perfil = localStorage.getItem('perfil');
    const medicoId = localStorage.getItem('medicoId');
    const temFoto = localStorage.getItem('temFoto') === 'true';
    if (token && nome && email && perfil) {
      return { token, nome, email, perfil, medicoId: medicoId ?? undefined, temFoto };
    }
    return null;
  });

  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [versaoFoto, setVersaoFoto] = useState(0);

  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem('darkMode') === 'true'
  );

  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#1976d2' },
      ...(darkMode ? {} : { background: { default: '#e9edf3', paper: '#f7f9fc' } }),
    },
  }), [darkMode]);

  // Sincroniza nome e foto com o servidor ao abrir o app
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api.get('/api/auth/me')
      .then((r) => {
        localStorage.setItem('nome', r.data.nome);
        localStorage.setItem('temFoto', String(!!r.data.temFoto));
        setUsuario(prev => prev
          ? { ...prev, nome: r.data.nome, temFoto: !!r.data.temFoto, medicoId: r.data.medicoId ?? prev.medicoId }
          : prev);
      })
      .catch(() => { /* sessão inválida é tratada pelas rotas protegidas */ });
  }, []);

  // Baixa a foto (endpoint autenticado) e expõe como URL local
  const temFoto = !!usuario?.temFoto;
  useEffect(() => {
    if (!temFoto) return;
    let cancelado = false;
    let url: string | null = null;

    api.get('/api/auth/me/foto', { responseType: 'blob' })
      .then((r) => {
        if (cancelado) return;
        url = URL.createObjectURL(r.data);
        setFotoUrl(url);
      })
      .catch(() => { if (!cancelado) setFotoUrl(null); });

    return () => {
      cancelado = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [temFoto, versaoFoto]);

  function login(u: Usuario) {
    localStorage.setItem('token', u.token);
    localStorage.setItem('nome', u.nome);
    localStorage.setItem('email', u.email);
    localStorage.setItem('perfil', u.perfil);
    localStorage.setItem('temFoto', String(!!u.temFoto));
    if (u.medicoId) localStorage.setItem('medicoId', u.medicoId);
    setUsuario(u);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('nome');
    localStorage.removeItem('email');
    localStorage.removeItem('perfil');
    localStorage.removeItem('medicoId');
    localStorage.removeItem('temFoto');
    setFotoUrl(null);
    setUsuario(null);
  }

  function atualizarUsuario(parcial: Partial<Usuario>) {
    if (!usuario) return;
    const novo = { ...usuario, ...parcial };
    localStorage.setItem('token', novo.token);
    localStorage.setItem('nome', novo.nome);
    localStorage.setItem('temFoto', String(!!novo.temFoto));
    setUsuario(novo);
  }

  function recarregarFoto() {
    setVersaoFoto(v => v + 1);
  }

  function toggleDarkMode() {
    setDarkMode(prev => {
      localStorage.setItem('darkMode', String(!prev));
      return !prev;
    });
  }

  return (
    <AuthContext.Provider value={{
      usuario, login, logout,
      isAuthenticated: !!usuario,
      darkMode, toggleDarkMode,
      fotoUrl: temFoto ? fotoUrl : null,
      atualizarUsuario, recarregarFoto,
    }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}