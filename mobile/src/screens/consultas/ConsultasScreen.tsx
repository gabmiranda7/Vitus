import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Avatar, Button, Portal, Modal, SegmentedButtons } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Consulta, statusCores, statusLabels } from '../../types';
import { cores, iniciais } from '../../theme';
import TriagemModal from '../../components/TriagemModal';
import AnotacaoModal from '../../components/AnotacaoModal';
import ReceitaModal from '../../components/ReceitaModal';
import ExameModal from '../../components/ExameModal';
import ConfirmModal from '../../components/ConfirmModal';

const statusAtivos = ['Agendada', 'EmTriagem', 'AguardandoAtendimento', 'EmAtendimento'];
const statusHistorico = ['Finalizada', 'Cancelada'];

export default function ConsultasScreen() {
  const { usuario } = useAuth();
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [aba, setAba] = useState('ativas');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [consultaSelecionada, setConsultaSelecionada] = useState<Consulta | null>(null);
  const [modalAcoes, setModalAcoes] = useState(false);
  const [modalTriagem, setModalTriagem] = useState(false);
  const [modalAnotacao, setModalAnotacao] = useState(false);
  const [modalReceita, setModalReceita] = useState(false);
  const [modalExame, setModalExame] = useState(false);
  const [modalConfirm, setModalConfirm] = useState(false);
  const [confirmAcao, setConfirmAcao] = useState<{ acao: string; cor: string; titulo: string } | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    try {
      const response = await api.get('/api/consultas');
      setConsultas(response.data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() {
    setRefreshing(true);
    carregar();
  }

  const consultasAtivas = useMemo(() =>
    consultas.filter(c => statusAtivos.includes(c.status)), [consultas]);

  const consultasHistorico = useMemo(() =>
    consultas.filter(c => statusHistorico.includes(c.status)), [consultas]);

  const listaAtual = aba === 'ativas' ? consultasAtivas : consultasHistorico;

  function abrirAcoes(c: Consulta) {
    setConsultaSelecionada(c);
    setModalAcoes(true);
  }

  function fecharTudo() {
    setModalAcoes(false);
    setModalTriagem(false);
    setModalAnotacao(false);
    setModalReceita(false);
    setModalExame(false);
  }

  function onSucessoAcao() {
    fecharTudo();
    setConsultaSelecionada(null);
    carregar();
  }

  function pedirConfirmacao(acao: string, cor: string, titulo: string) {
    setModalAcoes(false);
    setConfirmAcao({ acao, cor, titulo });
    setModalConfirm(true);
  }

  async function confirmarAcao() {
    if (!confirmAcao || !consultaSelecionada) return;
    await api.patch(`/api/consultas/${consultaSelecionada.id}/${confirmAcao.acao}`);
    setModalConfirm(false);
    setConfirmAcao(null);
    setConsultaSelecionada(null);
    carregar();
  }

  async function acaoRapida(acao: string) {
    if (!consultaSelecionada) return;
    await api.patch(`/api/consultas/${consultaSelecionada.id}/${acao}`);
    setModalAcoes(false);
    setConsultaSelecionada(null);
    carregar();
  }

  if (loading) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <SegmentedButtons
          value={aba}
          onValueChange={setAba}
          buttons={[
            { value: 'ativas', label: `Ativas (${consultasAtivas.length})` },
            { value: 'historico', label: `Histórico (${consultasHistorico.length})` },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {listaAtual.length === 0 ? (
          <Text style={styles.textoVazio}>Nenhuma consulta encontrada</Text>
        ) : (
          listaAtual.map((c) => {
            const cor = statusCores[c.status] ?? cores.primaria;
            return (
              <Card
                key={c.id}
                style={[styles.card, { borderLeftColor: cor, borderLeftWidth: 4 }]}
                onPress={() => abrirAcoes(c)}
              >
                <Card.Content>
                  <View style={styles.cardTop}>
                    <Chip style={{ backgroundColor: cor + '20' }} textStyle={{ color: cor, fontWeight: 'bold' }}>
                      {statusLabels[c.status]}
                    </Chip>
                  </View>
                  <View style={styles.cardHeader}>
                    <Avatar.Text size={40} label={iniciais(c.nomePaciente)} style={{ backgroundColor: cor }} />
                    <View style={styles.cardInfo}>
                      <Text variant="titleMedium">{c.nomePaciente}</Text>
                      <Text variant="bodySmall" style={styles.textoSecundario}>{c.nomeMedico}</Text>
                    </View>
                  </View>
                  <Text variant="bodySmall" style={styles.data}>
                    {new Date(c.dataConsulta).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(c.dataConsulta).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </Card.Content>
              </Card>
            );
          })
        )}
      </ScrollView>

      {/* Modal de ações */}
      <Portal>
        <Modal visible={modalAcoes} onDismiss={() => setModalAcoes(false)} contentContainerStyle={styles.modalAcoes}>
          <Text variant="titleLarge" style={styles.tituloModal}>{consultaSelecionada?.nomePaciente}</Text>
          <Text variant="bodyMedium" style={styles.subtituloModal}>{consultaSelecionada?.nomeMedico}</Text>

          <View style={styles.acoesLista}>
            {usuario?.perfil === 'Enfermeiro' && consultaSelecionada?.status === 'Agendada' && (
              <Button mode="contained" buttonColor={cores.aviso} icon="stethoscope" onPress={() => { setModalAcoes(false); setModalTriagem(true); }}>
                Iniciar Triagem
              </Button>
            )}
            {usuario?.perfil === 'Enfermeiro' && consultaSelecionada?.status === 'EmTriagem' && (
              <Button mode="contained" onPress={() => acaoRapida('aguardar-atendimento')}>
                Mover para Aguardando
              </Button>
            )}
            {usuario?.perfil === 'Medico' && consultaSelecionada?.status === 'AguardandoAtendimento' && (
              <Button mode="contained" icon="account" onPress={() => acaoRapida('iniciar-atendimento')}>
                Iniciar Atendimento
              </Button>
            )}
            {usuario?.perfil === 'Medico' && consultaSelecionada?.status === 'EmAtendimento' && (<>
              <Button mode="outlined" icon="note-edit" onPress={() => { setModalAcoes(false); setModalAnotacao(true); }}>
                Anotações Clínicas
              </Button>
              <Button mode="outlined" icon="pill" onPress={() => { setModalAcoes(false); setModalReceita(true); }}>
                Emitir Receita
              </Button>
              <Button mode="outlined" icon="flask" onPress={() => { setModalAcoes(false); setModalExame(true); }}>
                Registrar Exame
              </Button>
              <Button mode="contained" buttonColor={cores.sucesso} icon="check-circle" onPress={() => pedirConfirmacao('finalizar', cores.sucesso, 'Finalizar Consulta')}>
                Finalizar Consulta
              </Button>
            </>)}
            {['Recepcionista', 'Medico'].includes(usuario?.perfil ?? '') &&
              consultaSelecionada && !['Finalizada', 'Cancelada'].includes(consultaSelecionada.status) && (
                <Button mode="outlined" textColor={cores.erro} icon="close-circle" onPress={() => pedirConfirmacao('cancelar', cores.erro, 'Cancelar Consulta')}>
                  Cancelar Consulta
                </Button>
              )}
          </View>

          <Button onPress={() => setModalAcoes(false)} style={styles.fechar}>Fechar</Button>
        </Modal>
      </Portal>

      <TriagemModal
        visible={modalTriagem}
        consultaId={consultaSelecionada?.id ?? null}
        onClose={fecharTudo}
        onSucesso={onSucessoAcao}
      />
      <AnotacaoModal
        visible={modalAnotacao}
        consultaId={consultaSelecionada?.id ?? null}
        anotacaoAtual={consultaSelecionada?.anotacoes}
        onClose={fecharTudo}
        onSucesso={onSucessoAcao}
      />
      <ReceitaModal
        visible={modalReceita}
        consultaId={consultaSelecionada?.id ?? null}
        onClose={fecharTudo}
        onSucesso={onSucessoAcao}
      />
      <ExameModal
        visible={modalExame}
        consultaId={consultaSelecionada?.id ?? null}
        onClose={fecharTudo}
        onSucesso={onSucessoAcao}
      />
      <ConfirmModal
        visible={modalConfirm}
        titulo={confirmAcao?.titulo ?? ''}
        mensagem={`Tem certeza que deseja ${confirmAcao?.acao === 'cancelar' ? 'cancelar' : 'finalizar'} esta consulta?`}
        corBotao={confirmAcao?.cor ?? cores.primaria}
        onClose={() => setModalConfirm(false)}
        onConfirmar={confirmarAcao}
      />
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
  tabs: {
    padding: 16,
    paddingBottom: 8,
  },
  lista: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    marginLeft: 12,
  },
  textoSecundario: {
    color: cores.textoSecundario,
  },
  data: {
    color: cores.textoDesabilitado,
    marginTop: 8,
  },
  textoVazio: {
    textAlign: 'center',
    color: cores.textoDesabilitado,
    marginTop: 40,
  },
  modalAcoes: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  tituloModal: {
    fontWeight: 'bold',
  },
  subtituloModal: {
    color: cores.textoSecundario,
    marginBottom: 16,
  },
  acoesLista: {
    gap: 8,
  },
  fechar: {
    marginTop: 16,
  },
});