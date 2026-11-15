import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Text,
  Card,
  ActivityIndicator,
  Divider,
  Chip,
  Avatar,
  SegmentedButtons,
  useTheme,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import api from '../../services/api';
import { Consulta, Prontuario, Receita } from '../../types';
import { cores, iniciais, corAvatar } from '../../theme';
import { situacaoVencimento, dataVencimentoBr, capitalizar } from '../../utils/vencimento';

interface MedicamentoAgrupado {
  chave: string;
  nome: string;
  dosagem?: string;
  posologia?: string;
  quantidade?: string;
  vezes: number;
  datas: string[];
}

function dataDaReceita(r: Receita, consulta?: Consulta): Date {
  const d = new Date(r.dataEmissao);
  if (d.getFullYear() < 2000 && consulta) return new Date(consulta.dataConsulta);
  return d;
}

export default function HistoricoReceitasScreen() {
  const route = useRoute<any>();
  const theme = useTheme();
  const { pacienteId, nomePaciente } = route.params;

  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [modo, setModo] = useState<'receitas' | 'medicamentos'>('receitas');
  const [tratamentosAbertos, setTratamentosAbertos] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const response = await api.get(`/api/prontuarios/paciente/${pacienteId}`);
      setProntuario(response.data);
    } catch {
      setErro('Erro ao carregar receitas');
    } finally {
      setLoading(false);
    }
  }

  const receitas = useMemo(() => {
    if (!prontuario) return [];
    return prontuario.receitas
      .map(r => {
        const consulta = prontuario.consultas.find(c => c.id === r.consultaId);
        return { receita: r, consulta, data: dataDaReceita(r, consulta) };
      })
      .sort((a, b) => b.data.getTime() - a.data.getTime());
  }, [prontuario]);

  const medicamentosAgrupados = useMemo(() => {
    const mapa = new Map<string, MedicamentoAgrupado>();

    for (const { receita, data } of receitas) {
      const dataStr = data.toLocaleDateString('pt-BR');
      for (const m of receita.medicamentos) {
        const chave = m.nome.trim().toLowerCase();
        const existente = mapa.get(chave);
        if (!existente) {
          mapa.set(chave, {
            chave,
            nome: m.nome.trim(),
            dosagem: m.dosagem,
            posologia: m.posologia,
            quantidade: m.quantidade,
            vezes: 1,
            datas: [dataStr],
          });
        } else {
          existente.vezes += 1;
          if (!existente.datas.includes(dataStr)) {
            existente.datas.push(dataStr);
          }
        }
      }
    }

    return Array.from(mapa.values()).sort(
      (a, b) => b.vezes - a.vezes || a.nome.localeCompare(b.nome)
    );
  }, [receitas]);

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (erro || !prontuario) {
    return (
      <View style={styles.centro}>
        <Text style={styles.erro}>{erro || 'Prontuário não encontrado'}</Text>
      </View>
    );
  }

  const tratamentos = prontuario.tratamentos ?? [];
  const nomeExibido = nomePaciente || 'Paciente';
  const subBlocoBg = theme.dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {/* Cabeçalho do Paciente */}
      <Card style={styles.cardHeaderPaciente}>
        <Card.Content style={styles.headerPacienteRow}>
          <Avatar.Text
            size={46}
            label={iniciais(nomeExibido)}
            style={{ backgroundColor: corAvatar(nomeExibido) }}
          />
          <View style={styles.headerPacienteInfo}>
            <Text variant="titleMedium" style={styles.bold} numberOfLines={1}>
              {nomeExibido}
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {receitas.length} receita(s) · {medicamentosAgrupados.length} medicamento(s) distintos
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Tratamentos acompanhados (recolhível) */}
      {tratamentos.length > 0 && (
        <View style={styles.blocoTratamentos}>
          <TouchableOpacity onPress={() => setTratamentosAbertos(v => !v)} activeOpacity={0.7}>
            <Card style={[styles.cardSecao, { borderLeftColor: cores.aviso, borderLeftWidth: 4 }]}>
              <Card.Content style={styles.secaoHeader}>
                <View style={styles.secaoHeaderEsquerda}>
                  <MaterialCommunityIcons name="alarm" size={20} color={cores.aviso} />
                  <Text variant="titleSmall" style={styles.bold}>
                    Tratamentos acompanhados
                  </Text>
                  <Chip
                    compact
                    style={{ backgroundColor: theme.colors.surfaceVariant }}
                    textStyle={styles.chipTexto}
                  >
                    {tratamentos.length}
                  </Chip>
                </View>
                <MaterialCommunityIcons
                  name={tratamentosAbertos ? 'chevron-up' : 'chevron-down'}
                  size={22}
                  color={theme.colors.onSurfaceVariant}
                />
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {tratamentosAbertos && (
            <View style={styles.listaTratamentos}>
              {tratamentos.map((t) => {
                const s = situacaoVencimento(t.diasRestantes);
                return (
                  <Card
                    key={`${t.receitaId}-${t.medicamento}`}
                    style={[styles.cardTratamento, { borderLeftColor: s.cor, borderLeftWidth: 4 }]}
                  >
                    <Card.Content style={styles.cardTratamentoContent}>
                      <View style={styles.topo}>
                        <Text variant="titleSmall" style={styles.nomeTratamento}>
                          {t.medicamento}
                        </Text>
                        <Chip
                          compact
                          style={{ backgroundColor: s.cor + (theme.dark ? '33' : '20') }}
                          textStyle={[styles.chipTextoNegrito, { color: theme.dark ? '#ffb74d' : s.cor }]}
                        >
                          {capitalizar(s.label)}
                        </Chip>
                      </View>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Emitida em {new Date(t.dataEmissao).toLocaleDateString('pt-BR')} · vence em {dataVencimentoBr(t.dataVencimento)}
                      </Text>
                    </Card.Content>
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* Alternador entre Receitas e Medicamentos */}
      <SegmentedButtons
        value={modo}
        onValueChange={(v) => setModo(v as 'receitas' | 'medicamentos')}
        style={styles.segmented}
        buttons={[
          {
            value: 'receitas',
            icon: 'file-document-outline',
            label: `Por receita (${receitas.length})`,
          },
          {
            value: 'medicamentos',
            icon: 'pill',
            label: `Por medicamento (${medicamentosAgrupados.length})`,
          },
        ]}
      />

      {/* Visão 1: Por Receita */}
      {modo === 'receitas' && (
        receitas.length === 0 ? (
          <View style={styles.vazioBox}>
            <MaterialCommunityIcons name="pill" size={54} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.3 }} />
            <Text style={[styles.textoVazio, { color: theme.colors.onSurfaceVariant }]}>
              Nenhuma receita registrada
            </Text>
          </View>
        ) : (
          receitas.map(({ receita: r, consulta, data }) => (
            <Card key={r.id} style={styles.cardReceita}>
              <Card.Content>
                <View style={styles.receitaHeader}>
                  <View style={styles.receitaHeaderInfo}>
                    <View style={styles.dataLinha}>
                      <MaterialCommunityIcons name="calendar" size={15} color={theme.colors.primary} />
                      <Text variant="titleSmall" style={styles.bold}>
                        {data.toLocaleDateString('pt-BR')}
                      </Text>
                    </View>
                    {consulta && (
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                        Dr(a). {consulta.nomeMedico}
                      </Text>
                    )}
                  </View>
                  <Chip
                    compact
                    style={{ backgroundColor: cores.sucesso + (theme.dark ? '30' : '18') }}
                    textStyle={[styles.chipTextoNegrito, { color: theme.dark ? '#81c784' : cores.sucesso }]}
                  >
                    {r.medicamentos.length} {r.medicamentos.length === 1 ? 'item' : 'itens'}
                  </Chip>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.medsContainer}>
                  {r.medicamentos.map((m, i) => (
                    <View
                      key={i}
                      style={[
                        styles.medItemBox,
                        { backgroundColor: subBlocoBg, borderLeftColor: cores.sucesso },
                      ]}
                    >
                      <View style={styles.medTituloLinha}>
                        <Text variant="titleSmall" style={styles.medNome}>
                          {m.nome}{m.dosagem ? ` · ${m.dosagem}` : ''}
                        </Text>
                        {m.acompanharVencimento && m.validadeDias != null && (
                          <Chip
                            compact
                            icon="alarm"
                            style={{ backgroundColor: theme.colors.surfaceVariant }}
                            textStyle={[styles.chipTexto, { color: theme.colors.primary }]}
                          >
                            {m.validadeDias}d
                          </Chip>
                        )}
                      </View>
                      {(m.quantidade || m.posologia) && (
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                          {m.quantidade ? `${m.quantidade} — ` : ''}{m.posologia}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </Card.Content>
            </Card>
          ))
        )
      )}

      {/* Visão 2: Por Medicamento (Agrupado) */}
      {modo === 'medicamentos' && (
        medicamentosAgrupados.length === 0 ? (
          <View style={styles.vazioBox}>
            <MaterialCommunityIcons name="pill" size={54} color={theme.colors.onSurfaceVariant} style={{ opacity: 0.3 }} />
            <Text style={[styles.textoVazio, { color: theme.colors.onSurfaceVariant }]}>
              Nenhum medicamento prescrito
            </Text>
          </View>
        ) : (
          medicamentosAgrupados.map((med) => (
            <Card key={med.chave} style={[styles.cardReceita, { borderLeftColor: cores.primaria, borderLeftWidth: 4 }]}>
              <Card.Content>
                <View style={styles.topo}>
                  <Text variant="titleSmall" style={styles.nomeTratamento}>
                    {med.nome}{med.dosagem ? ` · ${med.dosagem}` : ''}
                  </Text>
                  <Chip
                    compact
                    style={{ backgroundColor: cores.primaria + (theme.dark ? '33' : '20') }}
                    textStyle={[styles.chipTextoNegrito, { color: theme.dark ? '#90caf9' : cores.primaria }]}
                  >
                    {med.vezes}x
                  </Chip>
                </View>
                {(med.quantidade || med.posologia) && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {med.quantidade ? `${med.quantidade} — ` : ''}{med.posologia}
                  </Text>
                )}
                <View style={styles.datasChipsRow}>
                  {med.datas.map((d) => (
                    <Chip
                      key={d}
                      compact
                      icon="calendar"
                      style={{ backgroundColor: theme.colors.surfaceVariant }}
                      textStyle={[styles.chipTexto, { color: theme.colors.onSurfaceVariant }]}
                    >
                      {d}
                    </Chip>
                  ))}
                </View>
              </Card.Content>
            </Card>
          ))
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  conteudo: { padding: 16, paddingBottom: 32 },
  bold: { fontWeight: 'bold' },

  chipTexto: { fontSize: 12, lineHeight: 16, marginVertical: 2 },
  chipTextoNegrito: { fontSize: 12, lineHeight: 16, fontWeight: '700', marginVertical: 2 },

  cardHeaderPaciente: { borderRadius: 14, marginBottom: 14 },
  headerPacienteRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerPacienteInfo: { flex: 1 },

  blocoTratamentos: { marginBottom: 14 },
  cardSecao: { borderRadius: 12 },
  secaoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secaoHeaderEsquerda: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listaTratamentos: { marginTop: 8, gap: 8 },
  cardTratamento: { borderRadius: 10 },
  cardTratamentoContent: { paddingVertical: 10 },

  segmented: { marginBottom: 14 },

  cardReceita: { marginBottom: 12, borderRadius: 12 },
  receitaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  receitaHeaderInfo: { flex: 1 },
  dataLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  divider: { marginVertical: 10 },

  medsContainer: { gap: 8 },
  medItemBox: {
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  medTituloLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  medNome: { fontWeight: '600', flex: 1 },

  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nomeTratamento: { fontWeight: '600', flex: 1, marginRight: 8 },
  datasChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },

  vazioBox: { alignItems: 'center', marginTop: 48 },
  textoVazio: { textAlign: 'center', marginTop: 10 },
  erro: { color: cores.erro },
});