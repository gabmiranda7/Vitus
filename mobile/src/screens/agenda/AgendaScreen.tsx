import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Avatar, Button, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Consulta, statusCores, statusLabels } from '../../types';
import { cores, corAvatar, iniciais } from '../../theme';
import ConfirmModal from '../../components/ConfirmModal';

function hora(data: string) {
  return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default function AgendaScreen() {
  const { usuario } = useAuth();
  const navigation = useNavigation<any>();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');
  const [finalizando, setFinalizando] = useState<Consulta | null>(null);
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 30000);
    return () => clearInterval(interval);
  }, []);

  async function carregar() {
    try {
      const response = await api.get('/api/consultas');
      setConsultas(response.data);
    } catch (e: any) {
      setErro(e.mensagemBack ?? 'Erro ao carregar agenda');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    carregar();
  }

  async function mudarStatus(id: string, acao: string) {
    try {
      await api.patch(`/api/consultas/${id}/${acao}`);
      setErro('');
      await carregar();
    } catch (e: any) {
      setErro(e.mensagemBack ?? 'Erro ao atualizar consulta');
    }
  }

  async function confirmarFinalizar() {
    if (!finalizando) return;
    setProcessando(true);
    try {
      await mudarStatus(finalizando.id, 'finalizar');
    } finally {
      setProcessando(false);
      setFinalizando(null);
    }
  }

  function abrirProntuario(c: Consulta) {
    navigation.navigate('Prontuarios', {
      screen: 'ProntuarioDetalhe',
      params: { pacienteId: c.pacienteId, nomePaciente: c.nomePaciente },
    });
  }

  const hoje = new Date().toDateString();

  const minhas = consultas
    .filter(c => c.medicoId === usuario?.medicoId && new Date(c.dataConsulta).toDateString() === hoje)
    .sort((a, b) => new Date(a.dataConsulta).getTime() - new Date(b.dataConsulta).getTime());

  const validas = minhas.filter(c => c.status !== 'Cancelada');
  const finalizadas = minhas.filter(c => c.status === 'Finalizada').length;
  const progresso = validas.length > 0 ? finalizadas / validas.length : 0;

  const proxima = minhas.find(c => ['AguardandoAtendimento', 'EmAtendimento'].includes(c.status));
  const emAtendimento = proxima?.status === 'EmAtendimento';

  const stats = [
    { label: 'Total', valor: minhas.length, cor: cores.primaria },
    { label: 'Aguardando', valor: minhas.filter(c => c.status === 'AguardandoAtendimento').length, cor: cores.info },
    { label: 'Em atendimento', valor: minhas.filter(c => c.status === 'EmAtendimento').length, cor: cores.secundaria },
    { label: 'Finalizadas', valor: finalizadas, cor: cores.sucesso },
  ];

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!usuario?.medicoId) {
    return (
      <View style={styles.centro}>
        <Text style={styles.textoVazio}>Seu usuário não está vinculado a um cadastro de médico.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.conteudo}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text variant="titleMedium" style={styles.data}>
          {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <View style={styles.statsRow}>
          {stats.map(s => (
            <Chip key={s.label} compact style={{ backgroundColor: s.cor + '20' }} textStyle={{ color: s.cor }}>
              {s.valor} {s.label}
            </Chip>
          ))}
        </View>

        <View style={styles.progressoLinha}>
          <ProgressBar progress={progresso} color={cores.sucesso} style={styles.barra} />
          <Text variant="labelSmall" style={styles.progressoTexto}>{Math.round(progresso * 100)}%</Text>
        </View>

        {proxima && (
          <Card style={[styles.destaque, { backgroundColor: emAtendimento ? '#7b1fa2' : '#0288d1' }]}>
            <Card.Content>
              <Text variant="labelSmall" style={styles.destaqueRotulo}>
                {emAtendimento ? 'EM ATENDIMENTO AGORA' : 'PRÓXIMA CONSULTA'}
              </Text>
              <View style={styles.destaqueLinha}>
                <Avatar.Text size={44} label={iniciais(proxima.nomePaciente)} style={styles.destaqueAvatar} />
                <View style={styles.destaqueInfo}>
                  <Text variant="titleMedium" style={styles.destaqueNome}>{proxima.nomePaciente}</Text>
                  <Text variant="bodySmall" style={styles.destaqueHora}>{hora(proxima.dataConsulta)}</Text>
                </View>
              </View>
              <View style={styles.destaqueBotoes}>
                {proxima.status === 'AguardandoAtendimento' ? (
                  <Button mode="contained" buttonColor="white" textColor="#0288d1" icon="account"
                    onPress={() => mudarStatus(proxima.id, 'iniciar-atendimento')}>
                    Iniciar
                  </Button>
                ) : (
                  <>
                    <Button mode="outlined" textColor="white" icon="folder-account"
                      style={styles.botaoBorda} onPress={() => abrirProntuario(proxima)}>
                      Prontuário
                    </Button>
                    <Button mode="contained" buttonColor="white" textColor={cores.sucesso} icon="check-circle"
                      onPress={() => setFinalizando(proxima)}>
                      Finalizar
                    </Button>
                  </>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        <Text variant="titleMedium" style={styles.titulo}>Agenda completa</Text>

        {minhas.length === 0 ? (
          <View style={styles.vazio}>
            <MaterialCommunityIcons name="calendar-blank" size={56} color={cores.textoDesabilitado} />
            <Text style={styles.textoVazio}>Nenhuma consulta hoje</Text>
          </View>
        ) : (
          minhas.map((c) => {
            const cor = statusCores[c.status] ?? cores.primaria;
            return (
              <Card
                key={c.id}
                style={[styles.card, { borderLeftColor: cor, borderLeftWidth: 4, opacity: c.status === 'Cancelada' ? 0.5 : 1 }]}
              >
                <Card.Content>
                  <View style={styles.cardTopo}>
                    <Text variant="titleSmall" style={{ color: cor, fontWeight: 'bold' }}>{hora(c.dataConsulta)}</Text>
                    <Chip compact style={{ backgroundColor: cor + '20' }} textStyle={{ color: cor, fontSize: 11 }}>
                      {statusLabels[c.status]}
                    </Chip>
                  </View>
                  <View style={styles.cardPaciente}>
                    <Avatar.Text size={36} label={iniciais(c.nomePaciente)} style={{ backgroundColor: corAvatar(c.nomePaciente) }} />
                    <Text variant="titleSmall" style={styles.cardNome} numberOfLines={1}>{c.nomePaciente}</Text>
                  </View>

                  {c.status === 'AguardandoAtendimento' && (
                    <Button mode="contained" compact icon="account" style={styles.acao}
                      onPress={() => mudarStatus(c.id, 'iniciar-atendimento')}>
                      Iniciar
                    </Button>
                  )}
                  {c.status === 'EmAtendimento' && (
                    <View style={styles.acoes}>
                      <Button mode="outlined" compact icon="folder-account" onPress={() => abrirProntuario(c)}>
                        Prontuário
                      </Button>
                      <Button mode="outlined" compact icon="note-edit" onPress={() => navigation.navigate('Consultas')}>
                        Anotar
                      </Button>
                      <Button mode="contained" compact buttonColor={cores.sucesso} icon="check-circle"
                        onPress={() => setFinalizando(c)}>
                        Finalizar
                      </Button>
                    </View>
                  )}
                  {c.status === 'Finalizada' && (
                    <Button mode="outlined" compact icon="folder-account" style={styles.acao}
                      onPress={() => abrirProntuario(c)}>
                      Prontuário
                    </Button>
                  )}
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      <ConfirmModal
        visible={!!finalizando}
        titulo="Finalizar consulta"
        mensagem={`Tem certeza que deseja finalizar a consulta de ${finalizando?.nomePaciente ?? ''}?`}
        corBotao={cores.sucesso}
        onClose={() => setFinalizando(null)}
        onConfirmar={confirmarFinalizar}
        loading={processando}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  conteudo: { padding: 16 },
  data: { fontWeight: 'bold', textTransform: 'capitalize', marginBottom: 12 },
  erro: { color: cores.erro, marginBottom: 12 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  progressoLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  barra: { flex: 1, height: 6, borderRadius: 3 },
  progressoTexto: { color: cores.textoSecundario, fontWeight: '700' },
  destaque: { borderRadius: 16, marginBottom: 20 },
  destaqueRotulo: { color: 'rgba(255,255,255,0.75)', fontWeight: 'bold', letterSpacing: 1, marginBottom: 10 },
  destaqueLinha: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  destaqueAvatar: { backgroundColor: 'rgba(255,255,255,0.25)' },
  destaqueInfo: { marginLeft: 12, flex: 1 },
  destaqueNome: { color: 'white', fontWeight: 'bold' },
  destaqueHora: { color: 'rgba(255,255,255,0.8)' },
  destaqueBotoes: { flexDirection: 'row', gap: 8 },
  botaoBorda: { borderColor: 'rgba(255,255,255,0.6)' },
  titulo: { fontWeight: 'bold', marginBottom: 10 },
  card: { marginBottom: 10, borderRadius: 12 },
  cardTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardPaciente: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardNome: { flex: 1 },
  acao: { marginTop: 10, alignSelf: 'flex-start' },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  vazio: { alignItems: 'center', marginTop: 40 },
  textoVazio: { color: cores.textoDesabilitado, marginTop: 8, textAlign: 'center' },
});