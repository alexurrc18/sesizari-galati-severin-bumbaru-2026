using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SesizariGalatiAPI.Data;
using SesizariGalatiAPI.Models;

namespace SesizariGalatiAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly SesizariGalatiDbContext _context;

        public UsersController(SesizariGalatiDbContext context)
        {
            _context = context;
        }

        // Citire utilizatori
        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users.ToListAsync();
            return Ok(users);
        }

        // Citire utilizator după ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { mesaj = "Utilizatorul nu a fost găsit." });
            
            return Ok(user);
        }

        // Adaugare/creare utilizator
        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] User newUser)
        {
            // ID-ul este generat automat de baza de date, deci îl ignorăm dacă vine din frontend
            newUser.IdUser = 0; 
            
            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            // Returnăm codul 201 Created și obiectul creat
            return CreatedAtAction(nameof(GetUser), new { id = newUser.IdUser }, newUser);
        }

        // Editare utilizator (doar Nume, Prenume, Telefon — fără CNP, Email, Validation)
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
        {
            var userDb = await _context.Users.FindAsync(id);
            if (userDb == null) return NotFound(new { mesaj = "Utilizatorul nu a fost găsit." });

            userDb.FirstName = dto.FirstName;
            userDb.LastName = dto.LastName;
            userDb.Phone = dto.Phone;
            // Email, CNP și Validation NU se pot schimba

            await _context.SaveChangesAsync();
            return Ok(userDb);
        }

        // Stergere utilizator
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var userDb = await _context.Users.FindAsync(id);
            if (userDb == null) return NotFound(new { mesaj = "Utilizatorul nu a fost găsit." });

            _context.Users.Remove(userDb);
            await _context.SaveChangesAsync();

            return Ok(new { mesaj = "Utilizatorul a fost sters." });
        }
    }

    // DTO pentru editarea profilului (fără CNP, Email, Validation)
    public class UpdateUserDto
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Phone { get; set; }
    }
}