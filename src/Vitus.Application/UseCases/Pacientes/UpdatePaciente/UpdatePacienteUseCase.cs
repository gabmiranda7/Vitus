using Vitus.Communication.Paciente.Requests;
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

            paciente.Atualizar(
                request.Nome, request.Cpf, request.CartaoSus, request.DataNascimento,
                request.Sexo, request.NomePai, request.NomeMae, request.Endereco,
                request.Profissao, request.EstadoCivil, request.InformacoesAdicionais
            );

            await _repository.Update(paciente);
            await _auditoriaService.Registrar(AcaoAuditoria.EdicaoPaciente, "Paciente", paciente.Id);
        }
    }
}