import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, ActivityIndicator, Divider, Chip } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import api from '../services/api';
import { Prontuario } from '../types';

export default function HistoricoReceitasScreen() {
  const route = useRoute<any>();
  const { pacienteId } = route.params;
  const [prontuario, setProntuario] = useState<Prontuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {prontuario.receitas.length === 0 ? (
        <Text style={styles.textoVazio}>Nenhuma receita registrada</Text>
      ) : (
        prontuario.receitas.map((r) => {
          const consulta = prontuario.consultas.find(c => c.id === r.consultaId);
          return (
            <Card key={r.id} style={styles.card}>
              <Card.Content>
                {consulta && (
                  <Text variant="bodySmall" style={styles.dataConsulta}>
                    {new Date(consulta.dataConsulta).toLocaleDateString('pt-BR')} · {consulta.nomeMedico}
                  </Text>
                )}
                <Divider style={styles.divider} />
                {r.medicamentos.map((m, i) => (
                  <View key={i} style={styles.medicamento}>
                    <Text variant="titleSmall">{m.nome}</Text>
                    <Text variant="bodySmall" style={styles.detalheMed}>
                      {m.dosagem && `${m.dosagem} · `}{m.posologia}
                    </Text>
                  </View>
                ))}
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
  card: { marginBottom: 12, borderRadius: 12 },
  dataConsulta: { color: '#666', marginBottom: 4 },
  divider: { marginBottom: 10 },
  medicamento: { marginBottom: 8 },
  detalheMed: { color: '#666' },
  textoVazio: { textAlign: 'center', color: '#999', marginTop: 40 },
  erro: { color: '#d32f2f' },
});