import { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, MenuItem, Select, FormControl, InputLabel, LinearProgress
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import Layout from '../../components/layout/Layout';
import api from '../../services/api';
import { AuditoriaLog } from '../../types';

const acaoLabels: Record<string, string> = {
  AcessoProntuario: 'Acesso a Prontuário',
  CriacaoConsulta: 'Criação de Consulta',
  CancelamentoConsulta: 'Cancelamento de Consulta',
  RegistroTriagem: 'Registro de Triagem',
  EmissaoReceita: 'Emissão de Receita',
  CriacaoPaciente: 'Criação de Paciente',
  EdicaoPaciente: 'Edição de Paciente',
  ExclusaoPaciente: 'Exclusão de Paciente',
};

const acaoCores: Record<string, string> = {
  AcessoProntuario: '#0288d1',
  CriacaoConsulta: '#1976d2',
  CancelamentoConsulta: '#d32f2f',
  RegistroTriagem: '#ed6c02',
  EmissaoReceita: '#2e7d32',
  CriacaoPaciente: '#6a1b9a',
  EdicaoPaciente: '#5d4037',
  ExclusaoPaciente: '#b71c1c',
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    try {
      const r = await api.get('/api/auditoria');
      setLogs(r.data);
    } catch (error: any) {
      setErro(error.mensagemBack ?? 'Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  }

  const acoesDisponiveis = useMemo(() =>
    [...new Set(logs.map(l => l.acao))].sort(), [logs]
  );

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    return logs.filter(l =>
      (filtroAcao === '' || l.acao === filtroAcao) &&
      (q === '' ||
        l.usuarioNome.toLowerCase().includes(q) ||
        l.entidadeAfetada.toLowerCase().includes(q) ||
        l.entidadeId.toLowerCase().includes(q))
    );
  }, [logs, busca, filtroAcao]);

  return (
    <Layout>
      {loading && (
        <LinearProgress sx={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 9999 }} />
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <HistoryIcon color="primary" />
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Auditoria</Typography>
        <Chip label={logs.length} size="small" color="primary" />
      </Box>

      {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          sx={{ flex: '2 1 280px' }}
          placeholder="Buscar por usuário, entidade ou ID..."
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
        <FormControl sx={{ flex: '1 1 200px' }}>
          <InputLabel>Ação</InputLabel>
          <Select value={filtroAcao} label="Ação" onChange={(e) => setFiltroAcao(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            {acoesDisponiveis.map(a => (
              <MenuItem key={a} value={a}>{acaoLabels[a] ?? a}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Card sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Data/Hora</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Usuário</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Ação</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Entidade</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID da Entidade</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Detalhes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      <HistoryIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography variant="body2">Nenhum registro encontrado</Typography>
                    </TableCell>
                  </TableRow>
                ) : filtrados.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(log.dataHora).toLocaleDateString('pt-BR')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </TableCell>
                    <TableCell>{log.usuarioNome}</TableCell>
                    <TableCell>
                      <Chip
                        label={acaoLabels[log.acao] ?? log.acao}
                        size="small"
                        sx={{ bgcolor: acaoCores[log.acao] ?? '#1976d2', color: 'white', fontWeight: 500, fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell>{log.entidadeAfetada}</TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                        {log.entidadeId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {log.detalhes ?? '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Layout>
  );
}