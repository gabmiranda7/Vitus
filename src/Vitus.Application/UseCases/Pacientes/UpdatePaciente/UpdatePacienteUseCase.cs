using Vitus.Communication.Paciente.Requests;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Pacientes.UpdatePaciente
{
    public class UpdatePacienteUseCase
    {
        private readonly IPacienteRepository _repository;

        public UpdatePacienteUseCase(IPacienteRepository repository)
        {
            _repository = repository;
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
        }
    }
}