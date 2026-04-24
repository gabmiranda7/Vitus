using Vitus.Application.UseCases.Auth.Login;
using Vitus.Application.UseCases.Auth.Registrar;
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
using Vitus.Application.UseCases.Prontuarios.GetProntuarioById;
using Vitus.Application.UseCases.Prontuarios.GetProntuarioByPacienteId;
using Vitus.Application.UseCases.Receitas.CriarReceita;
using Vitus.Application.UseCases.Triagens.RegistrarTriagem;

namespace Vitus.API.Extensions
{
    public static class ApplicationServicesExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<LoginUsuarioUseCase>();
            services.AddScoped<RegistrarUsuarioUseCase>();

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

            services.AddScoped<GetProntuarioByIdUseCase>();
            services.AddScoped<GetProntuarioByPacienteIdUseCase>();

            services.AddScoped<CriarReceitaUseCase>();

            services.AddScoped<RegistrarTriagemUseCase>();

            return services;
        }
    }
}