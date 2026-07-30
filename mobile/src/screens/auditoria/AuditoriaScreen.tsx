import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { AuditoriaLog } from '../../types';

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

export default function AuditoriaScreen() {
  const [logs, setLogs] = useState<AuditoriaLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

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
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {logs.length === 0 ? (
        <Text style={styles.textoVazio}>Nenhum registro de auditoria</Text>
      ) : (
        logs
          .sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
          .map((log) => {
            const cor = acaoCores[log.acao] ?? '#666';
            const icone = acaoIcones[log.acao] ?? 'information';
            return (
              <Card key={log.id} style={[styles.card, { borderLeftColor: cor, borderLeftWidth: 4 }]}>
                <Card.Content style={styles.cardContent}>
                  <MaterialCommunityIcons name={icone as any} size={24} color={cor} style={styles.icone} />
                  <View style={styles.info}>
                    <Text variant="titleSmall">{log.acao}</Text>
                    <Text variant="bodySmall" style={styles.textoSecundario}>
                      {log.usuarioNome} · {log.entidadeAfetada}
                    </Text>
                    <Text variant="bodySmall" style={styles.data}>
                      {new Date(log.dataHora).toLocaleString('pt-BR')}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            );
          })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  conteudo: { padding: 16 },
  card: { marginBottom: 10, borderRadius: 12 },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
  icone: { marginRight: 12, marginTop: 2 },
  info: { flex: 1 },
  textoSecundario: { color: '#666' },
  data: { color: '#999', marginTop: 2, fontSize: 11 },
  textoVazio: { textAlign: 'center', color: '#999', marginTop: 40 },
  erro: { color: '#d32f2f' },
});