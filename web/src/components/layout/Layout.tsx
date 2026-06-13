import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Box, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography, IconButton,
  Divider, Avatar, Tooltip, useTheme, Chip
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventNoteIcon from '@mui/icons-material/EventNote';
import HistoryIcon from '@mui/icons-material/History';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import MedicationIcon from '@mui/icons-material/Medication';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 256;

const menuItems = [
  { label: 'Auditoria', path: '/auditoria', icon: <HistoryIcon />, perfis: ['Administrador'] },
  { label: 'Minha Agenda', path: '/agenda', icon: <CalendarTodayIcon />, perfis: ['Medico'] },
  { label: 'Dashboard',  path: '/dashboard',  icon: <DashboardIcon />,       perfis: ['Recepcionista', 'Enfermeiro', 'Medico'] },
  { label: 'Consultas',  path: '/consultas',  icon: <EventNoteIcon />,        perfis: ['Recepcionista', 'Enfermeiro', 'Medico'] },
  { label: 'Triagem',    path: '/triagem',    icon: <MedicalServicesIcon />,  perfis: ['Enfermeiro'] },
  { label: 'Receitas',   path: '/receitas',   icon: <MedicationIcon />,       perfis: ['Medico'] },
  { label: 'Prontuários', path: '/prontuarios', icon: <FolderSharedIcon />, perfis: ['Medico', 'Enfermeiro'] },
  { label: 'Pacientes',  path: '/pacientes',  icon: <PeopleIcon />,           perfis: ['Recepcionista'] },
  { label: 'Médicos',    path: '/medicos',    icon: <LocalHospitalIcon />,    perfis: ['Recepcionista'] },
];

const perfilCores: Record<string, string> = {
  Medico: '#1565c0',
  Enfermeiro: '#2e7d32',
  Recepcionista: '#6a1b9a',
  Administrador: '#37474f',
};

const perfilLabels: Record<string, string> = {
  Medico: 'Médico',
  Enfermeiro: 'Enfermeiro(a)',
  Recepcionista: 'Recepcionista',
  Administrador: 'Administrador',
};

function iniciaisNome(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export default function Layout({ children }: { children: ReactNode }) {
  const { usuario, logout, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const itensFiltrados = menuItems.filter(item =>
    item.perfis.includes(usuario?.perfil ?? '')
  );

  const corPerfil = perfilCores[usuario?.perfil ?? ''] ?? '#1976d2';

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBar */}
      <AppBar position="fixed" elevation={0} sx={{
        zIndex: (t) => t.zIndex.drawer + 1,
        bgcolor: isDark ? 'grey.900' : 'white',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
      }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '8px',
              bgcolor: 'primary.main', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <FolderSharedIcon sx={{ color: 'white', fontSize: 18 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: -0.5 }}>
              Vitus
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title={darkMode ? 'Modo claro' : 'Modo escuro'}>
              <IconButton onClick={toggleDarkMode} size="small" sx={{ color: 'text.secondary' }}>
                {darkMode ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{
                width: 34, height: 34, fontSize: 13, fontWeight: 700,
                bgcolor: corPerfil,
              }}>
                {iniciaisNome(usuario?.nome ?? '')}
              </Avatar>
              <Box sx={{ display: 'none', '@media (min-width: 600px)': { display: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
                  {usuario?.nome?.split(' ')[0]}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {perfilLabels[usuario?.perfil ?? ''] ?? usuario?.perfil}
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Sair">
              <IconButton size="small" onClick={() => { logout(); navigate('/login'); }}
                sx={{ color: 'text.secondary' }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer variant="permanent" sx={{
        width: DRAWER_WIDTH, flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH, boxSizing: 'border-box',
          bgcolor: isDark ? 'grey.900' : '#f8faff',
          borderRight: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        },
      }}>
        <Toolbar />
        <Box sx={{ p: 2, pt: 2.5 }}>
          <Typography variant="caption" sx={{
            color: 'text.disabled', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: 1, fontSize: 10, px: 1
          }}>
            Menu
          </Typography>
        </Box>
        <List sx={{ px: 1.5, pt: 0 }}>
          {itensFiltrados.map((item) => {
            const ativo = location.pathname.startsWith(item.path);
            return (
              <ListItemButton
                key={item.path}
                selected={ativo}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2, mb: 0.5, px: 1.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiListItemIcon-root': { color: 'white' },
                    '&:hover': { bgcolor: 'primary.dark' },
                  },
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(25,118,210,0.06)',
                  },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 36,
                  color: ativo ? 'white' : 'text.secondary',
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      fontSize: 14,
                      fontWeight: ativo ? 600 : 400,
                    }
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        {/* Rodapé da sidebar */}
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Box sx={{
            p: 1.5, borderRadius: 2,
            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(25,118,210,0.06)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(25,118,210,0.12)'}`,
          }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Logado como
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {usuario?.nome?.split(' ').slice(0, 2).join(' ')}
            </Typography>
            <Chip
              label={perfilLabels[usuario?.perfil ?? ''] ?? usuario?.perfil}
              size="small"
              sx={{
                mt: 0.5, height: 20, fontSize: 10, fontWeight: 600,
                bgcolor: corPerfil, color: 'white',
              }}
            />
          </Box>
        </Box>
      </Drawer>

      {/* Conteúdo */}
      <Box component="main" sx={{
        flexGrow: 1, p: 3,
        bgcolor: isDark ? 'grey.950' : '#f0f4ff',
        minHeight: '100vh',
      }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}