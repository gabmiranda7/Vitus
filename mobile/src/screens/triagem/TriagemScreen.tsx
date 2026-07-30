import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Avatar, Button, ProgressBar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import { Consulta } from '../../types';
import { corAvatar, iniciais, cores } from '../../theme';
import TriagemModal from '../../components/TriagemModal';

const statusConfig: Record<string, { label: string; cor: string }> = {
  Agendada: { label: 'Agendada', cor: cores.primaria },
  EmTriagem: { label: 'Em Triagem', cor: cores.aviso },
  AguardandoAtendimento: { label: 'Aguardando', cor: cores.info },
};

function minutosEspera(dataConsulta: string): number {
  return Math.max(0, Math.floor((new Date().getTime() - new Date(dataConsulta).getTime()) / 1000 / 60));
}

function tempoLabel(min: number): string {
  if (min < 1) return 'Agora';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function TriagemScreen() {
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalTriagem, setModalTriagem] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 60000);
    return () => clearInterval(interval);
  }, []);

  async function carregar() {
    try {
      const response = await api.get('/api/consultas');
      setConsultas(response.data.filter((c: Consulta) =>
        ['Agendada', 'EmTriagem', 'AguardandoAtendimento'].includes(c.status)
      ));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    carregar();
  }

  async function aguardarAtendimento(id: string) {
    await api.patch(`/api/consultas/${id}/aguardar-atendimento`);
    carregar();
  }

  function abrirTriagem(c: Consulta) {
    setConsultaSelecionada(c);
    setModalTriagem(true);
  }

  function fecharModal() {
    setModalTriagem(false);
    setConsultaSelecionada(null);
  }

  function onSucessoTriagem() {
    fecharModal();
    carregar();
  }

  const agendadas = consultas.filter(c => c.status === 'Agendada');
  const emTriagem = consultas.filter(c => c.status === 'EmTriagem');
  const aguardando = consultas.filter(c => c.status === 'AguardandoAtendimento');

  const ordenadas = [...consultas].sort((a, b) => {
    const ordem: Record<string, number> = { EmTriagem: 0, AguardandoAtendimento: 1, Agendada: 2 };
    const diff = (ordem[a.status] ?? 99) - (ordem[b.status] ?? 99);
    if (diff !== 0) return diff;
    return minutosEspera(b.dataConsulta) - minutosEspera(a.dataConsulta);
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
      <ScrollView
        contentContainerStyle={styles.conteudo}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.statsRow}>
          <Chip icon="calendar" style={[styles.statChip, { backgroundColor: cores.primaria + '20' }]} textStyle={{ color: cores.primaria }}>
            {agendadas.length} agendadas
          </Chip>
          <Chip icon="stethoscope" style={[styles.statChip, { backgroundColor: cores.aviso + '20' }]} textStyle={{ color: cores.aviso }}>
            {emTriagem.length} em triagem
          </Chip>
          <Chip icon="clock-outline" style={[styles.statChip, { backgroundColor: cores.info + '20' }]} textStyle={{ color: cores.info }}>
            {aguardando.length} aguardando
          </Chip>
        </View>

        {ordenadas.length === 0 ? (
          <View style={styles.vazioContainer}>
            <MaterialCommunityIcons name="stethoscope" size={64} color="#ccc" />
            <Text style={styles.textoVazio}>Nenhum paciente na fila</Text>
          </View>
        ) : (
          ordenadas.map((c) => {
            const min = minutosEspera(c.dataConsulta);
            const progresso = Math.min(min / 30, 1);
            const cfg = statusConfig[c.status] ?? { label: c.status, cor: cores.primaria };

            return (
              <Card key={c.id} style={[styles.card, { borderLeftColor: cfg.cor, borderLeftWidth: 4 }]}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Chip compact style={{ backgroundColor: cfg.cor + '20' }} textStyle={{ color: cfg.cor, fontSize: 11 }}>
                      {cfg.label}
                    </Chip>
                    <Text variant="bodySmall" style={styles.hora}>
                      {new Date(c.dataConsulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  <View style={styles.pacienteRow}>
                    <Avatar.Text size={44} label={iniciais(c.nomePaciente)} style={{ backgroundColor: corAvatar(c.nomePaciente) }} />
                    <View style={styles.pacienteInfo}>
                      <Text variant="titleMedium">{c.nomePaciente}</Text>
                      <Text variant="bodySmall" style={styles.textoSecundario}>{c.nomeMedico}</Text>
                    </View>
                  </View>

                  <View style={styles.esperaRow}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color={cfg.cor} />
                    <Text variant="bodySmall" style={{ color: cfg.cor, marginLeft: 4, fontWeight: '600' }}>
                      Esperando {tempoLabel(min)}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={progresso}
                    color={progresso >= 1 ? cores.erro : progresso >= 0.5 ? cores.aviso : cores.sucesso}
                    style={styles.barra}
                  />

                  {c.status === 'Agendada' && (
                    <Button
                      mode="contained"
                      buttonColor={cores.aviso}
                      icon="stethoscope"
                      onPress={() => abrirTriagem(c)}
                      style={styles.botao}
                    >
                      Iniciar Triagem
                    </Button>
                  )}
                  {c.status === 'EmTriagem' && (
                    <Button
                      mode="contained"
                      buttonColor={cores.info}
                      icon="heart-pulse"
                      onPress={() => aguardarAtendimento(c.id)}
                      style={styles.botao}
                    >
                      Enviar para Atendimento
                    </Button>
                  )}
                  {c.status === 'AguardandoAtendimento' && (
                    <View style={styles.aguardandoBox}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color={cores.info} />
                      <Text style={{ color: cores.info, marginLeft: 6, fontWeight: '600' }}>Aguardando médico</Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      <TriagemModal
        visible={modalTriagem}
        consultaId={consultaSelecionada?.id ?? null}
        onClose={fecharModal}
        onSucesso={onSucessoTriagem}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  conteudo: { padding: 16 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statChip: {},
  card: { marginBottom: 12, borderRadius: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  hora: { color: '#999' },
  pacienteRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  pacienteInfo: { marginLeft: 12, flex: 1 },
  textoSecundario: { color: '#666' },
  esperaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  barra: { height: 6, borderRadius: 3, marginBottom: 12 },
  botao: { borderRadius: 8 },
  aguardandoBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e1f5fe', padding: 10, borderRadius: 8 },
  vazioContainer: { alignItems: 'center', marginTop: 60 },
  textoVazio: { color: '#999', marginTop: 12, fontSize: 16 },
});