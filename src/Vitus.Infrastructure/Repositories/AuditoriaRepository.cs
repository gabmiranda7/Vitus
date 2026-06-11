using Microsoft.EntityFrameworkCore;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;
using Vitus.Infrastructure.Data;

namespace Vitus.Infrastructure.Repositories
{
    public class AuditoriaRepository : IAuditoriaRepository
    {
        private readonly AppDbContext _context;

        public AuditoriaRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task Add(AuditoriaLog log)
        {
            await _context.Auditorias.AddAsync(log);
            await _context.SaveChangesAsync();
        }

        public async Task<List<AuditoriaLog>> GetAll()
        {
            return await _context.Auditorias
                .AsNoTracking()
                .OrderByDescending(a => a.DataHora)
                .ToListAsync();
        }

        public async Task<List<AuditoriaLog>> GetByUsuarioId(Guid usuarioId)
        {
            return await _context.Auditorias
                .AsNoTracking()
                .Where(a => a.UsuarioId == usuarioId)
                .OrderByDescending(a => a.DataHora)
                .ToListAsync();
        }

        public async Task<List<AuditoriaLog>> GetByEntidade(string entidadeAfetada, Guid entidadeId)
        {
            return await _context.Auditorias
                .AsNoTracking()
                .Where(a => a.EntidadeAfetada == entidadeAfetada && a.EntidadeId == entidadeId)
                .OrderByDescending(a => a.DataHora)
                .ToListAsync();
        }

        public async Task<List<AuditoriaLog>> GetByPeriodo(DateTime inicio, DateTime fim)
        {
            return await _context.Auditorias
                .AsNoTracking()
                .Where(a => a.DataHora >= inicio && a.DataHora <= fim)
                .OrderByDescending(a => a.DataHora)
                .ToListAsync();
        }
    }
}