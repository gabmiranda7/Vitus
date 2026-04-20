using Vitus.Application.UseCases.Consultas.AguardarAtendimento;
using Vitus.Application.UseCases.Consultas.CancelarConsulta;
using Vitus.Application.UseCases.Consultas.CreateConsulta;
using Vitus.Application.UseCases.Consultas.FinalizarConsulta;
using Vitus.Application.UseCases.Consultas.GetAllConsultas;
using Vitus.Application.UseCases.Consultas.GetConsultaById;
using Vitus.Application.UseCases.Consultas.IniciarAtendimento;
using Vitus.Application.UseCases.Consultas.IniciarTriagem;
using Vitus.Application.UseCases.Medicos.CreateMedico;
using Vitus.Application.UseCases.Medicos.GetAllMedicos;
using Vitus.Application.UseCases.Medicos.GetMedicoById;
using Vitus.Application.UseCases.Pacientes.CreatePaciente;
using Vitus.Application.UseCases.Pacientes.DeletePaciente;
using Vitus.Application.UseCases.Pacientes.GetAllPacientes;
using Vitus.Application.UseCases.Pacientes.GetPacienteById;
using Vitus.Application.UseCases.Pacientes.UpdatePaciente;

namespace Vitus.API.Extensions
{
    public static class ApplicationServicesExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<CreateConsultaUseCase>();
            services.AddScoped<GetConsultaByIdUseCase>();
            services.AddScoped<GetAllConsultasUseCase>();
            services.AddScoped<IniciarTriagemUseCase>();
            services.AddScoped<AguardarAtendimentoUseCase>();
            services.AddScoped<IniciarAtendimentoUseCase>();
            services.AddScoped<FinalizarConsultaUseCase>();
            services.AddScoped<CancelarConsultaUseCase>();


            services.AddScoped<CreateMedicoUseCase>();
            services.AddScoped<GetMedicoByIdUseCase>();
            services.AddScoped<GetAllMedicosUseCase>();

            services.AddScoped<CreatePacienteUseCase>();
            services.AddScoped<UpdatePacienteUseCase>();
            services.AddScoped<DeletePacienteUseCase>();
            services.AddScoped<GetPacienteByIdUseCase>();
            services.AddScoped<GetAllPacientesUseCase>();

            return services;
        }
    }
}