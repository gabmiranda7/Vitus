using Vitus.Communication.Paciente.Requests;
using Vitus.Communication.Paciente.Responses;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Pacientes.CreatePaciente
{
    public class CreatePacienteUseCase
    {
        private readonly IPacienteRepository _pacienteRepository;

        public CreatePacienteUseCase(IPacienteRepository pacienteRepository)
        {
            _pacienteRepository = pacienteRepository;
        }

        public async Task<PacienteResponseJson> Execute(CreatePacienteRequestJson request)
        {
            var paciente = new Paciente(
                request.Nome, request.Cpf, request.CartaoSus, request.DataNascimento,
                request.Sexo, request.NomePai, request.NomeMae, request.Endereco,
                request.Profissao, request.EstadoCivil, request.InformacoesAdicionais,
                request.AceitaTermos
            );

            paciente.CriarProntuario();
            await _pacienteRepository.Add(paciente);

            return MapToResponse(paciente);
        }

        public static PacienteResponseJson MapToResponse(Paciente p) => new()
        {
            Id = p.Id,
            Nome = p.Nome,
            Cpf = p.Cpf,
            CartaoSus = p.CartaoSus,
            DataNascimento = p.DataNascimento,
            Sexo = p.Sexo,
            NomePai = p.NomePai,
            NomeMae = p.NomeMae,
            Endereco = p.Endereco,
            Profissao = p.Profissao,
            EstadoCivil = p.EstadoCivil,
            InformacoesAdicionais = p.InformacoesAdicionais,
            AceitaTermos = p.AceitaTermos
        };
    }
}