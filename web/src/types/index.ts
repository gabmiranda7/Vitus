export interface Consulta {
  id: string;
  pacienteId: string;
  dataConsulta: string;
  status: string;
  nomePaciente: string;
  nomeMedico: string;
  anotacoes?: string;
}

export interface Medicamento {
    nome: string;
    dosagem: string;
    posologia: string;
}

export interface Medico {
    id: string;
    nome: string;
    especialidade: string;
    crm: string;
}

export interface Paciente {
    id: string;
    nome: string;
}

export interface Prontuario {
    id: string;
    pacienteId: string;
    triagens: Triagem[];
    consultas: Consulta[];
    receitas: Receita[];
}

export interface Receita {
    id: string;
    consultaId: string;
    medicamentos: Medicamento[];
}

export interface Triagem {
    id: string;
    prontuarioId: string;
    observacoes: string;
    pressaoArterial: string;
    temperatura: number;
    nomeEnfermeiro: string;
}

export interface Usuario {
    token: string;
    nome: string;
    email: string;
    perfil: string;
}