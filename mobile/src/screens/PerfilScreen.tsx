import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Avatar, Button, Card, Chip } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';

export default function PerfilScreen() {
  const { usuario, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Avatar.Text
            size={72}
            label={usuario?.nome?.split(' ').slice(0, 2).map(n => n[0]).join('') ?? '?'}
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
        textColor="#d32f2f"
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
    backgroundColor: '#f5f5f5',
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
    color: '#666',
    marginTop: 4,
  },
  chip: {
    marginTop: 12,
  },
  botaoSair: {
    borderColor: '#d32f2f',
  },
});