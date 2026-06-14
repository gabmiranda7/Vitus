import { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, MenuItem, Select, FormControl, InputLabel, LinearProgress,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  Pagination
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TodayIcon from '@mui/icons-material/Today';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
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

const POR_PAGINA = 10;

function dataHoraCompleta(data: string) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

function aplicarMascaraData(valor: string): string {
  const digits = valor.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDataBr(valor: string): Date | null {
  const match = valor.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const dia = Number(match[1]);
  const mes = Number(match[2]);
  const ano = Number(match[3]);

  const data = new Date(ano, mes - 1, dia);
  if (data.getDate() !== dia || data.getMonth() !== mes - 1 || data.getFullYear() !== ano) {
    return null;
  }
  return data;
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroAcao, setFiltroAcao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [logSelecionado, setLogSelecionado] = useState<AuditoriaLog | null>(null);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};

      const inicio = parseDataBr(dataInicio);
      if (inicio) {
        params.dataInicio = inicio.toISOString();
      }

      const fim = parseDataBr(dataFim);
      if (fim) {
        fim.setHours(23, 59, 59, 999);
        params.dataFim = fim.toISOString();
      }

      const r = await api.get('/api/auditoria', { params });
      setLogs(r.data);
      setPagina(1);
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

  // --- Estatísticas ---
  const hoje = new Date().toDateString();
  const logsHoje = logs.filter(l => new Date(l.dataHora).toDateString() === hoje).length;
  const usuariosUnicos = new Set(logs.map(l => l.usuarioId)).size;
  const acaoMaisFrequente = useMemo(() => {
    if (logs.length === 0) return null;
    const contagem: Record<string, number> = {};
    logs.forEach(l => { contagem[l.acao] = (contagem[l.acao] ?? 0) + 1; });
    const [acao] = Object.entries(contagem).sort((a, b) => b[1] - a[1])[0];
    return acao;
  }, [logs]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = filtrados.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA);

  const statCards = [
    { label: 'Total de Registros', valor: logs.length, icon: <HistoryIcon />, cor: '#1976d2' },
    { label: 'Hoje', valor: logsHoje, icon: <TodayIcon />, cor: '#2e7d32' },
    { label: 'Usuários Únicos', valor: usuariosUnicos, icon: <PeopleIcon />, cor: '#6a1b9a' },
    {
      label: 'Ação Mais Frequente',
      valor: acaoMaisFrequente ? (acaoLabels[acaoMaisFrequente] ?? acaoMaisFrequente) : '—',
      icon: <TrendingUpIcon />, cor: '#ed6c02', texto: true
    },
  ];

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

      {/* Cards de resumo */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {statCards.map((s) => (
          <Box key={s.label} sx={{ flex: '1 1 180px' }}>
            <Card sx={{ borderRadius: 3, borderTop: `4px solid ${s.cor}` }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${s.cor}18`, color: s.cor, display: 'flex' }}>
                    {s.icon}
                  </Box>
                  <Typography variant={s.texto ? 'body2' : 'h4'} sx={{ fontWeight: 800, color: s.cor, textAlign: 'right' }}>
                    {s.valor}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{s.label}</Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'flex-end' }}>
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
        <TextField
          label="De"
          placeholder="dd/mm/aaaa"
          value={dataInicio}
          onChange={(e) => setDataInicio(aplicarMascaraData(e.target.value))}
          sx={{ flex: '1 1 150px' }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          label="Até"
          placeholder="dd/mm/aaaa"
          value={dataFim}
          onChange={(e) => setDataFim(aplicarMascaraData(e.target.value))}
          sx={{ flex: '1 1 150px' }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button variant="contained" onClick={carregar} sx={{ height: 56 }}>
          Filtrar
        </Button>
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
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginaAtual.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      <HistoryIcon sx={{ fontSize: 48, opacity: 0.2, mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography variant="body2">Nenhum registro encontrado</Typography>
                    </TableCell>
                  </TableRow>
                ) : paginaAtual.map((log) => (
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
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => setLogSelecionado(log)}
                      >
                        Ver detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPaginas > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Pagination
                count={totalPaginas}
                page={pagina}
                onChange={(_, p) => setPagina(p)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalhes */}
      <Dialog open={!!logSelecionado} onClose={() => setLogSelecionado(null)} fullWidth maxWidth="sm">
        {logSelecionado && (
          <>
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon />
                Detalhes do Registro
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  { label: 'Ação', value: acaoLabels[logSelecionado.acao] ?? logSelecionado.acao },
                  { label: 'Data/Hora', value: dataHoraCompleta(logSelecionado.dataHora) },
                  { label: 'Usuário', value: logSelecionado.usuarioNome },
                  { label: 'ID do Usuário', value: logSelecionado.usuarioId, mono: true },
                  { label: 'Entidade Afetada', value: logSelecionado.entidadeAfetada },
                  { label: 'ID da Entidade', value: logSelecionado.entidadeId, mono: true },
                  { label: 'ID do Log', value: logSelecionado.id, mono: true },
                ].map((item, i, arr) => (
                  <Box key={item.label} sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    py: 1.25, gap: 2,
                    borderBottom: i < arr.length - 1 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}>
                    <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 600, fontFamily: item.mono ? 'monospace' : 'inherit', textAlign: 'right' }}
                    >
                      {item.value}
                    </Typography>
                  </Box>
                ))}

                {logSelecionado.detalhes && (
                  <Box sx={{ mt: 2 }}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      Detalhes adicionais
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {logSelecionado.detalhes}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setLogSelecionado(null)} variant="outlined">Fechar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Layout>
  );
}