import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Avatar, Searchbar, ActivityIndicator, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { Paciente } from '../../types';
import { cores, corAvatar, iniciais } from '../../theme';

export default function PacientesReceitasScreen() {
  const navigation = useNavigation<any>();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const response = await api.get('/api/Paciente');
      setPacientes(response.data);
    } finally {
      setLoading(false);
    }
  }

  const filtrados = pacientes.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
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
        placeholder="Buscar paciente..."
        value={busca}
        onChangeText={setBusca}
        style={styles.busca}
      />
      <ScrollView contentContainerStyle={styles.lista}>
        {filtrados.length === 0 ? (
          <Text style={styles.textoVazio}>Nenhum paciente encontrado</Text>
        ) : (
          filtrados.map((p) => (
            <Card
              key={p.id}
              style={styles.card}
              onPress={() => navigation.navigate('HistoricoReceitas', { pacienteId: p.id, nomePaciente: p.nome })}
            >
              <Card.Content style={styles.cardContent}>
                <Avatar.Text size={44} label={iniciais(p.nome)} style={{ backgroundColor: corAvatar(p.nome) }} />
                <View style={styles.info}>
                  <Text variant="titleMedium">{p.nome}</Text>
                </View>
                <Chip icon="pill" compact>Ver receitas</Chip>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  busca: { margin: 16, marginBottom: 8 },
  lista: { padding: 16, paddingTop: 8 },
  card: { marginBottom: 10, borderRadius: 12 },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  info: { marginLeft: 4, flex: 1 },
  textoVazio: { textAlign: 'center', color: cores.textoDesabilitado, marginTop: 40 },
});