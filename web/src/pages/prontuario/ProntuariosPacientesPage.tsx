import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, InputAdornment,
  Avatar, Chip, CircularProgress, Alert, Button, Paper, Tooltip,
  FormControl, InputLabel, MenuItem, Select, alpha
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PeopleIcon from '@mui/icons-material/People';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import PersonIcon from '@mui/icons-material/Person';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import AccessAlarmIcon from '@mui/icons-material/AccessAlarm';
import FilterListIcon from '@mui/icons-material/FilterList';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { situacaoVencimento } from '../../components/receitas/vencimento';
import { AcompanhamentoPaciente, Paciente, Tratamento } from '../../types';

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
  const [acompanhamentos, setAcompanhamentos] = useState<AcompanhamentoPaciente[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);
  const [situacao, setSituacao] = useState('todos');
  const [prazo, setPrazo] = useState('30');
  const [unidade, setUnidade] = useState('dias');

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    try {
      const [rPacientes, rAcompanhamento] = await Promise.all([
        api.get('/api/Paciente'),
        api.get('/api/prontuarios/acompanhamento').catch(() => ({ data: [] })),
      ]);
      setPacientes(rPacientes.data);
      setAcompanhamentos(rAcompanhamento.data);
    } catch {
      setErro('Erro ao carregar pacientes');
    } finally {
      setLoading(false);
    }
  }

  const tratamentosPorPaciente = new Map(acompanhamentos.map(a => [a.pacienteId, a.tratamentos]));

  function passaSituacao(trats: Tratamento[]): boolean {
    if (situacao === 'todos') return true;
    if (situacao === 'acompanhados') return trats.length > 0;
    if (situacao === 'vencidas') return trats.some(t => t.diasRestantes < 0);

    const n = Number(prazo);
    if (!n || n < 1) return trats.some(t => t.diasRestantes >= 0);
    if (unidade === 'dias') return trats.some(t => t.diasRestantes >= 0 && t.diasRestantes <= n);

    const limite = new Date();
    limite.setMonth(limite.getMonth() + n);
    return trats.some(t => t.diasRestantes >= 0 && new Date(t.dataVencimento + 'T00:00:00') <= limite);
  }

  const temFiltroAtivo = situacao !== 'todos';

  const filtrados = pacientes
    .filter(p => {
      const buscaOk = p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (p.cpf?.replace(/\D/g, '').includes(busca.replace(/\D/g, '')) && busca.length >= 3);
      return buscaOk && passaSituacao(tratamentosPorPaciente.get(p.id) ?? []);
    })
    .sort((a, b) => {
      if (!temFiltroAtivo) return 0;
      const da = tratamentosPorPaciente.get(a.id)?.[0]?.diasRestantes ?? Infinity;
      const db = tratamentosPorPaciente.get(b.id)?.[0]?.diasRestantes ?? Infinity;
      return da - db;
    });

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

      <Box sx={{ display: 'flex', gap: 1, mb: filtrosVisiveis ? 2 : 3 }}>
        <TextField
          fullWidth
          placeholder="Buscar por nome ou CPF..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
              )
            }
          }}
        />
        <Tooltip title={filtrosVisiveis ? 'Ocultar filtros' : 'Mostrar filtros'}>
          <Button
            variant={temFiltroAtivo ? 'contained' : 'outlined'}
            color={temFiltroAtivo ? 'primary' : 'inherit'}
            onClick={() => setFiltrosVisiveis(v => !v)}
            startIcon={filtrosVisiveis ? <FilterListOffIcon /> : <FilterListIcon />}
            sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
          >
            Filtros {temFiltroAtivo && '(1)'}
          </Button>
        </Tooltip>
      </Box>

      {filtrosVisiveis && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl sx={{ minWidth: 220 }} size="small">
              <InputLabel>Receita</InputLabel>
              <Select value={situacao} label="Receita" onChange={(e) => setSituacao(e.target.value)}>
                <MenuItem value="todos">Todos os pacientes</MenuItem>
                <MenuItem value="acompanhados">Com receita acompanhada</MenuItem>
                <MenuItem value="vencidas">Receita vencida</MenuItem>
                <MenuItem value="a_vencer">A vencer em até...</MenuItem>
              </Select>
            </FormControl>
            {situacao === 'a_vencer' && (
              <>
                <TextField
                  label="Prazo" type="number" size="small" value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  slotProps={{ htmlInput: { min: 1 } }} sx={{ width: 100 }}
                />
                <FormControl sx={{ minWidth: 120 }} size="small">
                  <InputLabel>Unidade</InputLabel>
                  <Select value={unidade} label="Unidade" onChange={(e) => setUnidade(e.target.value)}>
                    <MenuItem value="dias">dias</MenuItem>
                    <MenuItem value="meses">meses</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}
            {temFiltroAtivo && (
              <Button size="small" variant="outlined" color="error" onClick={() => setSituacao('todos')}>
                Limpar filtros
              </Button>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
              {filtrados.length} de {pacientes.length} paciente(s)
            </Typography>
          </Box>
        </Paper>
      )}

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filtrados.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <PeopleIcon sx={{ fontSize: 64, opacity: 0.15, mb: 2 }} />
          <Typography variant="h6" sx={{ opacity: 0.4 }}>
            {busca || temFiltroAtivo ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
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
                    {(() => {
                      const t = tratamentosPorPaciente.get(p.id)?.[0];
                      if (!t) return null;
                      const s = situacaoVencimento(t.diasRestantes);
                      return (
                        <Tooltip title={t.medicamento}>
                          <Chip
                            icon={<AccessAlarmIcon />}
                            label={`Receita ${s.label}`}
                            size="small"
                            sx={{
                              bgcolor: alpha(s.cor, 0.12), color: s.cor, fontWeight: 700, fontSize: 11,
                              '& .MuiChip-icon': { color: s.cor },
                            }}
                          />
                        </Tooltip>
                      );
                    })()}
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