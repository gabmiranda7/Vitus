import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Divider, Avatar, useTheme } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import api from '../../services/api';
import { Prontuario, Paciente, Consulta, Triagem, Exame, statusCores, statusLabels } from '../../types';
import { cores, iniciais } from '../../theme';
import { situacaoVencimento, dataVencimentoBr, capitalizar } from '../../utils/vencimento';

interface ConsultaAgrupada {
  consulta: Consulta;
  triagem?: Triagem;
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

const categoriaLabel: Record<string, string> = {
  Sangue: 'Sangue',
  Imagem: 'Imagem',
  Urina: 'Urina',
  Cardiologico: 'Cardiológico',
  Fisico: 'Físico',
  Outro: 'Outro',
};
const categoriaCor: Record<string, string> = {
  Sangue: cores.erro,
  Imagem: cores.primariaEscura,
  Urina: cores.aviso,
  Cardiologico: '#ad1457',
  Fisico: cores.sucesso,
  Outro: '#546e7a',
};

function agruparPorDia(consultas: Consulta[], triagens: Triagem[]) {
  const triagemPorConsulta = new Map(triagens.map(t => [t.consultaId, t]));
  const porDia = new Map<string, ConsultaAgrupada[]>();
  const ordenadas = [...consultas].sort((a, b) =>
    new Date(b.dataConsulta).getTime() - new Date(a.dataConsulta).getTime());

  for (const c of ordenadas) {
    const chave = new Date(c.dataConsulta).toLocaleDateString('pt-BR');
    if (!porDia.has(chave)) porDia.set(chave, []);
    porDia.get(chave)!.push({ consulta: c, triagem: triagemPorConsulta.get(c.id) });
  }

  return Array.from(porDia.entries()).map(([chave, itens]) => ({ chave, itens }));
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;
  let base64 = '';

  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;

    base64 += BASE64_CHARS[b1 >> 2];
    base64 += BASE64_CHARS[((b1 & 3) << 4) | (b2 >> 4)];
    base64 += i + 1 < len ? BASE64_CHARS[((b2 & 15) << 2) | (b3 >> 6)] : '=';
    base64 += i + 2 < len ? BASE64_CHARS[b3 & 63] : '=';
  }

  return base64;
}

