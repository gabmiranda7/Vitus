using Vitus.Communication.Paciente.Responses;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Pacientes.GetAllPacientes
{
    public class GetAllPacientesUseCase
    {
        private readonly IPacienteRepository _repository;

        public GetAllPacientesUseCase(IPacienteRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<PacienteResponseJson>> Execute()
        {
            var pacientes = await _repository.GetAll();

            return pacientes.Select(p => new PacienteResponseJson
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
            }).ToList();
        }
    }
}