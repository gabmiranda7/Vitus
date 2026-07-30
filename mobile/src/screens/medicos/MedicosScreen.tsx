import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Text, Card, Avatar, Searchbar, ActivityIndicator, FAB, Portal,
  Modal, TextInput, Button, Chip
} from 'react-native-paper';
import api from '../../services/api';
import { Medico } from '../../types';

function iniciais(nome: string) {
  return nome.replace(/^Dr\.?\s*/i, '').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

const CORES_ESP: Record<string, string> = {
  'Cardiologia': '#c62828', 'Pediatria': '#1565c0', 'Ortopedia': '#2e7d32',
  'Neurologia': '#6a1b9a', 'Dermatologia': '#e65100', 'Ginecologia': '#ad1457',
  'Clínico Geral': '#00695c', 'Oftalmologia': '#0277bd', 'Psiquiatria': '#4527a0',
};

function corEspecialidade(esp: string) {
  return CORES_ESP[esp] ?? '#1976d2';
}

export default function MedicosScreen() {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [crm, setCrm] = useState('');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const response = await api.get('/api/medicos');
      setMedicos(response.data);
    } finally {
      setLoading(false);
    }
  }

  function fechar() {
    setModalAberto(false);
    setNome(''); setEspecialidade(''); setCrm(''); setErro('');
  }

  async function salvar() {
    setErro('');
    if (!nome.trim() || !especialidade.trim() || !crm.trim()) {
      setErro('Preencha todos os campos');
      return;
    }
    setSalvando(true);
    try {
      await api.post('/api/medicos', { nome, especialidade, crm });
      fechar();
      carregar();
    } catch (e: any) {
      setErro(e.mensagemBack ?? 'Erro ao cadastrar médico');
    } finally {
      setSalvando(false);
    }
  }

  const filtrados = medicos.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase())
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
        placeholder="Buscar médico..."
        value={busca}
        onChangeText={setBusca}
        style={styles.busca}
      />

      <ScrollView contentContainerStyle={styles.lista}>
        {filtrados.length === 0 ? (
          <Text style={styles.textoVazio}>Nenhum médico encontrado</Text>
        ) : (
          filtrados.map((m) => {
            const cor = corEspecialidade(m.especialidade);
            return (
              <Card key={m.id} style={[styles.card, { borderLeftColor: cor, borderLeftWidth: 4 }]}>
                <Card.Content style={styles.cardContent}>
                  <Avatar.Text size={44} label={iniciais(m.nome)} style={{ backgroundColor: cor }} />
                  <View style={styles.info}>
                    <Text variant="titleMedium">{m.nome}</Text>
                    <Chip compact style={{ backgroundColor: cor + '20', alignSelf: 'flex-start', marginTop: 4 }} textStyle={{ color: cor, fontSize: 11 }}>
                      {m.especialidade}
                    </Chip>
                    <Text variant="bodySmall" style={styles.crm}>CRM: {m.crm}</Text>
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={() => setModalAberto(true)} />

      <Portal>
        <Modal visible={modalAberto} onDismiss={fechar} contentContainerStyle={styles.modal}>
          <Text variant="titleLarge" style={styles.tituloModal}>Novo Médico</Text>
          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <TextInput label="Nome completo" value={nome} onChangeText={setNome} mode="outlined" style={styles.input} />
          <TextInput label="Especialidade" value={especialidade} onChangeText={setEspecialidade} mode="outlined" style={styles.input} placeholder="ex: Clínico Geral" />
          <TextInput label="CRM" value={crm} onChangeText={setCrm} mode="outlined" style={styles.input} placeholder="ex: CRM-MG 12345" />

          <View style={styles.botoes}>
            <Button onPress={fechar} disabled={salvando}>Cancelar</Button>
            <Button mode="contained" onPress={salvar} loading={salvando} disabled={salvando}>
              Cadastrar
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  busca: { margin: 16, marginBottom: 8 },
  lista: { padding: 16, paddingTop: 8, paddingBottom: 80 },
  card: { marginBottom: 10, borderRadius: 12 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  info: { marginLeft: 12, flex: 1 },
  crm: { color: '#666', marginTop: 4 },
  textoVazio: { textAlign: 'center', color: '#999', marginTop: 40 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#1976d2' },
  modal: { backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 16 },
  tituloModal: { marginBottom: 16, fontWeight: 'bold' },
  input: { marginBottom: 12 },
  botoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  erro: { color: '#d32f2f', marginBottom: 12 },
});