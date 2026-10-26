using Vitus.Communication.Auth.Requests;
using Vitus.Communication.Auth.Responses;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Auth.Registrar
{
    public class RegistrarUsuarioUseCase
    {
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly IEnfermeiroRepository _enfermeiroRepository;
        private readonly IMedicoRepository _medicoRepository;

        public RegistrarUsuarioUseCase(
            IUsuarioRepository usuarioRepository,
            IEnfermeiroRepository enfermeiroRepository,
            IMedicoRepository medicoRepository)
        {
            _usuarioRepository = usuarioRepository;
            _enfermeiroRepository = enfermeiroRepository;
            _medicoRepository = medicoRepository;
        }

        public async Task<RegistroResponseJson> Execute(RegisterRequestJson request)
        {
            var emailNormalizado = request.Email.Trim().ToLowerInvariant();
            var usuarioExistente = await _usuarioRepository.GetByEmail(emailNormalizado);

            if (usuarioExistente != null)
                throw new DomainException("Email já cadastrado");

            if (!Enum.TryParse<PerfilUsuario>(request.Perfil, ignoreCase: true, out var perfil))
                throw new DomainException("Perfil inválido. Use: Medico, Enfermeiro ou Recepcionista");

            if (perfil == PerfilUsuario.Administrador)
                throw new DomainException("Não é possível se cadastrar como Administrador");

            if (perfil == PerfilUsuario.Paciente)
                throw new DomainException("Perfil inválido. Use: Medico, Enfermeiro ou Recepcionista");

            var senhaHash = BCrypt.Net.BCrypt.HashPassword(request.Senha);
            var usuario = new Usuario(request.Nome, emailNormalizado, senhaHash, perfil);
            await _usuarioRepository.Add(usuario);

            if (perfil == PerfilUsuario.Medico)
            {
                var crm = request.CRM ?? $"CRM-PROVISÓRIO-{Guid.NewGuid().ToString()[..8].ToUpper()}";
                var especialidade = request.Especialidade ?? "Clínico Geral";
                var medico = new Medico(request.Nome, especialidade, crm, usuario.Id);
                await _medicoRepository.Add(medico);
            }

            if (perfil == PerfilUsuario.Enfermeiro)
            {
                var coren = request.COREN ?? $"COREN-PROVISÓRIO-{Guid.NewGuid().ToString()[..8].ToUpper()}";
                var enfermeiro = new Enfermeiro(request.Nome, coren, request.Especializacao);
                await _enfermeiroRepository.Add(enfermeiro);
            }

            return new RegistroResponseJson
            {
                Mensagem = "Cadastro realizado com sucesso. Aguarde a aprovação de um administrador para acessar o sistema."
            };
        }
    }
}