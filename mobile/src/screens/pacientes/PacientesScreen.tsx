import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  Text, Card, Avatar, Searchbar, ActivityIndicator, FAB,
  TextInput, Button, IconButton, SegmentedButtons
} from 'react-native-paper';
import api from '../../services/api';
import { Paciente } from '../../types';
import { cores, corAvatar, iniciais } from '../../theme';
import ModalComTeclado from '../../components/ModalComTeclado';

function calcularIdade(dataNascimento?: string): string {
  if (!dataNascimento) return '';
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return `${idade} anos`;
}

function formatarCpf(valor: string): string {
  const s = valor.replace(/\D/g, '').slice(0, 11);
  if (s.length <= 3) return s;
  if (s.length <= 6) return `${s.slice(0, 3)}.${s.slice(3)}`;
  if (s.length <= 9) return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6)}`;
  return `${s.slice(0, 3)}.${s.slice(3, 6)}.${s.slice(6, 9)}-${s.slice(9, 11)}`;
}

function formatarCartaoSus(valor: string): string {
  const s = valor.replace(/\D/g, '').slice(0, 15);
  if (s.length <= 3) return s;
  if (s.length <= 7) return `${s.slice(0, 3)}.${s.slice(3)}`;
  if (s.length <= 11) return `${s.slice(0, 3)}.${s.slice(3, 7)}.${s.slice(7)}`;
  return `${s.slice(0, 3)}.${s.slice(3, 7)}.${s.slice(7, 11)}.${s.slice(11, 15)}`;
}

function formatarDataBr(valor: string): string {
  const s = valor.replace(/\D/g, '').slice(0, 8);
  if (s.length <= 2) return s;
  if (s.length <= 4) return `${s.slice(0, 2)}/${s.slice(2)}`;
  return `${s.slice(0, 2)}/${s.slice(2, 4)}/${s.slice(4, 8)}`;
}

function dataBrParaIso(dataBr: string): string {
  const partes = dataBr.split('/');
  if (partes.length !== 3) return '';
  const [dia, mes, ano] = partes;
  if (dia.length !== 2 || mes.length !== 2 || ano.length !== 4) return '';
  return `${ano}-${mes}-${dia}`;
}

function dataIsoParaBr(dataIso: string): string {
  const partes = dataIso.substring(0, 10).split('-');
  if (partes.length !== 3) return '';
  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
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
      dataNascimento: p.dataNascimento ? dataIsoParaBr(p.dataNascimento) : '',
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
        dataNascimento: form.dataNascimento ? dataBrParaIso(form.dataNascimento) : null,
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

      <ModalComTeclado visible={modalAberto} onDismiss={fechar}>
        <Text variant="titleLarge" style={styles.tituloModal}>
          {editando ? 'Editar Paciente' : 'Novo Paciente'}
        </Text>
        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <TextInput label="Nome completo *" value={form.nome} onChangeText={(v) => setField('nome', v)}
          mode="outlined" style={styles.input} />
        <TextInput label="CPF" value={form.cpf} onChangeText={(v) => setField('cpf', formatarCpf(v))}
          mode="outlined" style={styles.input} placeholder="000.000.000-00"
          keyboardType="numeric" maxLength={14} />
        <TextInput label="Cartão SUS" value={form.cartaoSus} onChangeText={(v) => setField('cartaoSus', formatarCartaoSus(v))}
          mode="outlined" style={styles.input} placeholder="000.0000.0000.0000"
          keyboardType="numeric" maxLength={18} />
        <TextInput label="Data de Nascimento" value={form.dataNascimento} onChangeText={(v) => setField('dataNascimento', formatarDataBr(v))}
          mode="outlined" style={styles.input} placeholder="DD/MM/AAAA"
          keyboardType="numeric" maxLength={10} />

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

        <TextInput label="Nome do Pai" value={form.nomePai} onChangeText={(v) => setField('nomePai', v)}
          mode="outlined" style={styles.input} />
        <TextInput label="Nome da Mãe" value={form.nomeMae} onChangeText={(v) => setField('nomeMae', v)}
          mode="outlined" style={styles.input} />
        <TextInput label="Profissão" value={form.profissao} onChangeText={(v) => setField('profissao', v)}
          mode="outlined" style={styles.input} />
        <TextInput label="Endereço" value={form.endereco} onChangeText={(v) => setField('endereco', v)}
          mode="outlined" style={styles.input} multiline />
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
      </ModalComTeclado>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  busca: { margin: 16, marginBottom: 8 },
  lista: { padding: 16, paddingTop: 8, paddingBottom: 80 },
  card: { marginBottom: 10, borderRadius: 12 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  info: { marginLeft: 12, flex: 1 },
  textoSecundario: { color: cores.textoSecundario },
  textoVazio: { textAlign: 'center', color: cores.textoDesabilitado, marginTop: 40 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: cores.primaria },
  tituloModal: { marginBottom: 16, fontWeight: 'bold' },
  label: { marginBottom: 8, marginTop: 4 },
  segmented: { marginBottom: 12 },
  input: { marginBottom: 12 },
  botoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  erro: { color: cores.erro, marginBottom: 12 },
});