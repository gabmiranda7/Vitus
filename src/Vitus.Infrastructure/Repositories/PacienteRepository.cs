using Microsoft.EntityFrameworkCore;
using Npgsql;
using Vitus.Domain.Entities;
using Vitus.Domain.Exceptions;
using Vitus.Domain.Interfaces;
using Vitus.Infrastructure.Data;

namespace Vitus.Infrastructure.Repositories
{
    public class PacienteRepository : IPacienteRepository
    {
        private const string ViolacaoDeUnicidade = "23505";

        private readonly AppDbContext _context;

        public PacienteRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task Add(Paciente paciente)
        {
            await _context.Pacientes.AddAsync(paciente);
            await Salvar();
        }

        public async Task Update(Paciente paciente)
        {
            _context.Pacientes.Update(paciente);
            await Salvar();
        }

        public async Task<Paciente?> GetById(Guid id)
        {
            return await _context.Pacientes
                .Include(p => p.Prontuario)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<List<Paciente>> GetAll()
        {
            return await _context.Pacientes
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<List<Paciente>> GetAtivos()
        {
            return await _context.Pacientes
                .AsNoTracking()
                .Where(p => p.Ativo)
                .ToListAsync();
        }

        public async Task<bool> ExisteCpf(string cpf, Guid? ignorarId)
        {
            return await _context.Pacientes
                .AsNoTracking()
                .AnyAsync(p => p.Cpf == cpf && (ignorarId == null || p.Id != ignorarId));
        }

        private async Task Salvar()
        {
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: ViolacaoDeUnicidade })
            {
                throw new DomainException("Já existe um paciente cadastrado com este CPF");
            }
        }
    }
}