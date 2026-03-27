using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SesizariGalatiAPI.Data;

namespace SesizariGalatiAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LookupsController : ControllerBase
    {
        private readonly SesizariGalatiDbContext _context;

        public LookupsController(SesizariGalatiDbContext context)
        {
            _context = context;
        }

        // GET: api/Lookups/categories
        // Returnează lista de categorii (inclusiv idDomain)
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories.ToListAsync();
            return Ok(categories);
        }

        // GET: api/Lookups/statuses
        // Returnează lista de statusuri (În lucru, Rezolvat, etc.)
        [HttpGet("statuses")]
        public async Task<IActionResult> GetStatuses()
        {
            var statuses = await _context.Statuses.ToListAsync();
            return Ok(statuses);
        }

        // GET: api/Lookups/companies
        // Returnează lista de companii (pentru dropdown-ul de asignare)
        [HttpGet("companies")]
        public async Task<IActionResult> GetCompanies()
        {
            var companies = await _context.Companies
                .Select(c => new 
                {
                    c.IdCompany,
                    c.TaxId,
                    c.CompanyName,
                    c.IdDomain
                })
                .ToListAsync();
            return Ok(companies);
        }

        // GET: api/Lookups/priorities
        // Returnează lista de priorități (pentru dropdown-ul de setare prioritate)
        [HttpGet("priorities")]
        public async Task<IActionResult> GetPriorities()
        {
            var priorities = await _context.Priorities
                .Select(p => new
                {
                    p.IdPriority,
                    p.LevelName,
                    p.ResolutionDays
                })
                .ToListAsync();
            return Ok(priorities);
        }
    }
}