import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text, Button, Searchbar, List, Chip } from 'react-native-paper';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import api from '../services/api';
import { Medico, Paciente } from '../types';
import { cores } from '../theme';
import ModalComTeclado from './ModalComTeclado';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSucesso: () => void;
}

const TOLERANCIA_MS = 15 * 60000;

function sugestaoHorario() {
  return new Date(Date.now() + 10 * 60000);
}

export default function NovaConsultaModal({ visible, onClose, onSucesso }: Props) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [busca, setBusca] = useState('');
  const [pacienteId, setPacienteId] = useState('');
  const [medicoId, setMedicoId] = useState('');
  const [data, setData] = useState<Date>(sugestaoHorario());
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setBusca('');
    setPacienteId('');
    setMedicoId('');
    setData(sugestaoHorario());
    setPicker(null);
    setErro('');

    Promise.all([api.get('/api/Paciente'), api.get('/api/medicos')])
      .then(([rPacientes, rMedicos]) => {
        setPacientes(rPacientes.data);
        setMedicos(rMedicos.data);
      })
      .catch((e: any) => setErro(e.mensagemBack ?? 'Erro ao carregar pacientes e médicos'));
  }, [visible]);

  const pacienteSelecionado = pacientes.find(p => p.id === pacienteId);

  const resultados = [...pacientes]
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .filter(p => p.nome.toLowerCase().includes(busca.trim().toLowerCase()))
    .slice(0, 5);

  function aoEscolher(modo: 'date' | 'time') {
    return (event: DateTimePickerEvent, escolhida?: Date) => {
      if (Platform.OS === 'android') setPicker(null);
      if (event.type !== 'set' || !escolhida) return;

      setData(atual => {
        const novo = new Date(atual);
        if (modo === 'date') {
          novo.setFullYear(escolhida.getFullYear(), escolhida.getMonth(), escolhida.getDate());
        } else {
          novo.setHours(escolhida.getHours(), escolhida.getMinutes(), 0, 0);
        }
        return novo;
      });
    };
  }

  async function agendar() {
    setErro('');
    if (!pacienteId) return setErro('Selecione o paciente');
    if (!medicoId) return setErro('Selecione o médico');
    if (data.getTime() < Date.now() - TOLERANCIA_MS) {
      return setErro('Data da consulta não pode ser no passado');
    }

    setSalvando(true);
    try {
      await api.post('/api/consultas', { pacienteId, medicoId, dataConsulta: data.toISOString() });
      onSucesso();
    } catch (e: any) {
      setErro(e.mensagemBack ?? 'Erro ao agendar consulta');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <ModalComTeclado visible={visible} onDismiss={onClose}>
      <Text variant="titleLarge" style={styles.titulo}>Nova Consulta</Text>
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}

      <Text variant="labelLarge" style={styles.rotulo}>Paciente</Text>
      {pacienteSelecionado ? (
        <Chip icon="account" onClose={() => setPacienteId('')} style={styles.chipSelecionado}>
          {pacienteSelecionado.nome}
        </Chip>
      ) : (
        <>
          <Searchbar
            placeholder="Buscar paciente..."
            value={busca}
            onChangeText={setBusca}
            style={styles.busca}
          />
          {resultados.length === 0 ? (
            <Text style={styles.vazio}>Nenhum paciente encontrado</Text>
          ) : (
            resultados.map(p => (
              <List.Item
                key={p.id}
                title={p.nome}
                description={p.cpf ? `CPF: ${p.cpf}` : undefined}
                left={props => <List.Icon {...props} icon="account-outline" />}
                onPress={() => setPacienteId(p.id)}
              />
            ))
          )}
        </>
      )}

      <Text variant="labelLarge" style={styles.rotulo}>Médico</Text>
      <View style={styles.chips}>
        {medicos.map(m => (
          <Chip
            key={m.id}
            compact
            selected={medicoId === m.id}
            onPress={() => setMedicoId(m.id)}
          >
            {m.nome} · {m.especialidade}
          </Chip>
        ))}
      </View>

      <Text variant="labelLarge" style={styles.rotulo}>Data e horário</Text>
      <View style={styles.linha}>
        <Button
          mode="outlined" icon="calendar" style={styles.flex1}
          onPress={() => setPicker(picker === 'date' ? null : 'date')}
        >
          {data.toLocaleDateString('pt-BR')}
        </Button>
        <Button
          mode="outlined" icon="clock-outline" style={styles.flex1}
          onPress={() => setPicker(picker === 'time' ? null : 'time')}
        >
          {data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </Button>
      </View>

      {picker && (
        <DateTimePicker
          value={data}
          mode={picker}
          is24Hour
          minimumDate={picker === 'date' ? new Date() : undefined}
          onChange={aoEscolher(picker)}
        />
      )}

      <View style={styles.botoes}>
        <Button onPress={onClose} disabled={salvando}>Cancelar</Button>
        <Button mode="contained" icon="calendar-check" onPress={agendar} loading={salvando} disabled={salvando}>
          Agendar
        </Button>
      </View>
    </ModalComTeclado>
  );
}

const styles = StyleSheet.create({
  titulo: { fontWeight: 'bold', marginBottom: 12 },
  erro: { color: cores.erro, marginBottom: 12 },
  rotulo: { marginTop: 12, marginBottom: 8, color: cores.textoSecundario },
  busca: { marginBottom: 4 },
  vazio: { color: cores.textoDesabilitado, paddingVertical: 8 },
  chipSelecionado: { alignSelf: 'flex-start' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  linha: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
  botoes: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20 },
});