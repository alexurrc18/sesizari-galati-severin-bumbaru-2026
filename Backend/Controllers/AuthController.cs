using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Net;
using System.Net.Mail;
using SesizariGalatiAPI.Data;
using SesizariGalatiAPI.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace SesizariGalatiAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly SesizariGalatiDbContext _context;
        private readonly IMemoryCache _cache;
        private readonly IConfiguration _configuration;

        public AuthController(SesizariGalatiDbContext context, IMemoryCache cache, IConfiguration configuration)
        {
            _context = context;
            _cache = cache;
            _configuration = configuration;
        }

        // Generare OTP si trimitere pe email
        [HttpPost("request-code")]
        public async Task<IActionResult> RequestCode([FromBody] RequestCodeDto request)
        {
            if (string.IsNullOrEmpty(request.Email))
            {
                return BadRequest(new { eroare = "Email-ul este obligatoriu." });
            }

            // generare cod OTP 6 cifre
            Random generator = new Random();
            string otpCode = generator.Next(100000, 999999).ToString();

            // stocare in cache pentru 5 minute
            _cache.Set(request.Email, otpCode, TimeSpan.FromMinutes(5));

            try
            {
                await SendEmailAsync(request.Email, otpCode);
                return Ok(new { mesaj = "Codul a fost trimis pe email!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL ERROR]: {ex.Message}");
                return StatusCode(500, new { eroare = "Eroare internă la trimiterea email-ului. Încercați din nou." });
            }
        }

        // POST: api/Auth/verify-code
        // validare cod OTP și logica de creare/validare cont
        [HttpPost("verify-code")]
        public async Task<IActionResult> VerifyCode([FromBody] VerifyCodeDto request)
        {
            // verificare otp existent pentru email
            if (!_cache.TryGetValue(request.Email, out string? savedCode))
            {
                return BadRequest(new { eroare = "Codul a expirat sau adresa de email este incorectă." });
            }

            // verificare cod
            if (savedCode != request.Code)
            {
                return BadRequest(new { eroare = "Cod invalid." });
            }

            // stergere otp dupa validare
            _cache.Remove(request.Email);

            // Situatia 1: Verificare email angajat
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Email == request.Email);
            if (employee != null)
            {
                var token = GenerateJwtToken(employee.Email, "Employee", employee.IdEmployee, employee.DeptCode);
                return Ok(new
                {
                    token = token, // <-- TRIMITEM TOKEN-UL
                    role = "employee",
                    user = employee,
                    redirect = "/dashboard-angajat"
                });
            }

            // Situatia 2: Verificare email user existent
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (existingUser != null)
            {
                var token = GenerateJwtToken(existingUser.Email, "User", existingUser.IdUser, null);
                return Ok(new
                {
                    token = token, // <-- TRIMITEM TOKEN-UL
                    role = "user",
                    user = existingUser,
                    isProfileValid = existingUser.Validation,
                    redirect = existingUser.Validation ? "/harta" : "/completare-profil"
                });
            }

            // Situatia 3: User nou
            // Celelalte valori sunt null sau false pentru că profilul nu e completat și validat încă
            var newUser = new User
            {
                Email = request.Email,
                Validation = false
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            var tokenNou = GenerateJwtToken(newUser.Email, "User", newUser.IdUser, null);
            return Ok(new
            {
                token = tokenNou, // <-- TRIMITEM TOKEN-UL NOU
                role = "user",
                user = newUser,
                isProfileValid = false,
                redirect = "/completare-profil"
            });
        }

        // POST: api/Auth/complete-profile/{userId}
        // Completare profil pentru userii noi (după validarea OTP-ului)
        [HttpPost("complete-profile/{userId}")]
        public async Task<IActionResult> CompleteProfile(int userId, [FromBody] CompleteProfileDto request)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound(new { eroare = "Utilizatorul nu a fost găsit." });
            }

            // Prevent updating details (especially CNP) if the profile is already validated
            if (user.Validation)
            {
                return BadRequest(new { eroare = "Profilul a fost deja validat. CNP-ul nu mai poate fi modificat." });
            }

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Cnp = request.Cnp;
            user.Phone = request.Phone;
            user.Validation = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                mesaj = "Profil completat cu succes! Acum poți adăuga sesizări.",
                user = user
            });
        }

        // Sends the OTP via SMTP using settings from appsettings.json
        private async Task SendEmailAsync(string targetEmail, string otpCode)
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var senderEmail = emailSettings["SenderEmail"];
            var senderPassword = emailSettings["SenderPassword"];
            var smtpServer = emailSettings["SmtpServer"];

            // Try parsing the port, default to 587 if missing or invalid
            if (!int.TryParse(emailSettings["SmtpPort"], out int smtpPort))
            {
                smtpPort = 587;
            }

            var mailMessage = new MailMessage(senderEmail!, targetEmail)
            {
                Subject = "Codul tău de verificare - Sesizări Galați",
                Body = $"Salut,\n\nCodul tău de verificare este: {otpCode}\n\nAcest cod este valabil 5 minute.\n\nEchipa Cache me if you can.",
                IsBodyHtml = false
            };

            using var smtpClient = new SmtpClient(smtpServer, smtpPort)
            {
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = true
            };

            await smtpClient.SendMailAsync(mailMessage);
        }

        private string GenerateJwtToken(string email, string role, int id, string? deptCode = null)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"]!);

            // Aici punem datele în interiorul token-ului (dar fără parole!)
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, id.ToString()), // Păstrăm ID-ul aici
                new Claim(ClaimTypes.Role, role)                     // Păstrăm rolul (User/Employee)
            };

            // Adăugăm dept_code pentru angajați (folosit pentru verificarea D10)
            if (!string.IsNullOrEmpty(deptCode))
            {
                claims.Add(new Claim("dept_code", deptCode));
            }

            var key = new SymmetricSecurityKey(secretKey);
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(4), // Token-ul e valabil 4 ore
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = creds
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token); // Returnează textul lung (ex: eyJhbG...)
        }
    }



    //DTO
    public class RequestCodeDto
{
    public required string Email { get; set; }
}

public class VerifyCodeDto
{
    public required string Email { get; set; }
    public required string Code { get; set; }
}

public class CompleteProfileDto
{
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string Cnp { get; set; }
    public required string Phone { get; set; }
}
}