import { cores } from '../theme';

export const acaoIcones: Record<string, string> = {
  CriacaoPaciente: 'account-plus',
  EdicaoPaciente: 'account-edit',
  ExclusaoPaciente: 'account-remove',
  CriacaoConsulta: 'calendar-plus',
  CancelamentoConsulta: 'calendar-remove',
  EmissaoReceita: 'pill',
  AcessoProntuario: 'folder-open',
  RegistroTriagem: 'stethoscope',
  RegistroExame: 'flask',
  AnexoExame: 'paperclip',
  DownloadExame: 'file-download',
  AprovacaoCadastro: 'account-check',
  RecusaCadastro: 'account-cancel',
};

export const acaoCores: Record<string, string> = {
  CriacaoPaciente: cores.sucesso,
  EdicaoPaciente: cores.primaria,
  ExclusaoPaciente: cores.erro,
  CriacaoConsulta: cores.primaria,
  CancelamentoConsulta: cores.erro,
  EmissaoReceita: cores.sucesso,
  AcessoProntuario: cores.secundaria,
  RegistroTriagem: cores.aviso,
  RegistroExame: cores.secundaria,
  AnexoExame: cores.secundaria,
  DownloadExame: cores.secundaria,
  AprovacaoCadastro: cores.sucesso,
  RecusaCadastro: cores.erro,
};

export const acaoLabel: Record<string, string> = {
  CriacaoPaciente: 'Paciente Criado',
  EdicaoPaciente: 'Paciente Editado',
  ExclusaoPaciente: 'Paciente Excluído',
  CriacaoConsulta: 'Consulta Criada',
  CancelamentoConsulta: 'Consulta Cancelada',
  EmissaoReceita: 'Receita Emitida',
  AcessoProntuario: 'Prontuário Acessado',
  RegistroTriagem: 'Triagem Registrada',
  RegistroExame: 'Exame Registrado',
  AnexoExame: 'Arquivo de Exame Anexado',
  DownloadExame: 'Arquivo de Exame Baixado',
  AprovacaoCadastro: 'Cadastro Aprovado',
  RecusaCadastro: 'Cadastro Recusado',
};