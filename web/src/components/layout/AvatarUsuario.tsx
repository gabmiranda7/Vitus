import { Avatar } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

function iniciaisNome(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

interface Props {
  size?: number;
  bgcolor?: string;
}

export default function AvatarUsuario({ size = 34, bgcolor = '#1976d2' }: Props) {
  const { usuario, fotoUrl } = useAuth();

  return (
    <Avatar
      src={fotoUrl ?? undefined}
      sx={{ width: size, height: size, fontSize: size * 0.38, fontWeight: 700, bgcolor }}
    >
      {iniciaisNome(usuario?.nome ?? '')}
    </Avatar>
  );
}