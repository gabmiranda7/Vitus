import { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Alert, MenuItem, Select, FormControl, InputLabel, LinearProgress,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  Pagination, IconButton, Tooltip
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TodayIcon from '@mui/icons-material/Today';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import DownloadIcon from '@mui/icons-material/Download';
import ClearIcon from '@mui/icons-material/Clear';
import ExcelJS from 'exceljs';
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
  RegistroExame: 'Registro de Exame',
  AnexoExame: 'Anexo de Arquivo em Exame',
  DownloadExame: 'Download de Arquivo de Exame',
  AprovacaoCadastro: 'Aprovação de Cadastro',
  RecusaCadastro: 'Recusa de Cadastro',
  AtualizacaoPerfil: 'Atualização de Perfil',
  LoginSucesso: 'Login Realizado',
  LoginFalha: 'Falha no Login',
  AnaliseIaExame: 'Análise de Exame por IA',
  AnotacaoClinica: 'Anotação Clínica',
  InicioAtendimento: 'Início de Atendimento',
  FinalizacaoConsulta: 'Finalização de Consulta'
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
  RegistroExame: '#00796b',
  AnexoExame: '#0097a7',
  DownloadExame: '#455a64',
  AprovacaoCadastro: '#388e3c',
  RecusaCadastro: '#c62828',
  AtualizacaoPerfil: '#00838f',
  LoginSucesso: '#2e7d32',
  LoginFalha: '#d32f2f',
  AnaliseIaExame: '#7b1fa2',
  AnotacaoClinica: '#0277bd',
  InicioAtendimento: '#6a1b9a',
  FinalizacaoConsulta: '#2e7d32'
};

const POR_PAGINA = 10;

