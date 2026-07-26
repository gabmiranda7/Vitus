export interface Consulta {
  id: string;
  pacienteId: string;
  medicoId: string;
  nomePaciente: string;
  nomeMedico: string;
  dataConsulta: string;
  status: string;
  anotacoes?: string;
}

export interface Medicamento {
  nome: string;
  dosagem: string;
  posologia: string;
  quantidade: string;
}

export const statusCores: Record<string, string> = {
  Agendada: '#1976d2', EmTriagem: '#ed6c02', AguardandoAtendimento: '#0288d1',
  EmAtendimento: '#7b1fa2', Finalizada: '#2e7d32', Cancelada: '#d32f2f',
};

export const statusLabels: Record<string, string> = {
  Agendada: 'Agendada', EmTriagem: 'Em Triagem',
  AguardandoAtendimento: 'Aguardando', EmAtendimento: 'Em Atendimento',
  Finalizada: 'Finalizada', Cancelada: 'Cancelada',
};