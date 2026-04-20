using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Update.Internal;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;
using Vitus.Infrastructure.Data;

namespace Vitus.Infrastructure.Repositories
{
    public class ConsultaRepository : IConsultaRepository
    {
        private readonly AppDbContext _context;

        public ConsultaRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task Add(Consulta consulta)
        {
            await _context.Consultas.AddAsync(consulta);
            await _context.SaveChangesAsync();
        }

        public async Task Update(Consulta consulta)
        {
            _context.Consultas.Update(consulta);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Consulta>> GetAll()
        {
            return await _context.Consultas
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<Consulta?> GetById(Guid id)
        {
            return await _context.Consultas
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);
        }
    }
}