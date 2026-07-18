using Microsoft.EntityFrameworkCore;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;
using Vitus.Infrastructure.Data;

namespace Vitus.Infrastructure.Repositories
{
    public class EnfermeiroRepository : IEnfermeiroRepository
    {
        private readonly AppDbContext _context;

        public EnfermeiroRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task Add(Enfermeiro enfermeiro)
        {
            await _context.Enfermeiros.AddAsync(enfermeiro);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Enfermeiro>> GetAll()
        {
            return await _context.Enfermeiros.AsNoTracking().ToListAsync();
        }

        public async Task<Enfermeiro?> GetById(Guid id)
        {
            return await _context.Enfermeiros.AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == id);
        }
    }
}