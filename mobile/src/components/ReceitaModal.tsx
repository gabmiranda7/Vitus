import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, SegmentedButtons, IconButton, Divider, Switch, Chip } from 'react-native-paper';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import api from '../services/api';
import { Medicamento } from '../types';

interface Props {
  visible: boolean;
  consultaId: string | null;
  onClose: () => void;
  onSucesso: () => void;
}

const ATALHOS = [
  { label: '30 dias', dias: 30 },
  { label: '3 meses', dias: 90 },
  { label: '6 meses', dias: 180 },
  { label: '1 ano', dias: 365 },
];

const VALIDADE_MAXIMA = 730;

const medVazio = (): Medicamento => ({
  nome: '', dosagem: '', posologia: '', quantidade: '',
  acompanharVencimento: false, validadeDias: null,
});

function vencimentoPrevisto(dias: number) {
  return new Date(Date.now() + dias * 86400000).toLocaleDateString('pt-BR');
}

export default function ReceitaModal({ visible, consultaId, onClose, onSucesso }: Props) {
  const [tipoReceita, setTipoReceita] = useState('Comum');
  const [tipoUso, setTipoUso] = useState('Oral');
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([medVazio()]);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  function limpar() {
    setTipoReceita('Comum'); setTipoUso('Oral'); setMedicamentos([medVazio()]); setErro('');
  }

  function addMed() {
    setMedicamentos(prev => [...prev, medVazio()]);
  }

  function removeMed(i: number) {
    setMedicamentos(prev => prev.filter((_, idx) => idx !== i));
  }

  function changeMed(i: number, campo: 'nome' | 'dosagem' | 'posologia' | 'quantidade', valor: string) {
    setMedicamentos(prev => prev.map((m, idx) => (idx === i ? { ...m, [campo]: valor } : m)));
  }

  function patchMed(i: number, patch: Partial<Medicamento>) {
    setMedicamentos(prev => prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }

  async function gerar() {
    if (!consultaId) return;
    setErro('');
    if (medicamentos.some(m => !m.nome.trim())) {
      setErro('Preencha o nome de todos os medicamentos');
      return;
    }
      if (medicamentos.some(m => m.acompanharVencimento &&
        !(m.validadeDias && m.validadeDias >= 1 && m.validadeDias <= VALIDADE_MAXIMA))) {
      setErro('Informe a validade (1 a 730 dias) dos medicamentos acompanhados');
      return;
    }
    setLoading(true);
    try {
      let dados: ArrayBuffer;
      try {
        const response = await api.post('/api/receitas/gerar', {
          consultaId, tipoReceita, tipoUso, medicamentos,
        }, { responseType: 'arraybuffer' });
        dados = response.data;
      } catch (e: any) {
        setErro(mensagemDoServidor(e));
        return;
      }
      try {
        function mensagemDoServidor(e: any): string {
          try {
            const dados = e?.response?.data;
            if (dados instanceof ArrayBuffer) {
              const json = JSON.parse(new TextDecoder().decode(dados));
              return json?.Messages?.[0] ?? json?.messages?.[0] ?? 'Erro ao gerar receita';
            }
          } catch {
            // corpo não era JSON
          }
          return e?.mensagemBack ?? 'Erro ao gerar receita';
        }
        const base64 = arrayBufferToBase64(dados);
        const nomeArquivo = `Receita_${tipoReceita}_${Date.now()}.docx`;
        const caminho = FileSystem.documentDirectory + nomeArquivo;

        await FileSystem.writeAsStringAsync(caminho, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(caminho, {
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            dialogTitle: 'Receita',
          });
        }

        limpar();
        onSucesso();
      } catch {
        setErro('A receita foi registrada no prontuário, mas não foi possível abrir o arquivo. Não gere novamente para não duplicar.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onClose} contentContainerStyle={styles.modal}>
        <ScrollView>
          <Text variant="titleLarge" style={styles.titulo}>Nova Receita</Text>
          {erro ? <Text style={styles.erro}>{erro}</Text> : null}

          <Text variant="labelLarge" style={styles.label}>Tipo de Receita</Text>
          <SegmentedButtons
            value={tipoReceita}
            onValueChange={setTipoReceita}
            buttons={[
              { value: 'Comum', label: 'Comum' },
              { value: 'Especial', label: 'Especial (2 vias)' },
            ]}
            style={styles.segmented}
          />

          <Text variant="labelLarge" style={styles.label}>Tipo de Uso</Text>
          <SegmentedButtons
            value={tipoUso}
            onValueChange={setTipoUso}
            buttons={[
              { value: 'Oral', label: 'Oral' },
              { value: 'Interno', label: 'Interno' },
              { value: 'Externo', label: 'Externo' },
            ]}
            style={styles.segmented}
          />

          <Divider style={styles.divider} />

          <View style={styles.medHeader}>
            <Text variant="titleMedium">Medicamentos</Text>
            <Button icon="plus" onPress={addMed} compact>Adicionar</Button>
          </View>

          {medicamentos.map((med, i) => (
            <View key={i} style={styles.medCard}>
              <View style={styles.medCardHeader}>
                <Text variant="labelMedium" style={styles.medLabel}>Medicamento {i + 1}</Text>
                {medicamentos.length > 1 && (
                  <IconButton icon="delete" size={18} iconColor="#d32f2f" onPress={() => removeMed(i)} />
                )}
              </View>
              <TextInput
                label="Nome"
                value={med.nome}
                onChangeText={(v) => changeMed(i, 'nome', v)}
                mode="outlined"
                style={styles.inputSmall}
                dense
                autoCorrect={false}
                spellCheck={false}
              />
              <View style={styles.linha}>
                <TextInput
                  label="Dosagem"
                  value={med.dosagem}
                  onChangeText={(v) => changeMed(i, 'dosagem', v)}
                  mode="outlined"
                  style={[styles.inputSmall, styles.flex1]}
                  dense
                  placeholder="ex: 50mg"
                  autoCorrect={false}
                spellCheck={false}
                />
                <TextInput
                  label="Quantidade"
                  value={med.quantidade}
                  onChangeText={(v) => changeMed(i, 'quantidade', v)}
                  mode="outlined"
                  style={[styles.inputSmall, styles.flex1]}
                  dense
                  placeholder="ex: 60 cps."
                  autoCorrect={false}
                  spellCheck={false}
                />
              </View>
              <TextInput
                label="Posologia"
                value={med.posologia}
                onChangeText={(v) => changeMed(i, 'posologia', v)}
                mode="outlined"
                style={styles.inputSmall}
                dense
                placeholder="ex: 1 cp. ao dia"
                autoCorrect={false}
                spellCheck={false}
              />

              <View style={styles.vencimentoLinha}>
                <Text variant="bodyMedium">Acompanhar vencimento</Text>
                <Switch
                  value={med.acompanharVencimento}
                  onValueChange={(v) => patchMed(i, {
                    acompanharVencimento: v,
                    validadeDias: v ? med.validadeDias : null,
                  })}
                />
              </View>

              {med.acompanharVencimento && (
                <>
                  <View style={styles.atalhos}>
                    {ATALHOS.map((a) => (
                      <Chip
                        key={a.dias}
                        compact
                        selected={med.validadeDias === a.dias}
                        onPress={() => patchMed(i, { validadeDias: a.dias })}
                      >
                        {a.label}
                      </Chip>
                    ))}
                  </View>
                  <TextInput
                    label="Validade (dias)"
                    value={med.validadeDias != null ? String(med.validadeDias) : ''}
                    onChangeText={(v) => {
                      const digitos = v.replace(/\D/g, '');
                      patchMed(i, { validadeDias: digitos === '' ? null : Number(digitos) });
                    }}
                    keyboardType="numeric"
                    mode="outlined"
                    style={styles.inputSmall}
                    dense
                    maxLength={3}
                  />
                  {med.validadeDias != null && med.validadeDias >= 1 && med.validadeDias <= VALIDADE_MAXIMA && (
                    <Text variant="bodySmall" style={styles.vencimentoPrevisto}>
                      Vence em {vencimentoPrevisto(med.validadeDias)}
                    </Text>
                  )}
                </>
              )}
            </View>
          ))}

          <View style={styles.botoes}>
            <Button onPress={onClose} disabled={loading}>Cancelar</Button>
            <Button mode="contained" onPress={gerar} loading={loading} disabled={loading}>
              Gerar Receita
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );
}

// Utilitário para converter ArrayBuffer em base64 (React Native não tem Buffer nativo)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '85%',
  },
  titulo: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  label: {
    marginBottom: 8,
    marginTop: 8,
  },
  segmented: {
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  medHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  medCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medLabel: {
    color: '#666',
  },
  inputSmall: {
    marginBottom: 8,
    backgroundColor: 'white',
  },
  linha: {
    flexDirection: 'row',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
    vencimentoLinha: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  atalhos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  vencimentoPrevisto: {
    color: '#666',
    marginBottom: 4,
  },
  botoes: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  erro: {
    color: '#d32f2f',
    marginBottom: 12,
  },
});