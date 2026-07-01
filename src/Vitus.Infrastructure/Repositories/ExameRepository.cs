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
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task<IList<Exame>> GetByProntuarioId(Guid prontuarioId)
        {
            return await _context.Exames
                .AsNoTracking()
                .Where(e => e.ProntuarioId == prontuarioId)
                .OrderByDescending(e => e.DataExame)
                .ToListAsync();
        }

        public async Task Update(Exame exame)
        {
            _context.Exames.Update(exame);
            await _context.SaveChangesAsync();
        }
    }
}