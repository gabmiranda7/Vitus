import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Avatar, Searchbar, ActivityIndicator, Chip, TextInput, SegmentedButtons, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import api from '../../services/api';
import { AcompanhamentoPaciente, Paciente, Tratamento } from '../../types';
import { cores, corAvatar, iniciais } from '../../theme';
import { situacaoVencimento } from '../../utils/vencimento';

const SITUACOES = [
  { value: 'todos', label: 'Todos os pacientes' },
  { value: 'acompanhados', label: 'Com receita acompanhada' },
  { value: 'vencidas', label: 'Receita vencida' },
  { value: 'a_vencer', label: 'A vencer em até...' },
];

export default function PacientesProntuarioScreen() {
  const navigation = useNavigation<any>();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [acompanhamentos, setAcompanhamentos] = useState<AcompanhamentoPaciente[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [situacao, setSituacao] = useState('todos');
  const [prazo, setPrazo] = useState('30');
  const [unidade, setUnidade] = useState('dias');
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const [rPacientes, rAcompanhamento] = await Promise.all([
        api.get('/api/Paciente'),
        api.get('/api/prontuarios/acompanhamento').catch(() => ({ data: [] })),
      ]);
      setPacientes(rPacientes.data);
      setAcompanhamentos(rAcompanhamento.data);
    } finally {
      setLoading(false);
    }
  }

  const tratamentosPorPaciente = new Map<string, Tratamento[]>(
    acompanhamentos.map(a => [a.pacienteId, a.tratamentos])
  );

  function passaSituacao(trats: Tratamento[]): boolean {
    if (situacao === 'todos') return true;
    if (situacao === 'acompanhados') return trats.length > 0;
    if (situacao === 'vencidas') return trats.some(t => t.diasRestantes < 0);

    const n = Number(prazo);
    if (!n || n < 1) return trats.some(t => t.diasRestantes >= 0);
    if (unidade === 'dias') return trats.some(t => t.diasRestantes >= 0 && t.diasRestantes <= n);

    const limite = new Date();
    limite.setMonth(limite.getMonth() + n);
    return trats.some(t => t.diasRestantes >= 0 && new Date(t.dataVencimento + 'T00:00:00') <= limite);
  }

  const temFiltroAtivo = situacao !== 'todos';

  const filtrados = pacientes
    .filter(p =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) &&
      passaSituacao(tratamentosPorPaciente.get(p.id) ?? [])
    )
    .sort((a, b) => {
      if (!temFiltroAtivo) return 0;
      const da = tratamentosPorPaciente.get(a.id)?.[0]?.diasRestantes ?? Infinity;
      const db = tratamentosPorPaciente.get(b.id)?.[0]?.diasRestantes ?? Infinity;
      return da - db;
    });

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.buscaLinha}>
        <Searchbar
          placeholder="Buscar paciente..."
          value={busca}
          onChangeText={setBusca}
          style={styles.buscaInput}
        />
        <Button
          mode={temFiltroAtivo ? 'contained' : 'outlined'}
          icon={filtrosVisiveis ? 'filter-variant-remove' : 'filter-variant'}
          onPress={() => setFiltrosVisiveis(v => !v)}
          compact
        >
          Filtros{temFiltroAtivo ? ' (1)' : ''}
        </Button>
      </View>

      {filtrosVisiveis && (
        <View style={styles.painelFiltros}>
          <Text variant="labelLarge" style={styles.painelTitulo}>Receita</Text>
          <View style={styles.filtros}>
            {SITUACOES.map((s) => (
              <Chip
                key={s.value}
                compact
                selected={situacao === s.value}
                onPress={() => {
                  setSituacao(s.value);
                  if (s.value !== 'a_vencer') setFiltrosVisiveis(false);
                }}
              >
                {s.label}
              </Chip>
            ))}
          </View>

          {situacao === 'a_vencer' && (
            <View style={styles.prazoLinha}>
              <TextInput
                label="Prazo"
                value={prazo}
                onChangeText={(v) => setPrazo(v.replace(/\D/g, ''))}
                keyboardType="numeric"
                mode="outlined"
                dense
                maxLength={3}
                style={styles.prazoInput}
              />
              <SegmentedButtons
                value={unidade}
                onValueChange={setUnidade}
                buttons={[
                  { value: 'dias', label: 'dias' },
                  { value: 'meses', label: 'meses' },
                ]}
                style={styles.prazoUnidade}
              />
            </View>
          )}

          <View style={styles.painelRodape}>
            <Text variant="bodySmall" style={styles.textoSecundario}>
              {filtrados.length} de {pacientes.length} paciente(s)
            </Text>
            {temFiltroAtivo && (
              <Button compact textColor={cores.erro} onPress={() => setSituacao('todos')}>
                Limpar
              </Button>
            )}
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.lista}>
        {filtrados.length === 0 ? (
          <Text style={styles.textoVazio}>Nenhum paciente encontrado</Text>
        ) : (
          filtrados.map((p) => {
            const t = tratamentosPorPaciente.get(p.id)?.[0];
            const s = t ? situacaoVencimento(t.diasRestantes) : null;
            return (
              <Card
                key={p.id}
                style={styles.card}
                onPress={() => navigation.navigate('ProntuarioDetalhe', { pacienteId: p.id, nomePaciente: p.nome })}
              >
                <Card.Content style={styles.cardContent}>
                  <Avatar.Text size={44} label={iniciais(p.nome)} style={{ backgroundColor: corAvatar(p.nome) }} />
                  <View style={styles.info}>
                    <Text variant="titleMedium">{p.nome}</Text>
                    {p.cpf && <Text variant="bodySmall" style={styles.textoSecundario}>CPF: {p.cpf}</Text>}
                    {t && s && (
                      <Chip
                        compact
                        style={[styles.chipVencimento, { backgroundColor: s.cor + '20' }]}
                        textStyle={{ color: s.cor, fontSize: 11, fontWeight: '700' }}
                      >
                        Receita {s.label} · {t.medicamento}
                      </Chip>
                    )}
                  </View>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buscaLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    marginBottom: 8,
  },
  buscaInput: {
    flex: 1,
  },
  painelFiltros: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  painelTitulo: {
    color: cores.textoSecundario,
    marginBottom: 8,
  },
  filtros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  prazoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  painelRodape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  prazoInput: {
    width: 90,
    backgroundColor: 'white',
  },
  prazoUnidade: {
    flex: 1,
  },
  lista: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    marginBottom: 10,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  chipVencimento: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  textoSecundario: {
    color: cores.textoSecundario,
  },
  textoVazio: {
    textAlign: 'center',
    color: cores.textoDesabilitado,
    marginTop: 40,
  },
});