import React from 'react';
import { Avatar } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { iniciais } from '../theme';

interface Props {
  size?: number;
  cor?: string;
}

export default function AvatarUsuario({ size = 40, cor }: Props) {
  const { usuario, fotoUri } = useAuth();

  if (fotoUri) {
    return <Avatar.Image size={size} source={{ uri: fotoUri }} />;
  }

  return (
    <Avatar.Text
      size={size}
      label={usuario?.nome ? iniciais(usuario.nome) : '?'}
      style={cor ? { backgroundColor: cor } : undefined}
    />
  );
}