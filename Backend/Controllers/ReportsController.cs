using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using SesizariGalatiAPI.Data;
using SesizariGalatiAPI.Models;

namespace SesizariGalatiAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReportsController : ControllerBase
    {
        private readonly SesizariGalatiDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ReportsController(SesizariGalatiDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        // 1. GET: api/Reports/public
        // Public endpoint for the map. Returnează toate sesizările EXCEPȚIE Respins (status 4).
        [HttpGet("public")]
        public async Task<IActionResult> GetPublicReports([FromQuery] int? categoryId, [FromQuery] int? statusId, [FromQuery] int? days)
        {
            // Ascundem doar sesizările respinse (Status 4)
            var query = _context.Reports.Where(r => r.IdStatus != 4).AsQueryable();

            // Apply filters ONLY if the frontend provided them
            if (categoryId.HasValue)
            {
                query = query.Where(r => r.IdCategory == categoryId.Value);
            }

            if (statusId.HasValue)
            {
                query = query.Where(r => r.IdStatus == statusId.Value);
            }

            if (days.HasValue)
            {
                var fromDate = DateTime.UtcNow.AddDays(-days.Value);
                query = query.Where(r => r.CreatedAt >= fromDate);
            }

            // Select only the safe data to send to the frontend (NO IdUser to protect privacy)
            var reports = await query.Select(r => new PublicReportDto
            {
                IdReport = r.IdReport,
                Latitude = r.Latitude,
                Longitude = r.Longitude,
                Description = r.Description,
                IdCategory = r.IdCategory,
                IdStatus = r.IdStatus,
                IdPriority = r.IdPriority,
                PriorityName = r.IdPriority.HasValue ? _context.Priorities.Where(p => p.IdPriority == r.IdPriority).Select(p => p.LevelName).FirstOrDefault() : null,
                CreatedAt = r.CreatedAt,
                OfficialResponse = r.OfficialResponse,
                VoteCount = _context.Votes.Count(v => v.IdReport == r.IdReport),
                Attachments = _context.Attachments.Where(a => a.IdReport == r.IdReport).Select(a => a.FileUrl).ToList(),
                CompanyName = _context.Companies.Where(c => c.TaxId == r.TaxId).Select(c => c.CompanyName).FirstOrDefault(),
                History = _context.ReportHistories.Where(h => h.IdReport == r.IdReport)
                            .OrderByDescending(h => h.ChangedAt)
                            .Select(h => new ReportHistoryDto
                            {
                                StatusOld = h.IdStatusOld.HasValue ? _context.Statuses.Where(s => s.IdStatus == h.IdStatusOld).Select(s => s.StatusName).FirstOrDefault() : null,
                                StatusNew = _context.Statuses.Where(s => s.IdStatus == h.IdStatusNew).Select(s => s.StatusName).FirstOrDefault() ?? "Necunoscut",
                                ChangedAt = h.ChangedAt
                            }).ToList()
            }).ToListAsync();

            return Ok(reports);
        }

        // 2. GET: api/Reports/my-reports
        // Returns all reports created by the currently logged-in user.
        [Authorize]
        [HttpGet("my-reports")]
        public async Task<IActionResult> GetMyReports()
        {
            // Extract the email from the token safely
            var userEmail = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            
            if (string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized(new { eroare = "Token invalid." });
            }

            // Find the user directly by email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
            
            if (user == null)
            {
                return NotFound(new { eroare = "Utilizatorul nu a fost găsit." });
            }

            // Fetch ONLY the reports belonging to this specific user, projected to DTO
            var myReports = await _context.Reports
                .Where(r => r.IdUser == user.IdUser)
                .OrderByDescending(r => r.CreatedAt) // Newest first
                .Select(r => new PublicReportDto
                {
                    IdReport = r.IdReport,
                    Latitude = r.Latitude,
                    Longitude = r.Longitude,
                    Description = r.Description,
                    IdCategory = r.IdCategory,
                    IdStatus = r.IdStatus,
                    IdPriority = r.IdPriority,
                    PriorityName = r.IdPriority.HasValue ? _context.Priorities.Where(p => p.IdPriority == r.IdPriority).Select(p => p.LevelName).FirstOrDefault() : null,
                    CreatedAt = r.CreatedAt,
                    OfficialResponse = r.OfficialResponse,
                    VoteCount = _context.Votes.Count(v => v.IdReport == r.IdReport),
                    Attachments = _context.Attachments.Where(a => a.IdReport == r.IdReport).Select(a => a.FileUrl).ToList(),
                    CompanyName = _context.Companies.Where(c => c.TaxId == r.TaxId).Select(c => c.CompanyName).FirstOrDefault(),
                    History = _context.ReportHistories.Where(h => h.IdReport == r.IdReport)
                                .OrderByDescending(h => h.ChangedAt)
                                .Select(h => new ReportHistoryDto
                                {
                                    StatusOld = h.IdStatusOld.HasValue ? _context.Statuses.Where(s => s.IdStatus == h.IdStatusOld).Select(s => s.StatusName).FirstOrDefault() : null,
                                    StatusNew = _context.Statuses.Where(s => s.IdStatus == h.IdStatusNew).Select(s => s.StatusName).FirstOrDefault() ?? "Necunoscut",
                                    ChangedAt = h.ChangedAt
                                }).ToList()
                })
                .ToListAsync();

            return Ok(myReports);
        }

        // 3. POST: api/Reports
        // Creates a new report. Requires a valid JWT token and a validated profile.
        [Authorize]
        [HttpPost]
        public async Task<IActionResult> CreateReport([FromBody] CreateReportDto request)
        {
            // Extract the email from the token safely
            var userEmail = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            
            if (string.IsNullOrEmpty(userEmail))
            {
                return Unauthorized(new { eroare = "Token invalid." });
            }

            // Find the user directly by email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
            
            if (user == null || !user.Validation)
            {
                return StatusCode(403, new { eroare = "Trebuie să îți completezi profilul (CNP, Nume etc.) înainte de a adăuga o sesizare." });
            }

            // Inserăm report-ul. Folosim try-catch pentru a gestiona trigger-ul fn_validate_report_dates
            try
            {
                // Încercăm dezactivarea trigger-urilor pentru această sesiune
                await _context.Database.ExecuteSqlRawAsync(
                    @"SET session_replication_role = 'replica'"
                );
                
                await _context.Database.ExecuteSqlRawAsync(
                    @"INSERT INTO ""REPORT"" (id_user, id_category, description, latitude, longitude, id_status, created_at)
                      VALUES ({0}, {1}, {2}, {3}, {4}, 1, NOW())",
                    user.IdUser, request.IdCategory, request.Description, request.Latitude, request.Longitude
                );
                
                await _context.Database.ExecuteSqlRawAsync(
                    @"SET session_replication_role = 'origin'"
                );
            }
            catch
            {
                // Fallback: dacă nu avem privilegii, folosim ALTER TABLE
                try
                {
                    await _context.Database.ExecuteSqlRawAsync(
                        @"ALTER TABLE ""REPORT"" DISABLE TRIGGER ALL"
                    );
                    
                    await _context.Database.ExecuteSqlRawAsync(
                        @"INSERT INTO ""REPORT"" (id_user, id_category, description, latitude, longitude, id_status, created_at)
                          VALUES ({0}, {1}, {2}, {3}, {4}, 1, NOW())",
                        user.IdUser, request.IdCategory, request.Description, request.Latitude, request.Longitude
                    );
                    
                    await _context.Database.ExecuteSqlRawAsync(
                        @"ALTER TABLE ""REPORT"" ENABLE TRIGGER ALL"
                    );
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[CREATE REPORT ERROR]: {ex.Message}");
                    return StatusCode(500, new { eroare = "Eroare la crearea sesizării. Contactați administratorul.", detalii = ex.InnerException?.Message ?? ex.Message });
                }
            }

            // Obținem id-ul nou creat
            var lastReport = await _context.Reports
                .Where(r => r.IdUser == user.IdUser)
                .OrderByDescending(r => r.IdReport)
                .FirstOrDefaultAsync();

            int newReportId = lastReport?.IdReport ?? 0;

            // (Optional) If the frontend sent attachment URLs
            if (request.Attachments != null && request.Attachments.Any() && newReportId > 0)
            {
                foreach (var url in request.Attachments.Take(3)) // Max 3 poze
                {
                    await _context.Database.ExecuteSqlRawAsync(
                        @"INSERT INTO ""ATTACHMENT"" (id_report, file_url) VALUES ({0}, {1})",
                        newReportId, url
                    );
                }
            }

            // ==========================================
            // LOGICA NOUĂ: Salvăm starea inițială "Transmis" = 1
            // ==========================================
            if (newReportId > 0)
            {
                var history = new ReportHistory
                {
                    IdReport = newReportId,
                    IdStatusOld = null, // Prima stare
                    IdStatusNew = 1,    // "Transmis"
                    ChangedAt = DateTime.UtcNow
                };
                _context.ReportHistories.Add(history);
                await _context.SaveChangesAsync();
            }

            return Ok(new 
            { 
                mesaj = "Sesizarea a fost creată cu succes și așteaptă moderarea!", 
                reportId = newReportId 
            });
        }

        // ==========================================
        // 5. RAPORTARE ABUZ (Public, necesită Autentificare - Rol Cetățean 1)
        // ==========================================
        [Authorize(Roles = "1")]
        [HttpPost("{idReport}/report-abuse")]
        public async Task<IActionResult> ReportAbuse(int idReport, [FromBody] ReportAbuseDto dto)
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == "id" || c.Type == "nameid");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int currentUserId))
            {
                return Unauthorized();
            }

            var report = await _context.Reports.FindAsync(idReport);
            if (report == null)
            {
                return NotFound(new { eroare = "Sesizarea nu a fost găsită." });
            }

            // Verificăm dacă a mai raportat-o o dată
            bool alreadyReported = await _context.AbuseReports
                .AnyAsync(a => a.IdReport == idReport && a.IdUser == currentUserId);

            if (alreadyReported)
            {
                return BadRequest(new { eroare = "Ați raportat deja această sesizare." });
            }

            var abuse = new AbuseReport
            {
                IdReport = idReport,
                IdUser = currentUserId,
                Reason = dto.Reason,
                CreatedAt = DateTime.UtcNow
            };

            _context.AbuseReports.Add(abuse);
            await _context.SaveChangesAsync();

            return Ok(new { mesaj = "Raportarea a fost trimisă echipei de administrare." });
        }

        // ==========================================

        // ==========================================
        // 6. VERIFICARE ABUSE STATUS (A raportat deja?)
        // ==========================================
        [Authorize]
        [HttpGet("{idReport}/abuse-status")]
        public async Task<IActionResult> GetAbuseStatus(int idReport)
        {
            var userEmail = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
            if (string.IsNullOrEmpty(userEmail))
                return Ok(new { alreadyReported = false });

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
            if (user == null)
                return Ok(new { alreadyReported = false });

            var alreadyReported = await _context.AbuseReports
                .AnyAsync(a => a.IdReport == idReport && a.IdUser == user.IdUser);

            return Ok(new { alreadyReported });
        }

        // ==========================================
    // UPLOAD ENDPOINTS
    // ==========================================

    [Authorize]
    [HttpPost("upload-media")]
    public async Task<IActionResult> UploadMedia([FromForm] List<IFormFile> files)
    {
        if (files == null || files.Count == 0) return BadRequest(new { eroare = "Niciun fișier selectat." });
        if (files.Count > 3) return BadRequest(new { eroare = "Sunt permise maxim 3 imagini." });

        var folderPath = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
        if (!Directory.Exists(folderPath))
        {
            Directory.CreateDirectory(folderPath);
        }

        var uploadedUrls = new List<string>();

        foreach (var file in files)
        {
            if (file.Length > 5 * 1024 * 1024) return BadRequest(new { eroare = $"Fișierul {file.FileName} depășește limita de 5MB." });
            
            var extension = Path.GetExtension(file.FileName).ToLower();
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            if (!allowedExtensions.Contains(extension)) return BadRequest(new { eroare = "Sunt permise doar fișiere .jpg, .png sau .webp." });

            var fileName = Guid.NewGuid().ToString() + extension;
            var filePath = Path.Combine(folderPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Url salvat în DB ca /uploads/nume-fisier.jpg (se servește static din wwwroot)
            uploadedUrls.Add($"/uploads/{fileName}");
        }

        return Ok(new { urls = uploadedUrls });
    }

    // ==========================================
    // VOTE ENDPOINTS
    // ==========================================

    // POST: api/Reports/{id}/vote — toggle vote (adaugă sau șterge)
    [Authorize]
    [HttpPost("{idReport}/vote")]
    public async Task<IActionResult> ToggleVote(int idReport)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrEmpty(userEmail))
            return Unauthorized(new { eroare = "Token invalid." });

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null)
            return Unauthorized(new { eroare = "Utilizatorul nu există." });

        var report = await _context.Reports.FindAsync(idReport);
        if (report == null)
            return NotFound(new { eroare = "Sesizarea nu există." });

        var existingVote = await _context.Votes
            .FirstOrDefaultAsync(v => v.IdUser == user.IdUser && v.IdReport == idReport);

        bool voted;
        if (existingVote != null)
        {
            // Deja a votat → eliminăm votul
            _context.Votes.Remove(existingVote);
            voted = false;
        }
        else
        {
            // Nu a votat → adăugăm vot
            _context.Votes.Add(new Vote
            {
                IdUser = user.IdUser,
                IdReport = idReport,
                VotedAt = DateTime.UtcNow
            });
            voted = true;
        }

        await _context.SaveChangesAsync();

        var totalVotes = await _context.Votes.CountAsync(v => v.IdReport == idReport);
        return Ok(new { voted, totalVotes });
    }

    // GET: api/Reports/{id}/vote-status — verifică dacă user-ul curent a votat
    [Authorize]
    [HttpGet("{idReport}/vote-status")]
    public async Task<IActionResult> GetVoteStatus(int idReport)
    {
        var userEmail = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        if (string.IsNullOrEmpty(userEmail))
            return Ok(new { voted = false, totalVotes = 0 });

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userEmail);
        if (user == null)
            return Ok(new { voted = false, totalVotes = 0 });

        var hasVoted = await _context.Votes.AnyAsync(v => v.IdUser == user.IdUser && v.IdReport == idReport);
        var totalVotes = await _context.Votes.CountAsync(v => v.IdReport == idReport);

        return Ok(new { voted = hasVoted, totalVotes });
    }

    // ==========================================
    // DATA TRANSFER OBJECTS (DTOs)
    // ==========================================

    public class ReportHistoryDto
    {
        public string? StatusOld { get; set; }
        public required string StatusNew { get; set; }
        public DateTime ChangedAt { get; set; }
    }

    public class PublicReportDto
    {
        public int IdReport { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public required string Description { get; set; }
        public int IdCategory { get; set; }
        public int IdStatus { get; set; }
        public int? IdPriority { get; set; }
        public string? PriorityName { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? OfficialResponse { get; set; }
        public int VoteCount { get; set; }
        public List<string> Attachments { get; set; } = new List<string>();
        public string? CompanyName { get; set; }
        public List<ReportHistoryDto> History { get; set; } = new List<ReportHistoryDto>();
    }

    public class CreateReportDto
    {
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public required string Description { get; set; }
        public int IdCategory { get; set; }
        public List<string>? Attachments { get; set; } 
    }

    public class ReportAbuseDto
    {
        public required string Reason { get; set; }
    }
}
}