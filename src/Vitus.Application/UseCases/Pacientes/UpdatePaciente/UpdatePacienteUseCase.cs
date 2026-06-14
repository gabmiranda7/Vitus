using Vitus.Communication.Paciente.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Pacientes.UpdatePaciente
{
    public class UpdatePacienteUseCase
    {
        private readonly IPacienteRepository _repository;
        private readonly IAuditoriaService _auditoriaService;

        public UpdatePacienteUseCase(IPacienteRepository repository, IAuditoriaService auditoriaService)
        {
            _repository = repository;
            _auditoriaService = auditoriaService;
        }

        public async Task Execute(Guid id, UpdatePacienteRequestJson request)
        {
            var paciente = await _repository.GetById(id);

            if (paciente == null)
                throw new DomainException("Paciente não encontrado.");

            var camposAlterados = ObterCamposAlterados(paciente, request);

            paciente.Atualizar(
                request.Nome, request.Cpf, request.CartaoSus, request.DataNascimento,
                request.Sexo, request.NomePai, request.NomeMae, request.Endereco,
                request.Profissao, request.EstadoCivil, request.InformacoesAdicionais
            );

            await _repository.Update(paciente);

            var detalhes = camposAlterados.Count > 0
                ? $"Campos atualizados: {string.Join(", ", camposAlterados)}"
                : "Nenhum campo alterado";

            await _auditoriaService.Registrar(AcaoAuditoria.EdicaoPaciente, "Paciente", paciente.Id, detalhes);
        }

        private static List<string> ObterCamposAlterados(Paciente paciente, UpdatePacienteRequestJson request)
        {
            var campos = new List<string>();

            if (paciente.Nome != request.Nome) campos.Add("Nome");
            if (paciente.Cpf != request.Cpf) campos.Add("CPF");
            if (paciente.CartaoSus != request.CartaoSus) campos.Add("Cartão SUS");
            if (paciente.DataNascimento != request.DataNascimento) campos.Add("Data de Nascimento");
            if (paciente.Sexo != request.Sexo) campos.Add("Sexo");
            if (paciente.NomePai != request.NomePai) campos.Add("Nome do Pai");
            if (paciente.NomeMae != request.NomeMae) campos.Add("Nome da Mãe");
            if (paciente.Endereco != request.Endereco) campos.Add("Endereço");
            if (paciente.Profissao != request.Profissao) campos.Add("Profissão");
            if (paciente.EstadoCivil != request.EstadoCivil) campos.Add("Estado Civil");
            if (paciente.InformacoesAdicionais != request.InformacoesAdicionais) campos.Add("Informações Adicionais");

            return campos;
        }
    }
}