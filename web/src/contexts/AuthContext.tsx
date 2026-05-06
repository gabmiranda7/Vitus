import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { Usuario } from '../types';

interface AuthContextData {
  usuario: Usuario | null;
  login: (usuario: Usuario) => void;
  logout: () => void;
  isAuthenticated: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const token = localStorage.getItem('token');
    const nome = localStorage.getItem('nome');
    const email = localStorage.getItem('email');
    const perfil = localStorage.getItem('perfil');
    if (token && nome && email && perfil) return { token, nome, email, perfil };
    return null;
  });

  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem('darkMode') === 'true'
  );

  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#1976d2' },
    },
  }), [darkMode]);

  function login(u: Usuario) {
    localStorage.setItem('token', u.token);
    localStorage.setItem('nome', u.nome);
    localStorage.setItem('email', u.email);
    localStorage.setItem('perfil', u.perfil);
    setUsuario(u);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('nome');
    localStorage.removeItem('email');
    localStorage.removeItem('perfil');
    setUsuario(null);
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
      darkMode, toggleDarkMode
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