function dataHoraCompleta(data: string) {
  return new Date(data).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

function formatarDataBr(data: Date): string {
  const d = String(data.getDate()).padStart(2, '0');
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const a = data.getFullYear();
  return `${d}/${m}/${a}`;
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

function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  const [copiadoCampo, setCopiadoCampo] = useState<string | null>(null);

  useEffect(() => { carregar(); }, []);
  useEffect(() => { setPagina(1); }, [busca, filtroAcao]);

  const inicioInvalida = dataInicio.length === 10 && !parseDataBr(dataInicio);
  const fimInvalida = dataFim.length === 10 && !parseDataBr(dataFim);

  async function carregar(overrideInicio?: string, overrideFim?: string) {
    const iniStr = overrideInicio !== undefined ? overrideInicio : dataInicio;
    const fimStr = overrideFim !== undefined ? overrideFim : dataFim;

    if ((iniStr && !parseDataBr(iniStr)) || (fimStr && !parseDataBr(fimStr))) {
      setErro('Informe datas válidas no formato dd/mm/aaaa.');
      return;
    }

    setErro('');
    setLoading(true);
    try {
      const params: Record<string, string> = {};

      const inicio = parseDataBr(iniStr);
      if (inicio) params.dataInicio = inicio.toISOString();

      const fim = parseDataBr(fimStr);
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

  function aplicarAtalhoPeriodo(diasAtras: number | 'mes') {
    const agora = new Date();
    const inicio = new Date(agora);
    if (diasAtras === 'mes') {
      inicio.setDate(1);
    } else {
      inicio.setDate(agora.getDate() - diasAtras);
    }
    const iniStr = formatarDataBr(inicio);
    const fimStr = formatarDataBr(agora);
    setDataInicio(iniStr);
    setDataFim(fimStr);
    carregar(iniStr, fimStr);
  }

  function limparFiltros() {
    setBusca('');
    setFiltroAcao('');
    setDataInicio('');
    setDataFim('');
    carregar('', '');
  }

async function exportarPlanilha() {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Sistema Vitus';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Auditoria Vitus', {
      views: [{ state: 'frozen', ySplit: 4 }], // Congela título, subtítulo e cabeçalho
    });

    const emitidoEm = dataHoraCompleta(new Date().toISOString());
    const periodoTexto = dataInicio || dataFim
      ? `${dataInicio || 'Início'} até ${dataFim || 'Hoje'}`
      : 'Todos os períodos';

    // Linha 1: Título
    sheet.mergeCells('A1:F1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'Relatório de Auditoria — Sistema Vitus';
    titleCell.font = { name: 'Calibri', size: 15, bold: true, color: { argb: 'FF0F172A' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet.getRow(1).height = 28;

    // Linha 2: Metadados do filtro
    sheet.mergeCells('A2:F2');
    const subCell = sheet.getCell('A2');
    subCell.value = `Emitido em: ${emitidoEm}   |   Período: ${periodoTexto}   |   Registros: ${filtrados.length}`;
    subCell.font = { name: 'Calibri', size: 10, color: { argb: 'FF475569' } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
    subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    sheet.getRow(2).height = 22;

    // Linha 3: Espaço em branco
    sheet.getRow(3).height = 8;

    // Definição das colunas
    sheet.columns = [
      { key: 'dataHora', width: 22 },
      { key: 'usuario', width: 28 },
      { key: 'acao', width: 28 },
      { key: 'entidade', width: 20 },
      { key: 'entidadeId', width: 38 },
      { key: 'detalhes', width: 52 },
    ];

    // Linha 4: Cabeçalho da tabela
    const headerRow = sheet.getRow(4);
    headerRow.values = ['Data / Hora', 'Usuário', 'Ação', 'Entidade Afetada', 'ID da Entidade', 'Detalhes'];
    headerRow.height = 26;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1976D2' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF1565C0' } },
        bottom: { style: 'medium', color: { argb: 'FF0D47A1' } },
        left: { style: 'thin', color: { argb: 'FF1565C0' } },
        right: { style: 'thin', color: { argb: 'FF1565C0' } },
      };
    });

    // Filtro automático no cabeçalho
    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4, column: 6 },
    };

    // Linhas de dados
    filtrados.forEach((l, idx) => {
      const detalhesTexto = (l.detalhes ?? '—').replace(/\r?\n/g, ' ');
      const row = sheet.addRow({
        dataHora: dataHoraCompleta(l.dataHora),
        usuario: l.usuarioNome,
        acao: acaoLabels[l.acao] ?? l.acao,
        entidade: l.entidadeAfetada,
        entidadeId: l.entidadeId,
        detalhes: detalhesTexto,
      });

      // Ajusta altura automaticamente se o texto de detalhes for longo
      const linhasEstimadas = Math.max(1, Math.ceil(detalhesTexto.length / 48));
      row.height = Math.max(22, linhasEstimadas * 16);

      const bgColor = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';

      row.eachCell((cell, colNumber) => {
        cell.font = {
          name: colNumber === 5 ? 'Consolas' : 'Calibri',
          size: colNumber === 5 ? 10 : 11,
          bold: colNumber === 3,
          color: { argb: colNumber === 5 ? 'FF475569' : 'FF1E293B' },
        };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber === 1 || colNumber === 4 ? 'center' : 'left',
          wrapText: colNumber === 6,
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria_vitus_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copiarTexto(campo: string, valor: string) {
    navigator.clipboard.writeText(valor);
    setCopiadoCampo(campo);
    setTimeout(() => setCopiadoCampo(null), 1500);
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
  const temFiltroAtivo = Boolean(busca || filtroAcao || dataInicio || dataFim);

  const statCards = [
    { label: 'Total de Registros', valor: logs.length, icon: <HistoryIcon fontSize="small" />, cor: '#1976d2' },
    { label: 'Hoje', valor: logsHoje, icon: <TodayIcon fontSize="small" />, cor: '#2e7d32' },
    { label: 'Usuários Únicos', valor: usuariosUnicos, icon: <PeopleIcon fontSize="small" />, cor: '#6a1b9a' },
    {
      label: 'Ação Mais Frequente',
      valor: acaoMaisFrequente ? (acaoLabels[acaoMaisFrequente] ?? acaoMaisFrequente) : '—',
      icon: <TrendingUpIcon fontSize="small" />, cor: '#ed6c02', texto: true
    },
  ];

  return (
    <Layout>
      {loading && (
        <LinearProgress sx={{ position: 'fixed', top: 64, left: 0, right: 0, zIndex: 9999 }} />
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Auditoria</Typography>
          <Chip label={`${filtrados.length} de ${logs.length}`} size="small" color="primary" />
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={exportarPlanilha}
          disabled={filtrados.length === 0}
        >
          Exportar Excel
        </Button>
      </Box>

      {erro && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>{erro}</Alert>}

      {/* Cards de resumo compactos */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
        {statCards.map((s) => (
          <Box key={s.label} sx={{ flex: '1 1 170px' }}>
            <Card sx={{ borderRadius: 2, borderLeft: `4px solid ${s.cor}` }}>
              <CardContent sx={{ py: 1.25, px: 1.75, '&:last-child': { pb: 1.25 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <Box sx={{ p: 0.75, borderRadius: 1.5, bgcolor: `${s.cor}18`, color: s.cor, display: 'flex', flexShrink: 0 }}>
                    {s.icon}
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }} noWrap>
                      {s.label}
                    </Typography>
                    <Typography
                      variant={s.texto ? 'body2' : 'h6'}
                      sx={{ fontWeight: 800, color: s.cor, lineHeight: 1.25, mt: 0.25 }}
                      noWrap
                    >
                      {s.valor}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Atalhos rápidos de período */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          Período rápido:
        </Typography>
        <Chip label="Hoje" size="small" variant="outlined" onClick={() => aplicarAtalhoPeriodo(0)} />
        <Chip label="Últimos 7 dias" size="small" variant="outlined" onClick={() => aplicarAtalhoPeriodo(7)} />
        <Chip label="Este mês" size="small" variant="outlined" onClick={() => aplicarAtalhoPeriodo('mes')} />
        {temFiltroAtivo && (
          <Chip
            label="Limpar filtros"
            size="small"
            color="default"
            icon={<ClearIcon />}
            onClick={limparFiltros}
          />
        )}
      </Box>

      {/* Filtros */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <TextField
          size="small"
          sx={{ flex: '2 1 260px' }}
          placeholder="Buscar por usuário, entidade ou ID..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start"><SearchIcon color="action" fontSize="small" /></InputAdornment>
              )
            }
          }}
        />
        <FormControl size="small" sx={{ flex: '1 1 190px' }}>
          <InputLabel>Ação</InputLabel>
          <Select value={filtroAcao} label="Ação" onChange={(e) => setFiltroAcao(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            {acoesDisponiveis.map(a => (
              <MenuItem key={a} value={a}>{acaoLabels[a] ?? a}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="De"
          placeholder="dd/mm/aaaa"
          value={dataInicio}
          error={inicioInvalida}
          helperText={inicioInvalida ? 'Data inválida' : undefined}
          onChange={(e) => setDataInicio(aplicarMascaraData(e.target.value))}
          sx={{ flex: '1 1 140px' }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          size="small"
          label="Até"
          placeholder="dd/mm/aaaa"
          value={dataFim}
          error={fimInvalida}
          helperText={fimInvalida ? 'Data inválida' : undefined}
          onChange={(e) => setDataFim(aplicarMascaraData(e.target.value))}
          sx={{ flex: '1 1 140px' }}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <Button variant="contained" onClick={() => carregar()} sx={{ height: 40 }}>
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
                        {new Date(log.dataHora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, fontFamily: item.mono ? 'monospace' : 'inherit', textAlign: 'right', wordBreak: 'break-all' }}
                      >
                        {item.value}
                      </Typography>
                      {item.mono && (
                        <Tooltip title={copiadoCampo === item.label ? 'Copiado!' : 'Copiar ID'}>
                          <IconButton size="small" onClick={() => copiarTexto(item.label, item.value)}>
                            {copiadoCampo === item.label
                              ? <CheckIcon fontSize="inherit" color="success" />
                              : <ContentCopyIcon fontSize="inherit" />}
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
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