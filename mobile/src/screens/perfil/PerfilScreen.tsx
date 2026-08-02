import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, Button, Card, Chip } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { cores, iniciais } from '../../theme';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Avatar.Text
            size={72}
            label={usuario?.nome ? iniciais(usuario.nome) : '?'}
          />
          <Text variant="headlineSmall" style={styles.nome}>{usuario?.nome}</Text>
          <Text variant="bodyMedium" style={styles.email}>{usuario?.email}</Text>
          <Chip style={styles.chip}>{usuario?.perfil}</Chip>
        </Card.Content>
      </Card>

      <Button
        mode="outlined"
        onPress={logout}
        style={styles.botaoSair}
        textColor={cores.erro}
      >
        Sair da conta
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: cores.fundo,
  },
  card: {
    borderRadius: 12,
    marginBottom: 24,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  nome: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  email: {
    color: cores.textoSecundario,
    marginTop: 4,
  },
  chip: {
    marginTop: 12,
  },
  botaoSair: {
    borderColor: cores.erro,
  },
});