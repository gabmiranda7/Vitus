using Microsoft.EntityFrameworkCore;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;
using Vitus.Infrastructure.Data;

namespace Vitus.Infrastructure.Repositories
{
    public class ProntuarioRepository : IProntuarioRepository
    {
        private readonly AppDbContext _context;

        public ProntuarioRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Prontuario?> GetById(Guid id)
        {
            return await _context.Prontuarios
                .AsNoTracking()
                .Include(p => p.Triagens)
                .Include(p => p.Consultas)
                .Include(p => p.Receitas)
                    .ThenInclude(r => r.Medicamentos)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Prontuario?> GetByPacienteId(Guid pacienteId)
        {
            return await _context.Prontuarios
                .AsNoTracking()
                .Include(p => p.Triagens)
                .Include(p => p.Consultas)
                .Include(p => p.Receitas)
                    .ThenInclude(r => r.Medicamentos)
                .FirstOrDefaultAsync(p => p.PacienteId == pacienteId);
        }
    }
}