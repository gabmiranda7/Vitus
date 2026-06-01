import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, InputAdornment,
  Avatar, Chip, CircularProgress, Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import PersonIcon from '@mui/icons-material/Person';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { Paciente } from '../../types';

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function corAvatar(nome: string) {
  const cores = ['#1976d2', '#388e3c', '#7b1fa2', '#c62828', '#f57c00', '#0097a7', '#5d4037'];
  return cores[nome.charCodeAt(0) % cores.length];
}

function calcularIdade(dataNascimento?: string): string {
  if (!dataNascimento) return '';
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return `${idade} anos`;
}

export default function ProntuariosPacientesPage(): React.ReactElement {
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    try {
      const r = await api.get('/api/Paciente');
      setPacientes(r.data);
    } catch {
      setErro('Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  }

  const filtrados = pacientes.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.cpf?.replace(/\D/g, '').includes(busca.replace(/\D/g, '')) && busca.length >= 3)
  );

  return (
    <Layout>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <FolderSharedIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Prontuários</Typography>
        <Chip label={pacientes.length} size="small" color="primary" />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Busque um paciente para acessar seu prontuário completo
      </Typography>

      <TextField
        fullWidth
        placeholder="Buscar por nome ou CPF..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        sx={{ mb: 3 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
            )
          }
        }}
      />

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filtrados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <PeopleIcon sx={{ fontSize: 64, opacity: 0.15, mb: 2 }} />
          <Typography variant="h6" sx={{ opacity: 0.4 }}>
            {busca ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {filtrados.map((p) => (
            <Card
              key={p.id}
              sx={{
                borderRadius: 2, cursor: 'pointer', transition: '0.2s',
                '&:hover': { boxShadow: 4, transform: 'translateY(-1px)' }
              }}
              onClick={() => navigate(`/prontuarios/paciente/${p.id}`)}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{
                    bgcolor: corAvatar(p.nome), width: 48, height: 48,
                    fontSize: 16, fontWeight: 'bold', flexShrink: 0
                  }}>
                    {iniciais(p.nome)}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {p.nome}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 0.5 }}>
                      {p.dataNascimento && (
                        <Typography variant="caption" color="text.secondary">
                          {calcularIdade(p.dataNascimento)}
                        </Typography>
                      )}
                      {p.sexo && (
                        <Typography variant="caption" color="text.secondary">
                          {p.sexo}
                        </Typography>
                      )}
                      {p.cpf && (
                        <Typography variant="caption" color="text.secondary">
                          CPF: {p.cpf}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, alignItems: 'center' }}>
                    {p.informacoesAdicionais && (
                      <Chip
                        icon={<MedicalInformationIcon />}
                        label="Info médica"
                        size="small"
                        color="warning"
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    )}
                    <Chip
                      icon={<FolderSharedIcon />}
                      label="Ver prontuário"
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontSize: 11 }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Layout>
  );
}