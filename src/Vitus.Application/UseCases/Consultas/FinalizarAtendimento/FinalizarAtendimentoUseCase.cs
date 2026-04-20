using Vitus.Communication.Consulta.Responses;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Consultas.FinalizarConsulta
{
    public class FinalizarConsultaUseCase
    {
        private readonly IConsultaRepository _repository;

        public FinalizarConsultaUseCase(IConsultaRepository repository)
        {
            _repository = repository;
        }

        public async Task<ConsultaResponseJson> Execute(Guid id)
        {
            var consulta = await _repository.GetById(id);

            if (consulta == null)
                throw new Exception("Consulta não encontrada");

            consulta.Finalizar();

            await _repository.Update(consulta);

            return new ConsultaResponseJson
            {
                Id = consulta.Id,
                DataConsulta = consulta.DataConsulta,
                Status = consulta.Status.ToString()
            };
        }
    }
}