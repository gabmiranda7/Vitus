using Microsoft.EntityFrameworkCore;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;
using Vitus.Infrastructure.Data;

namespace Vitus.Infrastructure.Repositories
{
    public class ReceitaRepository : IReceitaRepository
    {
        private readonly AppDbContext _context;

        public ReceitaRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task Add(Receita receita)
        {
            await _context.Receitas.AddAsync(receita);
            await _context.SaveChangesAsync();
        }

        public async Task<Receita?> GetById(Guid id)
        {
            return await _context.Receitas
                .AsNoTracking()
                .Include(r => r.Medicamentos)
                .FirstOrDefaultAsync(r => r.Id == id);
        }

        public async Task<List<Receita>> GetAll()
        {
            return await _context.Receitas
                .AsNoTracking()
                .Include(r => r.Medicamentos)
                .ToListAsync();
        }
    }
}