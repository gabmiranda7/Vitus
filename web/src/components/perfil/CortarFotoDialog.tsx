import { useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import {
  Alert, Box, Button, CircularProgress, Dialog, DialogActions,
  DialogContent, Slider, Typography,
} from '@mui/material';

const TAMANHO_SAIDA = 512;

function carregarImagem(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Não foi possível ler a imagem'));
    img.src = src;
  });
}

async function recortar(src: string, area: Area): Promise<Blob> {
  const img = await carregarImagem(src);
  const canvas = document.createElement('canvas');
  canvas.width = TAMANHO_SAIDA;
  canvas.height = TAMANHO_SAIDA;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível processar a imagem');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, TAMANHO_SAIDA, TAMANHO_SAIDA);
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, TAMANHO_SAIDA, TAMANHO_SAIDA);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Não foi possível gerar a imagem'))),
      'image/jpeg',
      0.9
    )
  );
}

interface Props {
  arquivo: File | null;
  onCancelar: () => void;
  onConfirmar: (foto: File) => Promise<void>;
}

export default function CortarFotoDialog({ arquivo, onCancelar, onConfirmar }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPx, setAreaPx] = useState<Area | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (!arquivo) { setSrc(null); return; }
    const url = URL.createObjectURL(arquivo);
    setSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAreaPx(null);
    setErro('');
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  async function confirmar() {
    if (!src || !areaPx) return;
    setProcessando(true);
    setErro('');
    try {
      const blob = await recortar(src, areaPx);
      await onConfirmar(new File([blob], 'perfil.jpg', { type: 'image/jpeg' }));
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao processar a imagem');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <Dialog open={!!arquivo} onClose={processando ? undefined : onCancelar} fullWidth maxWidth="xs">
      <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)', p: 2.5 }}>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>Ajustar foto</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
          Arraste para posicionar e use o zoom para enquadrar
        </Typography>
      </Box>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ position: 'relative', height: 320, bgcolor: '#111' }}>
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setAreaPx(pixels)}
            />
          )}
        </Box>
        <Box sx={{ px: 3, pt: 2, pb: 1 }}>
          {erro && <Alert severity="error" sx={{ mb: 1 }}>{erro}</Alert>}
          <Typography variant="caption" color="text.secondary">Zoom</Typography>
          <Slider
            value={zoom} min={1} max={3} step={0.05}
            onChange={(_, v) => setZoom(v as number)}
            disabled={processando}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onCancelar} variant="outlined" fullWidth disabled={processando}>Cancelar</Button>
        <Button
          onClick={confirmar} variant="contained" fullWidth
          disabled={processando || !areaPx}
          startIcon={processando ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {processando ? 'Enviando...' : 'Usar esta foto'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}