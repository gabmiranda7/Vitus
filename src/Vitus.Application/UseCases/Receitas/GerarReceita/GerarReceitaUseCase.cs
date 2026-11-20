using System.Globalization;
using Vitus.Application.UseCases.Receitas.Acompanhamento;
using Vitus.Communication.Receita.Requests;
using Vitus.Domain.Entities;
using Vitus.Domain.Enums;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;

namespace Vitus.Application.UseCases.Receitas.GerarReceita
{
    public class GerarReceitaUseCase
    {
        private readonly IConsultaRepository _consultaRepository;
        private readonly IPacienteRepository _pacienteRepository;
        private readonly IMedicoRepository _medicoRepository;
        private readonly IProntuarioRepository _prontuarioRepository;
        private readonly IReceitaRepository _receitaRepository;
        private readonly IDocumentoService _documentoService;
        private readonly IAuditoriaService _auditoriaService;
        private readonly IConsultaAcessoService _acessoService;

        public GerarReceitaUseCase(
            IConsultaRepository consultaRepository,
            IPacienteRepository pacienteRepository,
            IMedicoRepository medicoRepository,
            IProntuarioRepository prontuarioRepository,
            IReceitaRepository receitaRepository,
            IDocumentoService documentoService,
            IAuditoriaService auditoriaService,
            IConsultaAcessoService acessoService)
        {
            _acessoService = acessoService;
            _consultaRepository = consultaRepository;
            _pacienteRepository = pacienteRepository;
            _medicoRepository = medicoRepository;
            _prontuarioRepository = prontuarioRepository;
            _receitaRepository = receitaRepository;
            _documentoService = documentoService;
            _auditoriaService = auditoriaService;
        }

        public async Task<(byte[] Arquivo, string NomeArquivo)> Execute(GerarReceitaRequestJson request)
        {
            var consulta = await _consultaRepository.GetById(request.ConsultaId);
            if (consulta == null)
                throw new DomainException("Consulta não encontrada");
            await _acessoService.GarantirMedicoResponsavel(consulta);

            if (consulta.Status != StatusConsulta.EmAtendimento)
                throw new DomainException("Receita só pode ser criada durante o atendimento");

            var paciente = await _pacienteRepository.GetById(consulta.PacienteId);
            if (paciente == null)
                throw new DomainException("Paciente não encontrado");

            var medico = await _medicoRepository.GetById(consulta.MedicoId);
            if (medico == null)
                throw new DomainException("Médico não encontrado");

            var prontuario = await _prontuarioRepository.GetByPacienteId(consulta.PacienteId);
            if (prontuario == null)
                throw new DomainException("Prontuário não encontrado");

            if (!Enum.TryParse<TipoReceita>(request.TipoReceita, ignoreCase: true, out var tipoReceita))
                throw new DomainException("Tipo de receita inválido. Use: Comum ou Especial");

            if (!Enum.TryParse<TipoUso>(request.TipoUso, ignoreCase: true, out var tipoUso))
                throw new DomainException("Tipo de uso inválido. Use: Oral, Interno ou Externo");

            // Monta e valida a receita em memória; nada é gravado ainda
            var receita = new Receita(consulta.Id, prontuario.Id);
            foreach (var m in request.Medicamentos)
                receita.AdicionarMedicamento(
                    m.Nome, m.Dosagem, m.Posologia, m.Quantidade,
                    m.AcompanharVencimento, m.ValidadeDias);

            var dataFormatada = AcompanhamentoReceitas.DataLocal(receita.DataEmissao)
                .ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);

            var medicamentosDoc = request.Medicamentos
                .Select((m, idx) =>
                {
                    var tracos = new string('-', 45);
                    var linha = $"{idx + 1}) {m.Nome}{(string.IsNullOrWhiteSpace(m.Dosagem) ? "" : $" {m.Dosagem}")} {tracos} {m.Quantidade}";
                    return (linha, m.Posologia);
                })
                .ToList();

            // O documento é gerado primeiro: se falhar, nenhuma receita fica registrada
            var arquivo = await _documentoService.GerarReceita(
                tipoReceita,
                tipoUso,
                paciente.Nome,
                paciente.Endereco,
                medico.Nome,
                dataFormatada,
                medicamentosDoc);

            await _receitaRepository.Add(receita);
            await _auditoriaService.Registrar(AcaoAuditoria.EmissaoReceita, "Receita", receita.Id);

            var nomeArquivo = $"Receita_{tipoReceita}_{paciente.Nome.Replace(" ", "_")}_{dataFormatada.Replace("/", "-")}.docx";

            return (arquivo, nomeArquivo);
        }
    }
}