import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Avatar, Searchbar, ActivityIndicator, Chip, useTheme } from 'react-native-paper';
import api from '../../services/api';
import { Medico } from '../../types';
import { cores } from '../../theme';

function iniciais(nome: string) {
  return nome.replace(/^Dr\.?\s*/i, '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

const CORES_ESP: Record<string, string> = {
  'Cardiologia': '#c62828', 'Pediatria': '#1565c0', 'Ortopedia': '#2e7d32',
  'Neurologia': '#6a1b9a', 'Dermatologia': '#e65100', 'Ginecologia': '#ad1457',
  'Clínico Geral': '#00695c', 'Oftalmologia': '#0277bd', 'Psiquiatria': '#4527a0',
};

function corEspecialidade(esp: string) {
  return CORES_ESP[esp] ?? cores.primaria;
}

export default function MedicosScreen() {
  const theme = useTheme();
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const response = await api.get('/api/medicos');
      setMedicos(response.data);
      setErro('');
    } catch (e: any) {
      setErro(e.mensagemBack ?? 'Erro ao carregar médicos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    carregar();
  }

  const q = busca.trim().toLowerCase();
  const filtrados = medicos.filter(m =>
    !q ||
    m.nome.toLowerCase().includes(q) ||
    m.especialidade.toLowerCase().includes(q) ||
    m.crm.toLowerCase().includes(q)
  );

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar por nome, especialidade ou CRM..."
        value={busca}
        onChangeText={setBusca}
        style={styles.busca}
      />

      <ScrollView
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        {filtrados.length === 0 ? (
          <Text style={[styles.textoVazio, { color: theme.colors.onSurfaceVariant }]}>
            {erro ? '' : 'Nenhum médico encontrado'}
          </Text>
        ) : (
          filtrados.map((m) => {
            const cor = corEspecialidade(m.especialidade);
            return (
              <Card key={m.id} style={[styles.card, { borderLeftColor: cor, borderLeftWidth: 4 }]}>
                <Card.Content style={styles.cardContent}>
                  <Avatar.Text size={44} label={iniciais(m.nome)} style={{ backgroundColor: cor }} />
                  <View style={styles.info}>
                    <Text variant="titleMedium">{m.nome}</Text>
                    <Chip
                      compact
                      style={{ backgroundColor: cor + (theme.dark ? '33' : '20'), alignSelf: 'flex-start', marginTop: 4 }}
                      textStyle={{ color: theme.dark ? '#e8eef5' : cor, fontSize: 11 }}
                    >
                      {m.especialidade}
                    </Chip>
                    <Text variant="bodySmall" style={[styles.crm, { color: theme.colors.onSurfaceVariant }]}>
                      CRM: {m.crm}
                    </Text>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}

        <Text variant="bodySmall" style={[styles.rodape, { color: theme.colors.onSurfaceVariant }]}>
          Novos médicos entram pelo cadastro de conta e aparecem aqui depois de aprovados pelo administrador.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  busca: { margin: 16, marginBottom: 8 },
  lista: { padding: 16, paddingTop: 8, paddingBottom: 32 },
  card: { marginBottom: 10, borderRadius: 12 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  info: { marginLeft: 12, flex: 1 },
  crm: { marginTop: 4 },
  textoVazio: { textAlign: 'center', marginTop: 40 },
  rodape: { textAlign: 'center', marginTop: 16 },
  erro: { color: cores.erro, textAlign: 'center', marginBottom: 12 },
});