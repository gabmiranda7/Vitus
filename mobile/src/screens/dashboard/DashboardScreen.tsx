import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Consulta, AuditoriaLog, statusCores, statusLabels } from '../../types';
import { cores, iniciais } from '../../theme';

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

export default function DashboardScreen() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.perfil === 'Administrador';

  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      if (isAdmin) {
        const response = await api.get('/api/auditoria');
        setLogs(response.data);
      } else {
        const response = await api.get('/api/consultas');
        setConsultas(response.data);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    carregar();
  }

  const ativas = consultas.filter(c =>
    ['Agendada', 'EmTriagem', 'AguardandoAtendimento', 'EmAtendimento'].includes(c.status)
  );

  const minhasConsultas = usuario?.perfil === 'Medico'
    ? ativas.filter(c => c.nomeMedico === usuario.nome)
    : ativas;

  const logsRecentes = [...logs]
    .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
    .slice(0, 8);

  const contagemPorAcao = logs.reduce((acc, l) => {
    acc[l.acao] = (acc[l.acao] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text variant="headlineSmall" style={styles.saudacao}>
        Olá, {usuario?.nome?.split(' ')[0]} 👋
      </Text>
      <Text variant="bodyMedium" style={styles.subtitulo}>
        {isAdmin
          ? 'Resumo de auditoria do sistema'
          : usuario?.perfil === 'Medico' ? 'Minhas consultas ativas' : 'Consultas ativas'}
      </Text>

      {isAdmin ? (
        <>
          <View style={styles.statsRow}>
            {Object.entries(contagemPorAcao).map(([acao, count]) => (
              <Chip
                key={acao}
                icon={acaoIcones[acao] ?? 'information'}
                compact
                style={[styles.statChip, { backgroundColor: (acaoCores[acao] ?? cores.textoSecundario) + '20' }]}
                textStyle={{ color: acaoCores[acao] ?? cores.textoSecundario }}
              >
                {count}
              </Chip>
            ))}
          </View>

          <Text variant="titleMedium" style={styles.tituloSecao}>Atividade Recente</Text>

          {logsRecentes.length === 0 ? (
            <Card style={styles.cardVazio}>
              <Card.Content>
                <Text style={styles.textoVazio}>Nenhum registro de auditoria</Text>
              </Card.Content>
            </Card>
          ) : (
            logsRecentes.map((log) => {
              const cor = acaoCores[log.acao] ?? cores.textoSecundario;
              const icone = acaoIcones[log.acao] ?? 'information';
              return (
                <Card key={log.id} style={[styles.card, { borderLeftColor: cor, borderLeftWidth: 4 }]}>
                  <Card.Content style={styles.logContent}>
                    <MaterialCommunityIcons name={icone as any} size={22} color={cor} style={styles.logIcone} />
                    <View style={styles.logInfo}>
                      <Text variant="titleSmall">{log.acao}</Text>
                      <Text variant="bodySmall" style={styles.textoSecundario}>
                        {log.usuarioNome} · {log.entidadeAfetada}
                      </Text>
                      <Text variant="bodySmall" style={styles.dataLog}>
                        {new Date(log.dataHora).toLocaleString('pt-BR')}
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              );
            })
          )}
        </>
      ) : (
        minhasConsultas.length === 0 ? (
          <Card style={styles.cardVazio}>
            <Card.Content>
              <Text style={styles.textoVazio}>Nenhuma consulta ativa no momento</Text>
            </Card.Content>
          </Card>
        ) : (
          minhasConsultas.map((c) => {
            const cor = statusCores[c.status] ?? cores.primaria;
            return (
              <Card key={c.id} style={[styles.card, { borderLeftColor: cor, borderLeftWidth: 4 }]}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Avatar.Text
                      size={40}
                      label={iniciais(c.nomePaciente)}
                      style={{ backgroundColor: cor }}
                    />
                    <View style={styles.cardInfo}>
                      <Text variant="titleMedium">{c.nomePaciente}</Text>
                      <Text variant="bodySmall" style={styles.textoSecundario}>
                        {c.nomeMedico} · {new Date(c.dataConsulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                  <Chip
                    style={{ backgroundColor: cor + '20' }}
                    textStyle={{ color: cor, fontWeight: 'bold' }}
                  >
                    {statusLabels[c.status]}
                  </Chip>
                </Card.Content>
              </Card>
            );
          })
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: 16 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saudacao: { fontWeight: 'bold', marginBottom: 4 },
  subtitulo: { color: cores.textoSecundario, marginBottom: 16 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  statChip: {},
  tituloSecao: { fontWeight: 'bold', marginBottom: 12 },
  card: { marginBottom: 12, borderRadius: 12 },
  cardContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cardInfo: { marginLeft: 12, flex: 1 },
  logContent: { flexDirection: 'row', alignItems: 'flex-start' },
  logIcone: { marginRight: 10, marginTop: 2 },
  logInfo: { flex: 1 },
  dataLog: { color: cores.textoDesabilitado, marginTop: 2, fontSize: 11 },
  textoSecundario: { color: cores.textoSecundario },
  cardVazio: { borderRadius: 12 },
  textoVazio: { textAlign: 'center', color: cores.textoDesabilitado, paddingVertical: 20 },
});