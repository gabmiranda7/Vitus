import { Box, Chip, FormControlLabel, Switch, TextField, Typography } from '@mui/material';
import { Medicamento } from '../../types';

const ATALHOS = [
  { label: '30 dias', dias: 30 },
  { label: '3 meses', dias: 90 },
  { label: '6 meses', dias: 180 },
  { label: '1 ano', dias: 365 },
];

const VALIDADE_MAXIMA = 730;

interface Props {
  med: Medicamento;
  onChange: (patch: Partial<Medicamento>) => void;
}

function vencimentoPrevisto(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('pt-BR');
}

export default function AcompanhamentoVencimento({ med, onChange }: Props) {
  const dias = med.validadeDias;
  const valido = dias != null && dias >= 1 && dias <= VALIDADE_MAXIMA;

  return (
    <Box sx={{ mt: 1.5 }}>
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={med.acompanharVencimento}
            onChange={(e) => onChange({
              acompanharVencimento: e.target.checked,
              validadeDias: e.target.checked ? med.validadeDias : null,
            })}
          />
        }
        label={<Typography variant="body2">Acompanhar vencimento no prontuário</Typography>}
      />

      {med.acompanharVencimento && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
          {ATALHOS.map((a) => (
            <Chip
              key={a.dias}
              label={a.label}
              size="small"
              clickable
              color={dias === a.dias ? 'primary' : 'default'}
              variant={dias === a.dias ? 'filled' : 'outlined'}
              onClick={() => onChange({ validadeDias: a.dias })}
            />
          ))}
          <TextField
            label="Validade (dias)"
            type="number"
            size="small"
            value={dias ?? ''}
            onChange={(e) => onChange({ validadeDias: e.target.value === '' ? null : Number(e.target.value) })}
            error={dias != null && !valido}
            slotProps={{ htmlInput: { min: 1, max: VALIDADE_MAXIMA } }}
            sx={{ width: 140 }}
          />
          {valido && (
            <Typography variant="caption" color="text.secondary">
              Vence em {vencimentoPrevisto(dias!)}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}