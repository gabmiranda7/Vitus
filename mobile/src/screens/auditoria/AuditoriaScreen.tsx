import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Searchbar,
  ActivityIndicator,
  Chip,
  Divider,
  IconButton,
  Button,
  Snackbar,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import api from '../../services/api';
import { AuditoriaLog } from '../../types';
import { cores } from '../../theme';
import { acaoIcones, acaoCores, acaoLabel } from '../../utils/auditoria';

type PeriodoFiltro = 'todos' | 'hoje' | '7dias' | 'mes';
const TAMANHO_PAGINA = 20;

function escaparHtml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function AuditoriaScreen() {
  const theme = useTheme();
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [erro, setErro] = useState('');
  const [copiadoMsg, setCopiadoMsg] = useState('');

  const [busca, setBusca] = useState('');
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('todos');
  const [filtroAcao, setFiltroAcao] = useState('');
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [limiteExibido, setLimiteExibido] = useState(TAMANHO_PAGINA);

  useEffect(() => {
    carregar();
  }, []);

  // Reseta a paginação sempre que os filtros mudarem
  useEffect(() => {
    setLimiteExibido(TAMANHO_PAGINA);
  }, [busca, periodo, filtroAcao]);

  async function carregar() {
    try {
      const response = await api.get('/api/auditoria');
      setLogs(response.data);
      setErro('');
    } catch {
      setErro('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    carregar();
  }

  function alternarExpansao(id: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandidoId(prev => (prev === id ? null : id));
  }

  function alternarFiltros() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFiltrosAbertos(prev => !prev);
  }

  function limparFiltros() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setBusca('');
    setPeriodo('todos');
    setFiltroAcao('');
  }

  async function copiarId(label: string, valor: string) {
    await Clipboard.setStringAsync(valor);
    setCopiadoMsg(`${label} copiado para a área de transferência!`);
  }

  const logsOrdenados = useMemo(
    () => [...logs].sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime()),
    [logs]
  );

  const acoesDisponiveis = useMemo(
    () => [...new Set(logs.map(l => l.acao))].sort(),
    [logs]
  );

  const filtrados = useMemo(() => {
    const q = busca.toLowerCase();
    const agora = new Date();
    const hojeStr = agora.toDateString();

    return logsOrdenados.filter(log => {
      if (filtroAcao && log.acao !== filtroAcao) return false;

      if (periodo !== 'todos') {
        const dataLog = new Date(log.dataHora);
        if (periodo === 'hoje' && dataLog.toDateString() !== hojeStr) return false;
        if (periodo === '7dias') {
          const limite = new Date(agora);
          limite.setDate(agora.getDate() - 7);
          if (dataLog < limite) return false;
        }
        if (periodo === 'mes') {
          if (
            dataLog.getMonth() !== agora.getMonth() ||
            dataLog.getFullYear() !== agora.getFullYear()
          ) {
            return false;
          }
        }
      }

      if (!q) return true;
      return (
        log.usuarioNome.toLowerCase().includes(q) ||
        log.entidadeAfetada.toLowerCase().includes(q) ||
        log.entidadeId.toLowerCase().includes(q) ||
        (acaoLabel[log.acao] ?? log.acao).toLowerCase().includes(q)
      );
    });
  }, [logsOrdenados, busca, periodo, filtroAcao]);

  const visiveis = useMemo(
    () => filtrados.slice(0, limiteExibido),
    [filtrados, limiteExibido]
  );

  const hojeStr = new Date().toDateString();
  const logsHoje = logs.filter(l => new Date(l.dataHora).toDateString() === hojeStr).length;
  const usuariosUnicos = new Set(logs.map(l => l.usuarioId)).size;

  const qtdFiltrosAtivos = (periodo !== 'todos' ? 1 : 0) + (filtroAcao ? 1 : 0);
  const temAlgumFiltro = Boolean(busca || qtdFiltrosAtivos > 0);

  async function exportarRelatorio() {
    if (filtrados.length === 0) return;
    setExportando(true);
    try {
      const emitidoEm = new Date().toLocaleString('pt-BR');
      const linhasHtml = filtrados
        .map((l, idx) => {
          const bg = idx % 2 === 0 ? '#ffffff' : '#f1f5f9';
          const label = acaoLabel[l.acao] ?? l.acao;
          const detalhes = (l.detalhes ?? '—').replace(/\r?\n/g, ' ');
          return `
            <tr style="background-color:${bg};height:24pt;">
              <td style="text-align:center;white-space:nowrap;">${escaparHtml(new Date(l.dataHora).toLocaleString('pt-BR'))}</td>
              <td>${escaparHtml(l.usuarioNome)}</td>
              <td style="font-weight:600;">${escaparHtml(label)}</td>
              <td style="text-align:center;">${escaparHtml(l.entidadeAfetada)}</td>
              <td style="font-family:Consolas,monospace;font-size:10pt;">${escaparHtml(l.entidadeId)}</td>
              <td>${escaparHtml(detalhes)}</td>
            </tr>
          `;
        })
        .join('');

      const html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:excel"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
            table { border-collapse: collapse; }
            th, td { border: 0.5pt solid #cbd5e1; padding: 6pt 8pt; vertical-align: middle; }
            th { background-color: #1976d2; color: #ffffff; font-weight: bold; }
            .titulo { font-size: 14pt; font-weight: bold; background-color: #e2e8f0; }
            .subtitulo { font-size: 10pt; color: #334155; background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <table>
            <col width="145" /><col width="190" /><col width="195" />
            <col width="130" /><col width="275" /><col width="340" />
            <tr style="height:28pt;"><td colspan="6" class="titulo">Relatório de Auditoria — Sistema Vitus</td></tr>
            <tr style="height:22pt;"><td colspan="6" class="subtitulo">Emitido em: ${escaparHtml(emitidoEm)} | Registros: ${filtrados.length}</td></tr>
            <tr style="height:26pt;">
              <th>Data / Hora</th><th>Usuário</th><th>Ação</th>
              <th>Entidade Afetada</th><th>ID da Entidade</th><th>Detalhes</th>
            </tr>
            ${linhasHtml}
          </table>
        </body>
        </html>
      `;

      const nomeArquivo = `auditoria_vitus_${new Date().toISOString().slice(0, 10)}.xls`;
      const caminho = FileSystem.cacheDirectory + nomeArquivo;

      await FileSystem.writeAsStringAsync(caminho, '\uFEFF' + html, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(caminho, {
          mimeType: 'application/vnd.ms-excel',
          dialogTitle: 'Exportar Auditoria Vitus',
        });
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível exportar o relatório.');
    } finally {
      setExportando(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (erro) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro}>{erro}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra superior: Busca + Exportar */}
      <View style={styles.topBar}>
        <Searchbar
          placeholder="Buscar usuário, ação ou ID..."
          value={busca}
          onChangeText={setBusca}
          style={styles.busca}
        />
        <IconButton
          icon="microsoft-excel"
          mode="contained-tonal"
          size={24}
          onPress={exportarRelatorio}
          disabled={exportando || filtrados.length === 0}
          loading={exportando}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.conteudo}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Cards compactos de resumo */}
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { borderLeftColor: cores.primaria }]}>
            <Card.Content style={styles.statContent}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Total</Text>
              <Text variant="titleMedium" style={[styles.statValor, { color: cores.primaria }]}>{logs.length}</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { borderLeftColor: cores.sucesso }]}>
            <Card.Content style={styles.statContent}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Hoje</Text>
              <Text variant="titleMedium" style={[styles.statValor, { color: cores.sucesso }]}>{logsHoje}</Text>
            </Card.Content>
          </Card>

          <Card style={[styles.statCard, { borderLeftColor: cores.secundaria }]}>
            <Card.Content style={styles.statContent}>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Usuários</Text>
              <Text variant="titleMedium" style={[styles.statValor, { color: cores.secundaria }]}>{usuariosUnicos}</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Barra de controle dos filtros minimizáveis */}
        <View style={styles.filtroHeaderRow}>
          <TouchableOpacity
            onPress={alternarFiltros}
            activeOpacity={0.7}
            style={[
              styles.filtroToggleBtn,
              {
                backgroundColor:
                  filtrosAbertos || qtdFiltrosAtivos > 0
                    ? theme.colors.secondaryContainer
                    : theme.colors.surfaceVariant,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={18}
              color={
                filtrosAbertos || qtdFiltrosAtivos > 0
                  ? theme.colors.onSecondaryContainer
                  : theme.colors.onSurfaceVariant
              }
            />
            <Text
              variant="labelMedium"
              style={{
                fontWeight: '700',
                color:
                  filtrosAbertos || qtdFiltrosAtivos > 0
                    ? theme.colors.onSecondaryContainer
                    : theme.colors.onSurfaceVariant,
              }}
            >
              Filtros{qtdFiltrosAtivos > 0 ? ` (${qtdFiltrosAtivos})` : ''}
            </Text>
            <MaterialCommunityIcons
              name={filtrosAbertos ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={
                filtrosAbertos || qtdFiltrosAtivos > 0
                  ? theme.colors.onSecondaryContainer
                  : theme.colors.onSurfaceVariant
              }
            />
          </TouchableOpacity>

          <View style={styles.filtroHeaderDireita}>
            {temAlgumFiltro && (
              <Button compact onPress={limparFiltros} icon="close" textColor={cores.erro}>
                Limpar
              </Button>
            )}
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {visiveis.length} de {filtrados.length}
            </Text>
          </View>
        </View>

        {/* Painel expansível de filtros */}
        {filtrosAbertos && (
          <Card style={styles.filtroCard}>
            <Card.Content style={styles.filtroCardContent}>
              <Text variant="labelSmall" style={[styles.filtroSecaoLabel, { color: theme.colors.onSurfaceVariant }]}>
                Período
              </Text>
              <View style={styles.chipsWrap}>
                {(
                  [
                    { key: 'todos', label: 'Todos' },
                    { key: 'hoje', label: 'Hoje' },
                    { key: '7dias', label: '7 dias' },
                    { key: 'mes', label: 'Este mês' },
                  ] as const
                ).map((item) => (
                  <Chip
                    key={item.key}
                    compact
                    selected={periodo === item.key}
                    onPress={() => setPeriodo(item.key)}
                    textStyle={styles.chipTexto}
                  >
                    {item.label}
                  </Chip>
                ))}
              </View>

              {acoesDisponiveis.length > 0 && (
                <>
                  <Divider style={styles.filtroDivider} />
                  <Text variant="labelSmall" style={[styles.filtroSecaoLabel, { color: theme.colors.onSurfaceVariant }]}>
                    Tipo de Ação
                  </Text>
                  <View style={styles.chipsWrap}>
                    <Chip
                      compact
                      selected={filtroAcao === ''}
                      onPress={() => setFiltroAcao('')}
                      textStyle={styles.chipTexto}
                    >
                      Todas
                    </Chip>
                    {acoesDisponiveis.map((a) => (
                      <Chip
                        key={a}
                        compact
                        selected={filtroAcao === a}
                        onPress={() => setFiltroAcao(filtroAcao === a ? '' : a)}
                        textStyle={styles.chipTexto}
                      >
                        {acaoLabel[a] ?? a}
                      </Chip>
                    ))}
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Lista paginada de logs */}
        {visiveis.length === 0 ? (
          <Text style={[styles.textoVazio, { color: theme.colors.onSurfaceVariant }]}>
            {temAlgumFiltro ? 'Nenhum registro encontrado com os filtros atuais' : 'Nenhum registro de auditoria'}
          </Text>
        ) : (
          <>
            {visiveis.map((log) => {
              const cor = acaoCores[log.acao] ?? cores.textoSecundario;
              const icone = acaoIcones[log.acao] ?? 'information';
              const label = acaoLabel[log.acao] ?? log.acao;
              const expandido = expandidoId === log.id;

              return (
                <TouchableOpacity key={log.id} onPress={() => alternarExpansao(log.id)} activeOpacity={0.7}>
                  <Card style={[styles.card, { borderLeftColor: cor, borderLeftWidth: 4 }]}>
                    <Card.Content>
                      <View style={styles.cardContent}>
                        <MaterialCommunityIcons name={icone as any} size={24} color={cor} style={styles.icone} />
                        <View style={styles.info}>
                          <View style={styles.tituloRow}>
                            <Text variant="titleSmall" style={styles.titulo}>{label}</Text>
                            <MaterialCommunityIcons
                              name={expandido ? 'chevron-up' : 'chevron-down'}
                              size={20}
                              color={theme.colors.onSurfaceVariant}
                            />
                          </View>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                            {log.usuarioNome} · {log.entidadeAfetada}
                          </Text>
                          <Text variant="bodySmall" style={[styles.data, { color: theme.colors.onSurfaceVariant }]}>
                            {new Date(log.dataHora).toLocaleString('pt-BR')}
                          </Text>
                        </View>
                      </View>

                      {expandido && (
                        <View style={styles.detalhes}>
                          <Divider style={styles.divider} />
                          <View style={styles.detalheLinha}>
                            <Text variant="bodySmall" style={[styles.detalheLabel, { color: theme.colors.onSurfaceVariant }]}>
                              Ação
                            </Text>
                            <Chip
                              compact
                              style={{ backgroundColor: cor + (theme.dark ? '33' : '20') }}
                              textStyle={[styles.chipTexto, { color: theme.dark ? '#e8eef5' : cor }]}
                            >
                              {log.acao}
                            </Chip>
                          </View>
                          <View style={styles.detalheLinha}>
                            <Text variant="bodySmall" style={[styles.detalheLabel, { color: theme.colors.onSurfaceVariant }]}>
                              Entidade Afetada
                            </Text>
                            <Text variant="bodySmall" style={styles.detalheValor}>{log.entidadeAfetada}</Text>
                          </View>

                          {/* ID da Entidade clicável para copiar */}
                          <TouchableOpacity
                            onPress={() => copiarId('ID da Entidade', log.entidadeId)}
                            activeOpacity={0.6}
                            style={styles.detalheLinha}
                          >
                            <Text variant="bodySmall" style={[styles.detalheLabel, { color: theme.colors.onSurfaceVariant }]}>
                              ID da Entidade
                            </Text>
                            <View style={styles.copyRow}>
                              <Text
                                variant="bodySmall"
                                style={[styles.detalheValorMono, { color: theme.colors.onSurfaceVariant }]}
                                numberOfLines={1}
                              >
                                {log.entidadeId}
                              </Text>
                              <MaterialCommunityIcons
                                name="content-copy"
                                size={14}
                                color={cores.primaria}
                                style={{ marginLeft: 6 }}
                              />
                            </View>
                          </TouchableOpacity>

                          <View style={styles.detalheLinha}>
                            <Text variant="bodySmall" style={[styles.detalheLabel, { color: theme.colors.onSurfaceVariant }]}>
                              Usuário
                            </Text>
                            <Text variant="bodySmall" style={styles.detalheValor}>{log.usuarioNome}</Text>
                          </View>

                          {/* ID do Usuário clicável para copiar */}
                          <TouchableOpacity
                            onPress={() => copiarId('ID do Usuário', log.usuarioId)}
                            activeOpacity={0.6}
                            style={styles.detalheLinha}
                          >
                            <Text variant="bodySmall" style={[styles.detalheLabel, { color: theme.colors.onSurfaceVariant }]}>
                              ID do Usuário
                            </Text>
                            <View style={styles.copyRow}>
                              <Text
                                variant="bodySmall"
                                style={[styles.detalheValorMono, { color: theme.colors.onSurfaceVariant }]}
                                numberOfLines={1}
                              >
                                {log.usuarioId}
                              </Text>
                              <MaterialCommunityIcons
                                name="content-copy"
                                size={14}
                                color={cores.primaria}
                                style={{ marginLeft: 6 }}
                              />
                            </View>
                          </TouchableOpacity>

                          <View style={styles.detalheLinha}>
                            <Text variant="bodySmall" style={[styles.detalheLabel, { color: theme.colors.onSurfaceVariant }]}>
                              Data e Hora
                            </Text>
                            <Text variant="bodySmall" style={styles.detalheValor}>
                              {new Date(log.dataHora).toLocaleString('pt-BR', {
                                dateStyle: 'long',
                                timeStyle: 'medium',
                              })}
                            </Text>
                          </View>
                          {log.detalhes && (
                            <View style={styles.detalhesTexto}>
                              <Text variant="bodySmall" style={[styles.detalheLabel, { color: theme.colors.onSurfaceVariant }]}>
                                Detalhes
                              </Text>
                              <Text
                                variant="bodySmall"
                                style={[
                                  styles.detalheTextoLivre,
                                  {
                                    backgroundColor: theme.colors.surfaceVariant,
                                    color: theme.colors.onSurfaceVariant,
                                  },
                                ]}
                              >
                                {log.detalhes}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              );
            })}

            {/* Botão de paginação progressiva */}
            {visiveis.length < filtrados.length && (
              <Button
                mode="outlined"
                icon="chevron-down"
                onPress={() => setLimiteExibido(prev => prev + TAMANHO_PAGINA)}
                style={styles.carregarMaisBtn}
              >
                Carregar mais ({filtrados.length - visiveis.length} restantes)
              </Button>
            )}
          </>
        )}
      </ScrollView>

      <Snackbar
        visible={!!copiadoMsg}
        onDismiss={() => setCopiadoMsg('')}
        duration={2000}
      >
        {copiadoMsg}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 6,
  },
  busca: { flex: 1 },
  conteudo: { padding: 16, paddingTop: 6, paddingBottom: 32 },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 10, borderLeftWidth: 4 },
  statContent: { paddingVertical: 8, paddingHorizontal: 10 },
  statValor: { fontWeight: '800', marginTop: 2 },

  filtroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  filtroToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  filtroHeaderDireita: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filtroCard: {
    borderRadius: 12,
    marginBottom: 12,
  },
  filtroCardContent: {
    paddingVertical: 12,
  },
  filtroSecaoLabel: {
    fontWeight: '700',
    marginBottom: 8,
  },
  filtroDivider: {
    marginVertical: 10,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipTexto: { fontSize: 12, lineHeight: 16, marginVertical: 2 },

  card: { marginBottom: 10, borderRadius: 12 },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
  icone: { marginRight: 12, marginTop: 2 },
  info: { flex: 1 },
  tituloRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontWeight: '600' },
  data: { marginTop: 2, fontSize: 11 },
  textoVazio: { textAlign: 'center', marginTop: 40 },
  erro: { color: cores.erro },

  detalhes: { marginTop: 4 },
  divider: { marginVertical: 10 },
  detalheLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 12,
  },
  detalheLabel: { fontWeight: '600' },
  detalheValor: { fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  copyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    maxWidth: '62%',
  },
  detalheValorMono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    flexShrink: 1,
    textAlign: 'right',
  },
  detalhesTexto: { marginTop: 8 },
  detalheTextoLivre: {
    marginTop: 4,
    padding: 10,
    borderRadius: 8,
  },
  carregarMaisBtn: {
    marginTop: 6,
    borderRadius: 10,
  },
});