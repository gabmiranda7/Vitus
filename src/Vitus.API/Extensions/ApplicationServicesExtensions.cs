using FluentValidation;
using FluentValidation.AspNetCore;
using Vitus.Application.UseCases.Auth.Login;
using Vitus.Application.UseCases.Auth.Registrar;
using Vitus.Application.UseCases.Consultas.AguardarAtendimento;
using Vitus.Application.UseCases.Consultas.AnotarConsulta;
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
using Vitus.Application.UseCases.Prontuarios.GetProntuarioByConsultaId;
using Vitus.Application.UseCases.Prontuarios.GetProntuarioById;
using Vitus.Application.UseCases.Prontuarios.GetProntuarioByPacienteId;
using Vitus.Application.UseCases.Receitas.CriarReceita;
using Vitus.Application.UseCases.Triagens.RegistrarTriagem;
using Vitus.Application.Validators.Pacientes;

namespace Vitus.API.Extensions
{
    public static class ApplicationServicesExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<LoginUsuarioUseCase>();
            services.AddScoped<RegistrarUsuarioUseCase>();

            services.AddScoped<AguardarAtendimentoUseCase>();
            services.AddScoped<AnotarConsultaUseCase>();
            services.AddScoped<CancelarConsultaUseCase>();
            services.AddScoped<CreateConsultaUseCase>();
            services.AddScoped<FinalizarConsultaUseCase>();
            services.AddScoped<GetAllConsultasUseCase>();
            services.AddScoped<GetConsultaByIdUseCase>();
            services.AddScoped<IniciarAtendimentoUseCase>();
            services.AddScoped<IniciarTriagemUseCase>();

            services.AddScoped<CreateMedicoUseCase>();
            services.AddScoped<GetAllMedicosUseCase>();
            services.AddScoped<GetMedicoByIdUseCase>();

            services.AddScoped<CreatePacienteUseCase>();
            services.AddScoped<DeletePacienteUseCase>();
            services.AddScoped<GetAllPacientesUseCase>();
            services.AddScoped<GetPacienteByIdUseCase>();
            services.AddScoped<UpdatePacienteUseCase>();

            services.AddScoped<GetProntuarioByConsultaIdUseCase>();
            services.AddScoped<GetProntuarioByIdUseCase>();
            services.AddScoped<GetProntuarioByPacienteIdUseCase>();

            services.AddScoped<CriarReceitaUseCase>();

            services.AddScoped<RegistrarTriagemUseCase>();

            return services;
        }
    }
}