export default function ProntuarioDetalheScreen() {
  const route = useRoute<any>();
  const theme = useTheme();
  const { pacienteId, nomePaciente } = route.params;
  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [exames, setExames] = useState<Exame[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [tratamentosAbertos, setTratamentosAbertos] = useState(false);
  const [receitasAbertas, setReceitasAbertas] = useState(false);
  const [examesAbertos, setExamesAbertos] = useState(false);
  const [baixandoId, setBaixandoId] = useState<string | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  async function abrirExame(exame: Exame) {
    setBaixandoId(exame.id);
    try {
      const response = await api.get(`/api/exames/${exame.id}/arquivo`, {
        responseType: 'arraybuffer',
      });

      const contentType = String(
        response.headers['content-type'] ?? 'application/octet-stream'
      ).toLowerCase();
      const extensao = contentType.includes('pdf') ? 'pdf'
        : contentType.includes('png') ? 'png'
        : 'jpg';

      const base64 = arrayBufferToBase64(response.data);
      const nomeArquivo = `exame_${exame.id}.${extensao}`;
      const caminho = FileSystem.cacheDirectory + nomeArquivo;

      await FileSystem.writeAsStringAsync(caminho, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(caminho);
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1,
          type: contentType,
        });
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(caminho);
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível abrir o arquivo do exame.');
    } finally {
      setBaixandoId(null);
    }
  }

  async function carregar() {
    try {
      const [rProntuario, rPaciente] = await Promise.all([
        api.get(`/api/prontuarios/paciente/${pacienteId}`),
        api.get(`/api/Paciente/${pacienteId}`),
      ]);
      setProntuario(rProntuario.data);
      setPaciente(rPaciente.data);

      const rExames = await api.get(`/api/exames/prontuario/${rProntuario.data.id}`);
      setExames(rExames.data);
    } catch {
      setErro('Erro ao carregar prontuário');
    } finally {
      setLoading(false);
    }
  }

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

  const grupos = agruparPorDia(prontuario.consultas, prontuario.triagens);
  const chipBg = theme.colors.surfaceVariant;
  const chipTextColor = theme.colors.primary;
  const tratamentos = prontuario.tratamentos ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>

      {/* Card de identificação do paciente */}
      <Card style={styles.cardPaciente}>
        <Card.Content>
          <View style={styles.headerPaciente}>
            <Avatar.Text size={56} label={iniciais(nomePaciente)} style={styles.avatar} />
            <View style={styles.infoPrincipal}>
              <Text variant="titleLarge" style={styles.nomeGrande}>{nomePaciente}</Text>
              <Text variant="bodyMedium" style={[styles.subInfo, { color: theme.colors.onSurfaceVariant }]}>
                {[calcularIdade(paciente?.dataNascimento), paciente?.sexo, paciente?.estadoCivil]
                  .filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <Chip icon="calendar" compact style={{ backgroundColor: chipBg }} textStyle={[styles.chipTexto, { color: chipTextColor }]}>
              {prontuario.consultas.length} consultas
            </Chip>
            <Chip icon="stethoscope" compact style={{ backgroundColor: chipBg }} textStyle={[styles.chipTexto, { color: chipTextColor }]}>
              {prontuario.triagens.length} triagens
            </Chip>
            <Chip icon="pill" compact style={{ backgroundColor: chipBg }} textStyle={[styles.chipTexto, { color: chipTextColor }]}>
              {prontuario.receitas.length} receitas
            </Chip>
            <Chip icon="flask" compact style={{ backgroundColor: chipBg }} textStyle={[styles.chipTexto, { color: chipTextColor }]}>
              {exames.length} exames
            </Chip>
          </View>

          {(paciente?.cpf || paciente?.cartaoSus || paciente?.dataNascimento || paciente?.profissao) && (
            <View style={styles.secaoIdentificacao}>
              <Divider style={styles.divider} />
              <Text variant="labelLarge" style={[styles.secaoTitulo, { color: theme.colors.primary }]}>
                IDENTIFICAÇÃO
              </Text>
              {paciente?.cpf && <InfoLinha label="CPF" valor={paciente.cpf} />}
              {paciente?.cartaoSus && <InfoLinha label="Cartão SUS" valor={paciente.cartaoSus} />}
              {paciente?.dataNascimento && (
                <InfoLinha label="Nascimento" valor={new Date(paciente.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR')} />
              )}
              {paciente?.profissao && <InfoLinha label="Profissão" valor={paciente.profissao} />}
            </View>
          )}

          {(paciente?.nomePai || paciente?.nomeMae) && (
            <View style={styles.secaoIdentificacao}>
              <Divider style={styles.divider} />
              <Text variant="labelLarge" style={[styles.secaoTitulo, { color: theme.colors.primary }]}>
                FAMÍLIA
              </Text>
              {paciente?.nomePai && <InfoLinha label="Pai" valor={paciente.nomePai} />}
              {paciente?.nomeMae && <InfoLinha label="Mãe" valor={paciente.nomeMae} />}
            </View>
          )}

          {paciente?.endereco && (
            <View style={styles.secaoIdentificacao}>
              <Divider style={styles.divider} />
              <Text variant="labelLarge" style={[styles.secaoTitulo, { color: theme.colors.primary }]}>
                ENDEREÇO
              </Text>
              <Text variant="bodyMedium">{paciente.endereco}</Text>
            </View>
          )}

          {paciente?.informacoesAdicionais && (
            <View style={styles.alertaMedico}>
              <Divider style={styles.divider} />
              <Text variant="labelLarge" style={[styles.alertaTitulo, { color: theme.dark ? '#ffb74d' : '#e65100' }]}>
                ⚠️ INFORMAÇÕES MÉDICAS ADICIONAIS
              </Text>
              <Text
                variant="bodyMedium"
                style={[
                  styles.alertaTexto,
                  {
                    backgroundColor: theme.dark ? '#e6510028' : '#fff3e0',
                    color: theme.dark ? '#ffcc80' : '#e65100',
                  },
                ]}
              >
                {paciente.informacoesAdicionais}
              </Text>
            </View>
          )}

          {tratamentos.length > 0 && (() => {
            const proximo = tratamentos[0];
            const s = situacaoVencimento(proximo.diasRestantes);
            return (
              <View style={[styles.alertaVencimento, { backgroundColor: s.cor + (theme.dark ? '28' : '15'), borderColor: s.cor }]}>
                <MaterialCommunityIcons name="alarm" size={18} color={theme.dark ? '#ffb74d' : s.cor} />
                <Text variant="bodyMedium" style={[styles.alertaVencimentoTexto, { color: theme.dark ? '#ffb74d' : s.cor }]}>
                  Receita {s.label} · {proximo.medicamento}
                </Text>
              </View>
            );
          })()}
        </Card.Content>
      </Card>

      {/* Seção Tratamentos Acompanhados (minimizável) */}
      {tratamentos.length > 0 && (
        <>
          <TouchableOpacity onPress={() => setTratamentosAbertos(v => !v)}>
            <Card style={styles.cardSecao}>
              <Card.Content style={styles.secaoHeader}>
                <View style={styles.secaoHeaderEsquerda}>
                  <MaterialCommunityIcons name="alarm" size={20} color={cores.aviso} />
                  <Text variant="titleMedium" style={styles.secaoHeaderTitulo}>Tratamentos acompanhados</Text>
                  <Chip compact style={{ backgroundColor: chipBg }} textStyle={[styles.chipTextoNegrito, { color: chipTextColor }]}>
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
            <View style={styles.listaSecao}>
              {tratamentos.map((t) => {
                const s = situacaoVencimento(t.diasRestantes);
                return (
                  <Card key={`${t.receitaId}-${t.medicamento}`} style={[styles.cardItem, { borderLeftColor: s.cor, borderLeftWidth: 4 }]}>
                    <Card.Content>
                      <View style={styles.tratamentoTopo}>
                        <Text variant="titleSmall" style={styles.tratamentoNome}>{t.medicamento}</Text>
                        <Chip
                          compact
                          style={{ backgroundColor: s.cor + (theme.dark ? '33' : '20') }}
                          textStyle={[styles.chipTextoNegrito, { color: theme.dark ? '#ffb74d' : s.cor }]}
                        >
                          {capitalizar(s.label)}
                        </Chip>
                      </View>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        Emitida em {new Date(t.dataEmissao).toLocaleDateString('pt-BR')} · validade de {t.validadeDias} dias · vence em {dataVencimentoBr(t.dataVencimento)}
                      </Text>
                    </Card.Content>
                  </Card>
                );
              })}
            </View>
          )}
        </>
      )}

      {/* Seção Receitas */}
      <TouchableOpacity onPress={() => setReceitasAbertas(v => !v)}>
        <Card style={styles.cardSecao}>
          <Card.Content style={styles.secaoHeader}>
            <View style={styles.secaoHeaderEsquerda}>
              <MaterialCommunityIcons name="pill" size={20} color={cores.sucesso} />
              <Text variant="titleMedium" style={styles.secaoHeaderTitulo}>Receitas</Text>
              <Chip compact style={{ backgroundColor: chipBg }} textStyle={[styles.chipTextoNegrito, { color: chipTextColor }]}>
                {prontuario.receitas.length}
              </Chip>
            </View>
            <MaterialCommunityIcons
              name={receitasAbertas ? 'chevron-up' : 'chevron-down'}
              size={22}
              color={theme.colors.onSurfaceVariant}
            />
          </Card.Content>
        </Card>
      </TouchableOpacity>

      {receitasAbertas && (
        <View style={styles.listaSecao}>
          {prontuario.receitas.length === 0 ? (
            <Text style={[styles.textoVazioSecao, { color: theme.colors.onSurfaceVariant }]}>
              Nenhuma receita registrada
            </Text>
          ) : (
            prontuario.receitas.map((r) => {
              const consultaRelacionada = prontuario.consultas.find(c => c.id === r.consultaId);
              return (
                <Card key={r.id} style={styles.cardItem}>
                  <Card.Content>
                    {consultaRelacionada && (
                      <Text variant="bodySmall" style={[styles.itemData, { color: theme.colors.onSurfaceVariant }]}>
                        {new Date(consultaRelacionada.dataConsulta).toLocaleDateString('pt-BR')} · {consultaRelacionada.nomeMedico}
                      </Text>
                    )}
                    {r.medicamentos.map((m, i) => (
                      <Text key={i} variant="bodyMedium" style={styles.itemLinha}>
                        • {m.nome} {m.dosagem} — {m.posologia}
                      </Text>
                    ))}
                  </Card.Content>
                </Card>
              );
            })
          )}
        </View>
      )}

      {/* Seção Exames */}
      <TouchableOpacity onPress={() => setExamesAbertos(v => !v)}>
        <Card style={styles.cardSecao}>
          <Card.Content style={styles.secaoHeader}>
            <View style={styles.secaoHeaderEsquerda}>
              <MaterialCommunityIcons name="flask" size={20} color={cores.secundaria} />
              <Text variant="titleMedium" style={styles.secaoHeaderTitulo}>Exames</Text>
              <Chip compact style={{ backgroundColor: chipBg }} textStyle={[styles.chipTextoNegrito, { color: chipTextColor }]}>
                {exames.length}
              </Chip>
            </View>
            <MaterialCommunityIcons
              name={examesAbertos ? 'chevron-up' : 'chevron-down'}
              size={22}
              color={theme.colors.onSurfaceVariant}
            />
          </Card.Content>
        </Card>
      </TouchableOpacity>

      {examesAbertos && (
        <View style={styles.listaSecao}>
          {exames.length === 0 ? (
            <Text style={[styles.textoVazioSecao, { color: theme.colors.onSurfaceVariant }]}>
              Nenhum exame registrado
            </Text>
          ) : (
            exames.map((e) => {
              const cor = categoriaCor[e.categoria] ?? '#546e7a';
              const conteudo = (
                <Card.Content>
                  <View style={styles.exameHeader}>
                    <Chip
                      compact
                      style={{ backgroundColor: cor + (theme.dark ? '33' : '20') }}
                      textStyle={[styles.chipTexto, { color: theme.dark ? '#e8eef5' : cor }]}
                    >
                      {categoriaLabel[e.categoria] ?? e.categoria}
                    </Chip>
                    {e.temArquivo && (
                      baixandoId === e.id
                        ? <ActivityIndicator size={16} />
                        : <MaterialCommunityIcons name="download" size={18} color={theme.colors.primary} />
                    )}
                  </View>
                  <Text variant="titleSmall" style={styles.exameNome}>{e.nome}</Text>
                  <Text variant="bodySmall" style={[styles.itemData, { color: theme.colors.onSurfaceVariant }]}>
                    {new Date(e.dataExame + 'T00:00:00').toLocaleDateString('pt-BR')} · Dr(a). {e.medicoSolicitante}
                  </Text>
                  {e.observacoes && (
                    <Text variant="bodySmall" style={[styles.exameObs, { color: theme.colors.onSurfaceVariant }]}>
                      {e.observacoes}
                    </Text>
                  )}
                  {e.temArquivo && (
                    <Text variant="bodySmall" style={[styles.exameToqueDica, { color: theme.colors.primary }]}>
                      Toque para visualizar o arquivo
                    </Text>
                  )}
                </Card.Content>
              );

              return e.temArquivo ? (
                <TouchableOpacity key={e.id} onPress={() => abrirExame(e)} disabled={baixandoId === e.id}>
                  <Card style={[styles.cardItem, { borderLeftColor: cor, borderLeftWidth: 4 }]}>
                    {conteudo}
                  </Card>
                </TouchableOpacity>
              ) : (
                <Card key={e.id} style={[styles.cardItem, { borderLeftColor: cor, borderLeftWidth: 4 }]}>
                  {conteudo}
                </Card>
              );
            })
          )}
        </View>
      )}

      {/* Timeline de consultas */}
      <Text variant="titleMedium" style={styles.tituloTimeline}>Histórico de Consultas</Text>

      {grupos.length === 0 ? (
        <Text style={[styles.textoVazio, { color: theme.colors.onSurfaceVariant }]}>
          Nenhuma consulta registrada
        </Text>
      ) : (
        grupos.map((grupo) => (
          <View key={grupo.chave} style={styles.grupoDia}>
            <Text variant="titleSmall" style={[styles.dataGrupo, { color: theme.colors.primary }]}>
              {grupo.chave}
            </Text>

            {grupo.itens.map(({ consulta, triagem }) => {
              const cor = statusCores[consulta.status] ?? cores.primaria;
              return (
                <Card key={consulta.id} style={[styles.card, { borderLeftColor: cor, borderLeftWidth: 4 }]}>
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <Text variant="titleSmall">{consulta.nomeMedico}</Text>
                      <Chip
                        style={{ backgroundColor: cor + (theme.dark ? '33' : '20') }}
                        textStyle={[styles.chipTexto, { color: theme.dark ? '#e8eef5' : cor }]}
                        compact
                      >
                        {statusLabels[consulta.status]}
                      </Chip>
                    </View>
                    <Text variant="bodySmall" style={[styles.hora, { color: theme.colors.onSurfaceVariant }]}>
                      {new Date(consulta.dataConsulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>

                    {triagem && (
                      <View style={styles.secao}>
                        <Divider style={styles.divider} />
                        <Text variant="labelMedium" style={[styles.secaoTituloCard, { color: theme.colors.onSurfaceVariant }]}>
                          🩺 Triagem
                        </Text>
                        <Text variant="bodySmall">PA: {triagem.pressaoArterial} · Temp: {triagem.temperatura}°C</Text>
                        {triagem.observacoes && (
                          <Text variant="bodySmall" style={[styles.observacao, { color: theme.colors.onSurfaceVariant }]}>
                            "{triagem.observacoes}"
                          </Text>
                        )}
                      </View>
                    )}

                    {consulta.anotacoes && (
                      <View style={styles.secao}>
                        <Divider style={styles.divider} />
                        <Text variant="labelMedium" style={[styles.secaoTituloCard, { color: theme.colors.onSurfaceVariant }]}>
                          📝 Anotações
                        </Text>
                        <Text variant="bodySmall">{consulta.anotacoes}</Text>
                      </View>
                    )}
                  </Card.Content>
                </Card>
              );
            })}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function InfoLinha({ label, valor }: { label: string; valor: string }) {
  const theme = useTheme();
  return (
    <View style={styles.infoLinha}>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
      <Text variant="bodySmall" style={styles.infoValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  conteudo: { padding: 16 },
  cardPaciente: { borderRadius: 16, marginBottom: 16 },
  headerPaciente: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { backgroundColor: cores.primariaEscura },
  infoPrincipal: { marginLeft: 14, flex: 1 },
  nomeGrande: { fontWeight: 'bold' },
  subInfo: { marginTop: 2 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  secaoIdentificacao: { marginTop: 4 },
  divider: { marginVertical: 10 },
  secaoTitulo: { fontWeight: 'bold', marginBottom: 8, fontSize: 11, letterSpacing: 0.5 },
  infoLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoValor: { fontWeight: '600' },
  alertaMedico: { marginTop: 4 },
  alertaTitulo: { fontWeight: 'bold', marginBottom: 8, fontSize: 11, letterSpacing: 0.5 },
  alertaTexto: { padding: 10, borderRadius: 8 },

  chipTexto: { fontSize: 12, lineHeight: 16, marginVertical: 2 },
  chipTextoNegrito: { fontSize: 12, lineHeight: 16, fontWeight: '700', marginVertical: 2 },

  alertaVencimento: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  alertaVencimentoTexto: { flex: 1, fontWeight: '700' },
  tratamentoTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  tratamentoNome: { fontWeight: '600', flex: 1, marginRight: 8 },

  cardSecao: { borderRadius: 12, marginBottom: 8 },
  secaoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secaoHeaderEsquerda: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secaoHeaderTitulo: { fontWeight: 'bold' },
  listaSecao: { marginBottom: 16, gap: 8 },
  cardItem: { borderRadius: 10 },
  itemData: { marginBottom: 6 },
  itemLinha: { marginBottom: 2 },
  textoVazioSecao: { textAlign: 'center', paddingVertical: 12 },

  exameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  exameNome: { fontWeight: '600', marginBottom: 2 },
  exameObs: { fontStyle: 'italic', marginTop: 4 },
  exameToqueDica: { marginTop: 6, fontSize: 11 },

  tituloTimeline: { fontWeight: 'bold', marginTop: 8, marginBottom: 12 },
  grupoDia: { marginBottom: 20 },
  dataGrupo: { fontWeight: 'bold', marginBottom: 8 },
  card: { marginBottom: 10, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hora: { marginBottom: 4 },
  secao: { marginTop: 8 },
  secaoTituloCard: { marginBottom: 4 },
  observacao: { fontStyle: 'italic', marginTop: 2 },
  textoVazio: { textAlign: 'center', marginTop: 40 },
  erro: { color: cores.erro },
});