using Microsoft.EntityFrameworkCore;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;
using Vitus.Infrastructure.Data;

namespace Vitus.Infrastructure.Repositories
{
    public class TriagemRepository : ITriagemRepository
    {
        private readonly AppDbContext _context;

        public TriagemRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task Add(Triagem triagem)
        {
            await _context.Triagens.AddAsync(triagem);
            await _context.SaveChangesAsync();
        }

        public async Task<Triagem?> GetById(Guid id)
        {
            return await _context.Triagens
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<List<Triagem>> GetAll()
        {
            return await _context.Triagens
                .AsNoTracking()
                .ToListAsync();
        }
    }
}