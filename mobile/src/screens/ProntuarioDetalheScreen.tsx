import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Divider, Avatar } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import { Prontuario, Paciente, Consulta, Triagem, Receita, Exame, statusCores, statusLabels } from '../types';

interface ConsultaAgrupada {
  consulta: Consulta;
  triagem?: Triagem;
}

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
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
  Sangue: 'Sangue', Imagem: 'Imagem', Urina: 'Urina',
  Cardiologico: 'Cardiológico', Fisico: 'Físico', Outro: 'Outro',
};
const categoriaCor: Record<string, string> = {
  Sangue: '#c62828', Imagem: '#1565c0', Urina: '#f57c00',
  Cardiologico: '#ad1457', Fisico: '#2e7d32', Outro: '#546e7a',
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

export default function ProntuarioDetalheScreen() {
  const route = useRoute<any>();
  const { pacienteId, nomePaciente } = route.params;
  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [exames, setExames] = useState<Exame[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [receitasAbertas, setReceitasAbertas] = useState(false);
  const [examesAbertos, setExamesAbertos] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>

      {/* Card de identificação do paciente */}
      <Card style={styles.cardPaciente}>
        <Card.Content>
          <View style={styles.headerPaciente}>
            <Avatar.Text size={56} label={iniciais(nomePaciente)} style={styles.avatar} />
            <View style={styles.infoPrincipal}>
              <Text variant="titleLarge" style={styles.nomeGrande}>{nomePaciente}</Text>
              <Text variant="bodyMedium" style={styles.subInfo}>
                {[calcularIdade(paciente?.dataNascimento), paciente?.sexo, paciente?.estadoCivil]
                  .filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <Chip icon="calendar" compact style={styles.statChip}>{prontuario.consultas.length} consultas</Chip>
            <Chip icon="stethoscope" compact style={styles.statChip}>{prontuario.triagens.length} triagens</Chip>
            <Chip icon="pill" compact style={styles.statChip}>{prontuario.receitas.length} receitas</Chip>
            <Chip icon="flask" compact style={styles.statChip}>{exames.length} exames</Chip>
          </View>

          {(paciente?.cpf || paciente?.cartaoSus || paciente?.dataNascimento || paciente?.profissao) && (
            <View style={styles.secaoIdentificacao}>
              <Divider style={styles.divider} />
              <Text variant="labelLarge" style={styles.secaoTitulo}>IDENTIFICAÇÃO</Text>
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
              <Text variant="labelLarge" style={styles.secaoTitulo}>FAMÍLIA</Text>
              {paciente?.nomePai && <InfoLinha label="Pai" valor={paciente.nomePai} />}
              {paciente?.nomeMae && <InfoLinha label="Mãe" valor={paciente.nomeMae} />}
            </View>
          )}

          {paciente?.endereco && (
            <View style={styles.secaoIdentificacao}>
              <Divider style={styles.divider} />
              <Text variant="labelLarge" style={styles.secaoTitulo}>ENDEREÇO</Text>
              <Text variant="bodyMedium">{paciente.endereco}</Text>
            </View>
          )}

          {paciente?.informacoesAdicionais && (
            <View style={styles.alertaMedico}>
              <Divider style={styles.divider} />
              <Text variant="labelLarge" style={styles.alertaTitulo}>⚠️ INFORMAÇÕES MÉDICAS ADICIONAIS</Text>
              <Text variant="bodyMedium" style={styles.alertaTexto}>{paciente.informacoesAdicionais}</Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Seção Receitas */}
      <TouchableOpacity onPress={() => setReceitasAbertas(v => !v)}>
        <Card style={styles.cardSecao}>
          <Card.Content style={styles.secaoHeader}>
            <View style={styles.secaoHeaderEsquerda}>
              <MaterialCommunityIcons name="pill" size={20} color="#2e7d32" />
              <Text variant="titleMedium" style={styles.secaoHeaderTitulo}>Receitas</Text>
              <Chip compact style={styles.chipContagem}>{prontuario.receitas.length}</Chip>
            </View>
            <MaterialCommunityIcons name={receitasAbertas ? 'chevron-up' : 'chevron-down'} size={22} color="#666" />
          </Card.Content>
        </Card>
      </TouchableOpacity>

      {receitasAbertas && (
        <View style={styles.listaSecao}>
          {prontuario.receitas.length === 0 ? (
            <Text style={styles.textoVazioSecao}>Nenhuma receita registrada</Text>
          ) : (
            prontuario.receitas.map((r) => {
              const consultaRelacionada = prontuario.consultas.find(c => c.id === r.consultaId);
              return (
                <Card key={r.id} style={styles.cardItem}>
                  <Card.Content>
                    {consultaRelacionada && (
                      <Text variant="bodySmall" style={styles.itemData}>
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
              <MaterialCommunityIcons name="flask" size={20} color="#7b1fa2" />
              <Text variant="titleMedium" style={styles.secaoHeaderTitulo}>Exames</Text>
              <Chip compact style={styles.chipContagem}>{exames.length}</Chip>
            </View>
            <MaterialCommunityIcons name={examesAbertos ? 'chevron-up' : 'chevron-down'} size={22} color="#666" />
          </Card.Content>
        </Card>
      </TouchableOpacity>

      {examesAbertos && (
        <View style={styles.listaSecao}>
          {exames.length === 0 ? (
            <Text style={styles.textoVazioSecao}>Nenhum exame registrado</Text>
          ) : (
            exames.map((e) => {
              const cor = categoriaCor[e.categoria] ?? '#546e7a';
              return (
                <Card key={e.id} style={[styles.cardItem, { borderLeftColor: cor, borderLeftWidth: 4 }]}>
                  <Card.Content>
                    <View style={styles.exameHeader}>
                      <Chip compact style={{ backgroundColor: cor + '20' }} textStyle={{ color: cor, fontSize: 11 }}>
                        {categoriaLabel[e.categoria] ?? e.categoria}
                      </Chip>
                      {e.temArquivo && (
                        <MaterialCommunityIcons name="paperclip" size={16} color="#666" />
                      )}
                    </View>
                    <Text variant="titleSmall" style={styles.exameNome}>{e.nome}</Text>
                    <Text variant="bodySmall" style={styles.itemData}>
                      {new Date(e.dataExame + 'T00:00:00').toLocaleDateString('pt-BR')} · Dr(a). {e.medicoSolicitante}
                    </Text>
                    {e.observacoes && (
                      <Text variant="bodySmall" style={styles.exameObs}>{e.observacoes}</Text>
                    )}
                  </Card.Content>
                </Card>
              );
            })
          )}
        </View>
      )}

      {/* Timeline de consultas (só triagem e anotações agora) */}
      <Text variant="titleMedium" style={styles.tituloTimeline}>Histórico de Consultas</Text>

      {grupos.length === 0 ? (
        <Text style={styles.textoVazio}>Nenhuma consulta registrada</Text>
      ) : (
        grupos.map((grupo) => (
          <View key={grupo.chave} style={styles.grupoDia}>
            <Text variant="titleSmall" style={styles.dataGrupo}>{grupo.chave}</Text>

            {grupo.itens.map(({ consulta, triagem }) => {
              const cor = statusCores[consulta.status] ?? '#1976d2';
              return (
                <Card key={consulta.id} style={[styles.card, { borderLeftColor: cor, borderLeftWidth: 4 }]}>
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <Text variant="titleSmall">{consulta.nomeMedico}</Text>
                      <Chip style={{ backgroundColor: cor + '20' }} textStyle={{ color: cor, fontSize: 11 }} compact>
                        {statusLabels[consulta.status]}
                      </Chip>
                    </View>
                    <Text variant="bodySmall" style={styles.hora}>
                      {new Date(consulta.dataConsulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>

                    {triagem && (
                      <View style={styles.secao}>
                        <Divider style={styles.divider} />
                        <Text variant="labelMedium" style={styles.secaoTituloCard}>🩺 Triagem</Text>
                        <Text variant="bodySmall">PA: {triagem.pressaoArterial} · Temp: {triagem.temperatura}°C</Text>
                        {triagem.observacoes && (
                          <Text variant="bodySmall" style={styles.observacao}>"{triagem.observacoes}"</Text>
                        )}
                      </View>
                    )}

                    {consulta.anotacoes && (
                      <View style={styles.secao}>
                        <Divider style={styles.divider} />
                        <Text variant="labelMedium" style={styles.secaoTituloCard}>📝 Anotações</Text>
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
  return (
    <View style={styles.infoLinha}>
      <Text variant="bodySmall" style={styles.infoLabel}>{label}</Text>
      <Text variant="bodySmall" style={styles.infoValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  conteudo: { padding: 16 },
  cardPaciente: { borderRadius: 16, marginBottom: 16 },
  headerPaciente: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { backgroundColor: '#1565c0' },
  infoPrincipal: { marginLeft: 14, flex: 1 },
  nomeGrande: { fontWeight: 'bold' },
  subInfo: { color: '#666', marginTop: 2 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  statChip: { backgroundColor: '#e3f2fd' },
  secaoIdentificacao: { marginTop: 4 },
  divider: { marginVertical: 10 },
  secaoTitulo: { color: '#1976d2', fontWeight: 'bold', marginBottom: 8, fontSize: 11, letterSpacing: 0.5 },
  infoLinha: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { color: '#666' },
  infoValor: { fontWeight: '600' },
  alertaMedico: { marginTop: 4 },
  alertaTitulo: { color: '#e65100', fontWeight: 'bold', marginBottom: 8, fontSize: 11, letterSpacing: 0.5 },
  alertaTexto: { backgroundColor: '#fff3e0', padding: 10, borderRadius: 8, color: '#e65100' },

  cardSecao: { borderRadius: 12, marginBottom: 8 },
  secaoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  secaoHeaderEsquerda: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  secaoHeaderTitulo: { fontWeight: 'bold' },
  chipContagem: { backgroundColor: '#e3f2fd', height: 24 },
  listaSecao: { marginBottom: 16, gap: 8 },
  cardItem: { borderRadius: 10 },
  itemData: { color: '#999', marginBottom: 6 },
  itemLinha: { marginBottom: 2 },
  textoVazioSecao: { textAlign: 'center', color: '#999', paddingVertical: 12 },

  exameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  exameNome: { fontWeight: '600', marginBottom: 2 },
  exameObs: { fontStyle: 'italic', color: '#666', marginTop: 4 },

  tituloTimeline: { fontWeight: 'bold', marginTop: 8, marginBottom: 12 },
  grupoDia: { marginBottom: 20 },
  dataGrupo: { color: '#1976d2', fontWeight: 'bold', marginBottom: 8 },
  card: { marginBottom: 10, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hora: { color: '#999', marginBottom: 4 },
  secao: { marginTop: 8 },
  secaoTituloCard: { marginBottom: 4, color: '#555' },
  observacao: { fontStyle: 'italic', color: '#666', marginTop: 2 },
  textoVazio: { textAlign: 'center', color: '#999', marginTop: 40 },
  erro: { color: '#d32f2f' },
});