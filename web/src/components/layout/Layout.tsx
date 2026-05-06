import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Box, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography, IconButton,
  Divider, Avatar, Tooltip
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import MedicationIcon from '@mui/icons-material/Medication';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useAuth } from '../../contexts/AuthContext';

const DRAWER_WIDTH = 240;

const menuItems = [
  { label: 'Consultas', path: '/consultas', icon: <EventNoteIcon />,       perfis: ['Recepcionista', 'Enfermeiro', 'Medico'] },
  { label: 'Triagem',   path: '/triagem',   icon: <MedicalServicesIcon />, perfis: ['Enfermeiro'] },
  { label: 'Receitas',  path: '/receitas',  icon: <MedicationIcon />,      perfis: ['Medico'] },
  { label: 'Pacientes', path: '/pacientes', icon: <PeopleIcon />,          perfis: ['Recepcionista'] },
  { label: 'Médicos',   path: '/medicos',   icon: <LocalHospitalIcon />,   perfis: ['Recepcionista'] },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { usuario, logout, darkMode, toggleDarkMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const itensFiltrados = menuItems.filter(item =>
    item.perfis.includes(usuario?.perfil ?? '')
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Vitus</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: 14 }}>
              {usuario?.nome?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ lineHeight: 1.2 }}>{usuario?.nome}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>{usuario?.perfil}</Typography>
            </Box>
            <Tooltip title={darkMode ? 'Modo claro' : 'Modo escuro'}>
              <IconButton color="inherit" onClick={toggleDarkMode}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Sair">
              <IconButton color="inherit" onClick={() => { logout(); navigate('/login'); }}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{
        width: DRAWER_WIDTH, flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}>
        <Toolbar />
        <Divider />
        <List>
          {itensFiltrados.map((item) => (
            <ListItemButton
              key={item.path}
              selected={location.pathname.startsWith(item.path)}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}