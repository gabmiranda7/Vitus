import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Text, Card, Avatar, Searchbar, ActivityIndicator, FAB, Portal,
  Modal, TextInput, Button, IconButton, SegmentedButtons
} from 'react-native-paper';
import api from '../../services/api';
import { Paciente } from '../../types';

function iniciais(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

function corAvatar(nome: string) {
  const cores = ['#1976d2', '#388e3c', '#7b1fa2', '#c62828', '#f57c00', '#0097a7'];
  return cores[nome.charCodeAt(0) % cores.length];
}

function calcularIdade(dataNascimento?: string): string {
  if (!dataNascimento) return '';
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return `${idade} anos`;
}

const formVazio = () => ({
  nome: '', cpf: '', cartaoSus: '', dataNascimento: '', sexo: '',
  nomePai: '', nomeMae: '', endereco: '', profissao: '',
  estadoCivil: '', informacoesAdicionais: '',
});

export default function PacientesScreen() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Paciente | null>(null);
  const [form, setForm] = useState(formVazio());
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

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

  function setField(campo: string, valor: string) {
    setForm(f => ({ ...f, [campo]: valor }));
  }

  function abrirCadastro() {
    setEditando(null);
    setForm(formVazio());
    setErro('');
    setModalAberto(true);
  }

  function abrirEdicao(p: Paciente) {
    setEditando(p);
    setForm({
      nome: p.nome, cpf: p.cpf ?? '', cartaoSus: p.cartaoSus ?? '',
      dataNascimento: p.dataNascimento?.substring(0, 10) ?? '',
      sexo: p.sexo ?? '', nomePai: p.nomePai ?? '', nomeMae: p.nomeMae ?? '',
      endereco: p.endereco ?? '', profissao: p.profissao ?? '',
      estadoCivil: p.estadoCivil ?? '',
      informacoesAdicionais: p.informacoesAdicionais ?? '',
    });
    setErro('');
    setModalAberto(true);
  }

  function fechar() {
    setModalAberto(false);
    setEditando(null);
    setForm(formVazio());
    setErro('');
  }

  async function salvar() {
    setErro('');
    if (!form.nome.trim()) {
      setErro('Nome é obrigatório');
      return;
    }
    setSalvando(true);
    try {
      const payload = {
        nome: form.nome,
        cpf: form.cpf || null,
        cartaoSus: form.cartaoSus || null,
        dataNascimento: form.dataNascimento || null,
        sexo: form.sexo || null,
        nomePai: form.nomePai || null,
        nomeMae: form.nomeMae || null,
        endereco: form.endereco || null,
        profissao: form.profissao || null,
        estadoCivil: form.estadoCivil || null,
        informacoesAdicionais: form.informacoesAdicionais || null,
        aceitaTermos: true,
      };
      if (editando) {
        await api.put(`/api/Paciente/${editando.id}`, payload);
      } else {
        await api.post('/api/Paciente', payload);
      }
      fechar();
      carregar();
    } catch (e: any) {
      setErro(e.mensagemBack ?? 'Erro ao salvar paciente');
    } finally {
      setSalvando(false);
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
            <Card key={p.id} style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <Avatar.Text size={44} label={iniciais(p.nome)} style={{ backgroundColor: corAvatar(p.nome) }} />
                <View style={styles.info}>
                  <Text variant="titleMedium">{p.nome}</Text>
                  <Text variant="bodySmall" style={styles.textoSecundario}>
                    {[calcularIdade(p.dataNascimento), p.sexo].filter(Boolean).join(' · ') || 'Sem dados'}
                  </Text>
                </View>
                <IconButton icon="pencil" size={20} onPress={() => abrirEdicao(p)} />
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      <FAB icon="plus" style={styles.fab} onPress={abrirCadastro} />

      <Portal>
        <Modal visible={modalAberto} onDismiss={fechar} contentContainerStyle={styles.modal}>
          <ScrollView>
            <Text variant="titleLarge" style={styles.tituloModal}>
              {editando ? 'Editar Paciente' : 'Novo Paciente'}
            </Text>
            {erro ? <Text style={styles.erro}>{erro}</Text> : null}

            <TextInput label="Nome completo *" value={form.nome} onChangeText={(v) => setField('nome', v)} mode="outlined" style={styles.input} />
            <TextInput label="CPF" value={form.cpf} onChangeText={(v) => setField('cpf', v)} mode="outlined" style={styles.input} placeholder="000.000.000-00" />
            <TextInput label="Cartão SUS" value={form.cartaoSus} onChangeText={(v) => setField('cartaoSus', v)} mode="outlined" style={styles.input} />
            <TextInput label="Data de Nascimento" value={form.dataNascimento} onChangeText={(v) => setField('dataNascimento', v)} mode="outlined" style={styles.input} placeholder="AAAA-MM-DD" />

            <Text variant="labelLarge" style={styles.label}>Sexo</Text>
            <SegmentedButtons
              value={form.sexo}
              onValueChange={(v) => setField('sexo', v)}
              buttons={[
                { value: 'Masculino', label: 'M' },
                { value: 'Feminino', label: 'F' },
                { value: 'Outro', label: 'Outro' },
              ]}
              style={styles.segmented}
            />

            <TextInput label="Nome do Pai" value={form.nomePai} onChangeText={(v) => setField('nomePai', v)} mode="outlined" style={styles.input} />
            <TextInput label="Nome da Mãe" value={form.nomeMae} onChangeText={(v) => setField('nomeMae', v)} mode="outlined" style={styles.input} />
            <TextInput label="Profissão" value={form.profissao} onChangeText={(v) => setField('profissao', v)} mode="outlined" style={styles.input} />
            <TextInput label="Endereço" value={form.endereco} onChangeText={(v) => setField('endereco', v)} mode="outlined" style={styles.input} multiline />
            <TextInput
              label="Informações médicas adicionais"
              value={form.informacoesAdicionais}
              onChangeText={(v) => setField('informacoesAdicionais', v)}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={3}
              placeholder="Alergias, condições especiais..."
            />

            <View style={styles.botoes}>
              <Button onPress={fechar} disabled={salvando}>Cancelar</Button>
              <Button mode="contained" onPress={salvar} loading={salvando} disabled={salvando}>
                {editando ? 'Salvar' : 'Cadastrar'}
              </Button>
            </View>
          </ScrollView>
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
  textoSecundario: { color: '#666' },
  textoVazio: { textAlign: 'center', color: '#999', marginTop: 40 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#1976d2' },
  modal: { backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 16, maxHeight: '85%' },
  tituloModal: { marginBottom: 16, fontWeight: 'bold' },
  label: { marginBottom: 8, marginTop: 4 },
  segmented: { marginBottom: 12 },
  input: { marginBottom: 12 },
  botoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  erro: { color: '#d32f2f', marginBottom: 12 },
});