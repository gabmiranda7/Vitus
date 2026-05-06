import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/auth/LoginPage';
import CadastroPage from '../pages/auth/CadastroPage';
import ConsultasPage from '../pages/consultas/ConsultasPage';
import MedicosPage from '../pages/medicos/MedicosPage';
import PacientesPage from '../pages/pacientes/PacientesPage';
import ProntuarioPage from '../pages/prontuario/ProntuarioPage';
import ReceitasPage from '../pages/receitas/ReceitasPage';
import TriagemPage from '../pages/triagem/TriagemPage';

function PrivateRoute({ children, perfis }: { children: JSX.Element; perfis: string[] }) {
  const { isAuthenticated, usuario } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!perfis.includes(usuario!.perfil)) return <Navigate to="/login" />;
  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<CadastroPage />} />

        <Route path="/consultas" element={
          <PrivateRoute perfis={['Recepcionista', 'Enfermeiro', 'Medico']}>
            <ConsultasPage />
          </PrivateRoute>
        } />

        <Route path="/medicos" element={
          <PrivateRoute perfis={['Recepcionista']}>
            <MedicosPage />
          </PrivateRoute>
        } />

        <Route path="/pacientes" element={
          <PrivateRoute perfis={['Recepcionista']}>
            <PacientesPage />
          </PrivateRoute>
        } />

        <Route path="/prontuario/:consultaId" element={
          <PrivateRoute perfis={['Medico', 'Enfermeiro']}>
            <ProntuarioPage />
          </PrivateRoute>
        } />

        <Route path="/receitas" element={
          <PrivateRoute perfis={['Medico']}>
            <ReceitasPage />
          </PrivateRoute>
        } />

        <Route path="/triagem" element={
          <PrivateRoute perfis={['Enfermeiro']}>
            <TriagemPage />
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}