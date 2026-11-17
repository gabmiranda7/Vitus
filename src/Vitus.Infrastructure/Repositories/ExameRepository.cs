using Microsoft.EntityFrameworkCore;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;
using Vitus.Infrastructure.Data;

namespace Vitus.Infrastructure.Repositories
{
    public class ExameRepository : IExameRepository
    {
        private readonly AppDbContext _context;

        public ExameRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task Add(Exame exame)
        {
            await _context.Exames.AddAsync(exame);
            await _context.SaveChangesAsync();
        }

        public async Task<Exame?> GetById(Guid id)
        {
            return await _context.Exames
                .Include(e => e.Arquivos)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task<IList<Exame>> GetByProntuarioId(Guid prontuarioId)
        {
            return await _context.Exames
                .AsNoTracking()
                .Include(e => e.Arquivos)
                .Where(e => e.ProntuarioId == prontuarioId)
                .OrderByDescending(e => e.DataExame)
                .ToListAsync();
        }

        public async Task Update(Exame exame)
        {
            if (_context.Entry(exame).State == EntityState.Detached)
            {
                _context.Exames.Update(exame);
            }

            foreach (var arquivo in exame.Arquivos)
            {
                var entry = _context.Entry(arquivo);
                if (entry.State == EntityState.Detached)
                {
                    entry.State = EntityState.Added;
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}