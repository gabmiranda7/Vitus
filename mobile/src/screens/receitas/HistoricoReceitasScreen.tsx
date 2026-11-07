import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, ActivityIndicator, Divider, Chip } from 'react-native-paper';
import { useRoute } from '@react-navigation/native';
import api from '../../services/api';
import { Consulta, Prontuario, Receita } from '../../types';
import { cores } from '../../theme';
import { situacaoVencimento, dataVencimentoBr, capitalizar } from '../../utils/vencimento';

// Receitas anteriores ao campo data_emissao ficam com data zerada no banco
function dataDaReceita(r: Receita, consulta?: Consulta): Date {
  const d = new Date(r.dataEmissao);
  if (d.getFullYear() < 2000 && consulta) return new Date(consulta.dataConsulta);
  return d;
}

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

  const receitas = prontuario.receitas
    .map(r => {
      const consulta = prontuario.consultas.find(c => c.id === r.consultaId);
      return { receita: r, consulta, data: dataDaReceita(r, consulta) };
    })
    .sort((a, b) => b.data.getTime() - a.data.getTime());

  const tratamentos = prontuario.tratamentos ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {tratamentos.length > 0 && (
        <View style={styles.secao}>
          <Text variant="titleMedium" style={styles.titulo}>Tratamentos acompanhados</Text>
          {tratamentos.map((t) => {
            const s = situacaoVencimento(t.diasRestantes);
            return (
              <Card
                key={`${t.receitaId}-${t.medicamento}`}
                style={[styles.card, { borderLeftColor: s.cor, borderLeftWidth: 4 }]}
              >
                <Card.Content>
                  <View style={styles.topo}>
                    <Text variant="titleSmall" style={styles.nomeTratamento}>{t.medicamento}</Text>
                    <Chip compact style={{ backgroundColor: s.cor + '20' }} textStyle={{ color: s.cor, fontSize: 11 }}>
                      {capitalizar(s.label)}
                    </Chip>
                  </View>
                  <Text variant="bodySmall" style={styles.detalheMed}>
                    Emitida em {new Date(t.dataEmissao).toLocaleDateString('pt-BR')} · validade de {t.validadeDias} dias · vence em {dataVencimentoBr(t.dataVencimento)}
                  </Text>
                </Card.Content>
              </Card>
            );
          })}
        </View>
      )}

      <Text variant="titleMedium" style={styles.titulo}>
        Receitas emitidas ({receitas.length})
      </Text>

      {receitas.length === 0 ? (
        <Text style={styles.textoVazio}>Nenhuma receita registrada</Text>
      ) : (
        receitas.map(({ receita: r, consulta, data }) => (
          <Card key={r.id} style={styles.card}>
            <Card.Content>
              <Text variant="bodySmall" style={styles.dataConsulta}>
                {data.toLocaleDateString('pt-BR')}{consulta ? ` · ${consulta.nomeMedico}` : ''}
              </Text>
              <Divider style={styles.divider} />
              {r.medicamentos.map((m, i) => (
                <View key={i} style={styles.medicamento}>
                  <Text variant="titleSmall">{m.nome}{m.dosagem ? ` ${m.dosagem}` : ''}</Text>
                  <Text variant="bodySmall" style={styles.detalheMed}>
                    {m.quantidade ? `${m.quantidade} · ` : ''}{m.posologia}
                  </Text>
                  {m.acompanharVencimento && m.validadeDias != null && (
                    <Chip compact icon="alarm" style={styles.chipAcompanhado} textStyle={{ fontSize: 11 }}>
                      Acompanhado · {m.validadeDias} dias
                    </Chip>
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundo },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  conteudo: { padding: 16 },
  secao: { marginBottom: 8 },
  titulo: { fontWeight: 'bold', marginBottom: 10 },
  card: { marginBottom: 12, borderRadius: 12 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  nomeTratamento: { fontWeight: '600', flex: 1, marginRight: 8 },
  dataConsulta: { color: cores.textoSecundario, marginBottom: 4 },
  divider: { marginBottom: 10 },
  medicamento: { marginBottom: 10 },
  detalheMed: { color: cores.textoSecundario },
  chipAcompanhado: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: '#e3f2fd' },
  textoVazio: { textAlign: 'center', color: cores.textoDesabilitado, marginTop: 40 },
  erro: { color: cores.erro },
});