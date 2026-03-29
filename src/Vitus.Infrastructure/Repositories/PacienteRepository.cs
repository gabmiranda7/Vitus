using Microsoft.EntityFrameworkCore;
using Vitus.Domain.Entities;
using Vitus.Domain.Interfaces;
using Vitus.Infrastructure.Data;

namespace Vitus.Infrastructure.Repositories
{
    public class PacienteRepository : IPacienteRepository
    {
        private readonly AppDbContext _context;

        public PacienteRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task Add(Paciente paciente)
        {
            await _context.Pacientes.AddAsync(paciente);
            await _context.SaveChangesAsync();
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
    }
}