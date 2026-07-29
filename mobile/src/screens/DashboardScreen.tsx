import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Avatar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Consulta {
  id: string;
  nomePaciente: string;
  nomeMedico: string;
  dataConsulta: string;
  status: string;
}

interface AuditoriaLog {
  id: string;
  acao: string;
  entidadeAfetada: string;
  usuarioNome: string;
  dataHora: string;
}

const statusCores: Record<string, string> = {
  Agendada: '#1976d2', EmTriagem: '#ed6c02', AguardandoAtendimento: '#0288d1',
  EmAtendimento: '#7b1fa2', Finalizada: '#2e7d32', Cancelada: '#d32f2f',
};

const statusLabels: Record<string, string> = {
  Agendada: 'Agendada', EmTriagem: 'Em Triagem',
  AguardandoAtendimento: 'Aguardando', EmAtendimento: 'Em Atendimento',
  Finalizada: 'Finalizada', Cancelada: 'Cancelada',
};

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
  CriacaoPaciente: '#2e7d32',
  EdicaoPaciente: '#1976d2',
  ExclusaoPaciente: '#d32f2f',
  CriacaoConsulta: '#1976d2',
  CancelamentoConsulta: '#d32f2f',
  EmissaoReceita: '#2e7d32',
  AcessoProntuario: '#7b1fa2',
  RegistroTriagem: '#ed6c02',
  RegistroExame: '#7b1fa2',
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
                style={[styles.statChip, { backgroundColor: (acaoCores[acao] ?? '#666') + '20' }]}
                textStyle={{ color: acaoCores[acao] ?? '#666' }}
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
              const cor = acaoCores[log.acao] ?? '#666';
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
            const cor = statusCores[c.status] ?? '#1976d2';
            return (
              <Card key={c.id} style={[styles.card, { borderLeftColor: cor, borderLeftWidth: 4 }]}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Avatar.Text
                      size={40}
                      label={c.nomePaciente.split(' ').slice(0, 2).map(n => n[0]).join('')}
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  conteudo: { padding: 16 },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  saudacao: { fontWeight: 'bold', marginBottom: 4 },
  subtitulo: { color: '#666', marginBottom: 16 },
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
  dataLog: { color: '#999', marginTop: 2, fontSize: 11 },
  textoSecundario: { color: '#666' },
  cardVazio: { borderRadius: 12 },
  textoVazio: { textAlign: 'center', color: '#999', paddingVertical: 20 },
});