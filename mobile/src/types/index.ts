export interface AuditoriaLog {
  id: string;
  acao: string;
  entidadeAfetada: string;
  entidadeId: string;
  usuarioNome: string;
  dataHora: string;
  detalhes?: string;
}

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

export interface Medico {
  id: string;
  nome: string;
  especialidade: string;
  crm: string;
}

export interface Medicamento {
  nome: string;
  dosagem: string;
  posologia: string;
  quantidade: string;
}

export interface Paciente {
  id: string;
  nome: string;
  cpf?: string;
  cartaoSus?: string;
  dataNascimento?: string;
  sexo?: string;
  nomePai?: string;
  nomeMae?: string;
  endereco?: string;
  profissao?: string;
  estadoCivil?: string;
  informacoesAdicionais?: string;
}

export interface Triagem {
  id: string;
  consultaId: string;
  pressaoArterial: string;
  temperatura: number;
  observacoes: string;
  nomeEnfermeiro: string;
}

export interface Receita {
  id: string;
  consultaId: string;
  medicamentos: Medicamento[];
}

export interface Exame {
  id: string;
  prontuarioId: string;
  consultaId?: string;
  categoria: string;
  nome: string;
  descricao?: string;
  medicoSolicitante: string;
  dataExame: string;
  observacoes?: string;
  nomeArquivoOriginal?: string;
  temArquivo: boolean;
}

export interface Prontuario {
  id: string;
  pacienteId: string;
  triagens: Triagem[];
  consultas: Consulta[];
  receitas: Receita[];
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