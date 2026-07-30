import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, Avatar } from 'react-native-paper';

interface Props {
  icone: string;
  titulo: string;
  subtitulo?: string;
  cores: string[];
}

export default function CabecalhoGradiente({ icone, titulo, subtitulo, cores }: Props) {
  return (
    <LinearGradient colors={cores as any} style={styles.container}>
      <View style={styles.linha}>
        <Avatar.Icon
          icon={icone}
          size={52}
          style={styles.avatar}
          color="white"
        />
        <View style={styles.textos}>
          <Text variant="titleLarge" style={styles.titulo}>{titulo}</Text>
          {subtitulo ? <Text variant="bodyMedium" style={styles.subtitulo}>{subtitulo}</Text> : null}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  textos: {
    marginLeft: 14,
    flex: 1,
  },
  titulo: {
    color: 'white',
    fontWeight: 'bold',
  },
  subtitulo: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
});