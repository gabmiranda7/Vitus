import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Text, Card, Searchbar, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { AuditoriaLog } from '../../types';
import { cores } from '../../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const acaoIcones: Record<string, string> = {
  CriacaoPaciente: 'account-plus',
  EdicaoPaciente: 'account-edit',
  ExclusaoPaciente: 'account-remove',
  CriacaoConsulta: 'calendar-plus',
  CancelamentoConsulta: 'calendar-remove',
  EmissaoReceita: 'pill',
  AcessoProntuario: 'folder-open',
  RegistroTriagem: 'stethoscope',
  RegistroExame: 'flask',
};

const acaoCores: Record<string, string> = {
  CriacaoPaciente: cores.sucesso,
  EdicaoPaciente: cores.primaria,
  ExclusaoPaciente: cores.erro,
  CriacaoConsulta: cores.primaria,
  CancelamentoConsulta: cores.erro,
  EmissaoReceita: cores.sucesso,
  AcessoProntuario: cores.secundaria,
  RegistroTriagem: cores.aviso,
  RegistroExame: cores.secundaria,
};

const acaoLabel: Record<string, string> = {
  CriacaoPaciente: 'Paciente Criado',
  EdicaoPaciente: 'Paciente Editado',
  ExclusaoPaciente: 'Paciente Excluído',
  CriacaoConsulta: 'Consulta Criada',
  CancelamentoConsulta: 'Consulta Cancelada',
  EmissaoReceita: 'Receita Emitida',
  AcessoProntuario: 'Prontuário Acessado',
  RegistroTriagem: 'Triagem Registrada',
  RegistroExame: 'Exame Registrado',
};

export default function AuditoriaScreen() {
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const response = await api.get('/api/auditoria');
      setLogs(response.data);
    } catch {
      setErro('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  }

  function alternarExpansao(id: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandidoId(prev => (prev === id ? null : id));
  }

  const logsOrdenados = [...logs].sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());

  const filtrados = logsOrdenados.filter(log => {
    const q = busca.toLowerCase();
    return (
      log.usuarioNome.toLowerCase().includes(q) ||
      log.entidadeAfetada.toLowerCase().includes(q) ||
      (acaoLabel[log.acao] ?? log.acao).toLowerCase().includes(q)
    );
  });

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
      <Searchbar
        placeholder="Buscar por usuário, ação ou entidade..."
        value={busca}
        onChangeText={setBusca}
        style={styles.busca}
      />

      <ScrollView contentContainerStyle={styles.conteudo}>
        {filtrados.length === 0 ? (
          <Text style={styles.textoVazio}>
            {busca ? 'Nenhum registro encontrado' : 'Nenhum registro de auditoria'}
          </Text>
        ) : (
          filtrados.map((log) => {
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
                            color={cores.textoDesabilitado}
                          />
                        </View>
                        <Text variant="bodySmall" style={styles.textoSecundario}>
                          {log.usuarioNome} · {log.entidadeAfetada}
                        </Text>
                        <Text variant="bodySmall" style={styles.data}>
                          {new Date(log.dataHora).toLocaleString('pt-BR')}
                        </Text>
                      </View>
                    </View>

                    {expandido && (
                      <View style={styles.detalhes}>
                        <Divider style={styles.divider} />
                        <View style={styles.detalheLinha}>
                          <Text variant="bodySmall" style={styles.detalheLabel}>Ação</Text>
                          <Chip compact style={{ backgroundColor: cor + '20' }} textStyle={{ color: cor, fontSize: 11 }}>
                            {log.acao}
                          </Chip>
                        </View>
                        <View style={styles.detalheLinha}>
                          <Text variant="bodySmall" style={styles.detalheLabel}>Entidade Afetada</Text>
                          <Text variant="bodySmall" style={styles.detalheValor}>{log.entidadeAfetada}</Text>
                        </View>
                        <View style={styles.detalheLinha}>
                          <Text variant="bodySmall" style={styles.detalheLabel}>ID da Entidade</Text>
                          <Text variant="bodySmall" style={styles.detalheValorMono}>{log.entidadeId}</Text>
                        </View>
                        <View style={styles.detalheLinha}>
                          <Text variant="bodySmall" style={styles.detalheLabel}>Usuário</Text>
                          <Text variant="bodySmall" style={styles.detalheValor}>{log.usuarioNome}</Text>
                        </View>
                        <View style={styles.detalheLinha}>
                          <Text variant="bodySmall" style={styles.detalheLabel}>ID do Usuário</Text>
                          <Text variant="bodySmall" style={styles.detalheValorMono}>{log.usuarioId}</Text>
                        </View>
                        <View style={styles.detalheLinha}>
                          <Text variant="bodySmall" style={styles.detalheLabel}>Data e Hora</Text>
                          <Text variant="bodySmall" style={styles.detalheValor}>
                            {new Date(log.dataHora).toLocaleString('pt-BR', {
                              dateStyle: 'long',
                              timeStyle: 'medium',
                            })}
                          </Text>
                        </View>
                        {log.detalhes && (
                          <View style={styles.detalhesTexto}>
                            <Text variant="bodySmall" style={styles.detalheLabel}>Detalhes</Text>
                            <Text variant="bodySmall" style={styles.detalheTextoLivre}>{log.detalhes}</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  busca: { margin: 16, marginBottom: 8 },
  conteudo: { padding: 16, paddingTop: 8 },
  card: { marginBottom: 10, borderRadius: 12 },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
  icone: { marginRight: 12, marginTop: 2 },
  info: { flex: 1 },
  tituloRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontWeight: '600' },
  textoSecundario: { color: cores.textoSecundario, marginTop: 2 },
  data: { color: cores.textoDesabilitado, marginTop: 2, fontSize: 11 },
  textoVazio: { textAlign: 'center', color: cores.textoDesabilitado, marginTop: 40 },
  erro: { color: cores.erro },

  detalhes: { marginTop: 4 },
  divider: { marginVertical: 10 },
  detalheLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detalheLabel: { color: cores.textoSecundario, fontWeight: '600' },
  detalheValor: { fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  detalheValorMono: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    color: cores.textoSecundario,
    flexShrink: 1,
    textAlign: 'right',
  },
  detalhesTexto: { marginTop: 8 },
  detalheTextoLivre: {
    marginTop: 4,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    color: cores.textoSecundario,
  },
});