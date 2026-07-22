import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Avatar } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Consulta {
  id: string;
  nomePaciente: string;
  nomeMedico: string;
  dataConsulta: string;
  status: string;
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

export default function DashboardScreen() {
  const { usuario } = useAuth();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const response = await api.get('/api/consultas');
      setConsultas(response.data);
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
        {usuario?.perfil === 'Medico' ? 'Minhas consultas ativas' : 'Consultas ativas'}
      </Text>

      {minhasConsultas.length === 0 ? (
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
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  conteudo: {
    padding: 16,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saudacao: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitulo: {
    color: '#666',
    marginBottom: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  textoSecundario: {
    color: '#666',
  },
  cardVazio: {
    borderRadius: 12,
  },
  textoVazio: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
  },
});