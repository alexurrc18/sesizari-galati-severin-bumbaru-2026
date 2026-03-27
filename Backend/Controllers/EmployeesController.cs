using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Net.Mail;
using SesizariGalatiAPI.Data;
using SesizariGalatiAPI.Models;

namespace SesizariGalatiAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Employee")] // <--- Restricționează accesul DOAR pentru angajați
    public class EmployeesController : ControllerBase
    {
        private readonly SesizariGalatiDbContext _context;
        private readonly IConfiguration _configuration;

        public EmployeesController(SesizariGalatiDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // Helper: verificare dacă angajatul curent aparține departamentului D10
        private bool IsD10()
        {
            var deptClaim = User.Claims.FirstOrDefault(c => c.Type == "dept_code");
            return deptClaim?.Value == "D10";
        }

        // 1. STATISTICI PENTRU DASHBOARD
        // GET: api/Employees/stats
        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var now = DateTime.UtcNow;
            var oneDayAgo = now.AddDays(-1);
            var oneMonthAgo = now.AddMonths(-1);

            // Status IDs din BD: 1=Nou, 2=În lucru, 3=Rezolvat, 4=Respins
            var total24h = await _context.Reports.CountAsync(r => r.CreatedAt >= oneDayAgo);
            var inProgress = await _context.Reports.CountAsync(r => r.IdStatus == 2);
            var unresolvedOver1Month = await _context.Reports.CountAsync(r => r.IdStatus != 3 && r.IdStatus != 4 && r.CreatedAt <= oneMonthAgo);

            // Timpul mediu de soluționare (doar pentru cele rezolvate - status 3)
            var resolvedReports = await _context.Reports
                .Where(r => r.IdStatus == 3 && r.ResolvedAt.HasValue)
                .ToListAsync();

            double avgDays = 0;
            if (resolvedReports.Any())
            {
                avgDays = resolvedReports.Average(r => (r.ResolvedAt!.Value - r.CreatedAt).TotalDays);
            }

            return Ok(new
            {
                sesizariNoi24h = total24h,
                sesizariInLucru = inProgress,
                nesolutionatePeste1Luna = unresolvedOver1Month,
                timpMediuSolutionareZile = Math.Round(avgDays, 1)
            });
        }

        // 2. LISTA COMPLETĂ DE SESIZĂRI PENTRU TABELUL DE ADMIN
        // GET: api/Employees/reports
        [HttpGet("reports")]
        public async Task<IActionResult> GetAllReportsForAdmin()
        {
            var allReports = await _context.Reports
                .OrderByDescending(r => r.CreatedAt) // Cele mai noi primele
                .Select(r => new 
                {
                    r.IdReport,
                    r.IdUser, 
                    r.IdCategory,
                    r.IdStatus,
                    r.IdPriority,
                    r.Description,
                    r.Latitude,
                    r.Longitude,
                    r.CreatedAt,
                    r.TaxId, // Compania asignată (dacă există)
                    Attachments = _context.Attachments.Where(a => a.IdReport == r.IdReport).Select(a => a.FileUrl).ToList(),
                    AbuseCount = _context.AbuseReports.Count(a => a.IdReport == r.IdReport)
                })
                .ToListAsync();

            return Ok(allReports);
        }

        // 3. MODERARE: PUBLICARE SAU RESPINGERE SESIZARE
        // PUT: api/Employees/reports/{idReport}/moderate
        [HttpPut("reports/{idReport}/moderate")]
        public async Task<IActionResult> ModerateReport(int idReport, [FromBody] ModerateReportDto request)
        {
            // Restricție D10
            if (!IsD10())
                return StatusCode(403, new { eroare = "Doar departamentul D10 poate modera sesizări." });

            var report = await _context.Reports.FindAsync(idReport);
            if (report == null) return NotFound(new { eroare = "Sesizarea nu există." });

            // Dacă e deja aprobată sau în alt status avansat, nu mai avem ce modera inițial
            if (report.IdStatus != 1) 
                return BadRequest(new { eroare = "Această sesizare a fost deja moderată." });

            if (request.Aproba)
            {
                // Raw SQL pentru a evita trigger-ul fn_validate_report_dates
                var newStatus = 2;
                if (request.NewCategoryId.HasValue && request.NewPriorityId.HasValue)
                {
                    await _context.Database.ExecuteSqlRawAsync(
                        "UPDATE \"REPORT\" SET id_status = {0}, id_category = {1}, id_priority = {2} WHERE id_report = {3}",
                        newStatus, request.NewCategoryId.Value, request.NewPriorityId.Value, idReport
                    );
                }
                else if (request.NewCategoryId.HasValue)
                {
                    await _context.Database.ExecuteSqlRawAsync(
                        "UPDATE \"REPORT\" SET id_status = {0}, id_category = {1} WHERE id_report = {2}",
                        newStatus, request.NewCategoryId.Value, idReport
                    );
                }
                else if (request.NewPriorityId.HasValue)
                {
                    await _context.Database.ExecuteSqlRawAsync(
                        "UPDATE \"REPORT\" SET id_status = {0}, id_priority = {1} WHERE id_report = {2}",
                        newStatus, request.NewPriorityId.Value, idReport
                    );
                }
                else
                {
                    await _context.Database.ExecuteSqlRawAsync(
                        "UPDATE \"REPORT\" SET id_status = {0} WHERE id_report = {1}",
                        newStatus, idReport
                    );
                }
                
                // NOTIFICARE EMAIL CETĂȚEAN
                if (report.IdUser.HasValue)
                {
                    var user = await _context.Users.FindAsync(report.IdUser.Value);
                    if (user != null && !string.IsNullOrEmpty(user.Email))
                    {
                        try { await SendUserStatusEmailAsync(user.Email, user.FirstName ?? "Cetățean", idReport, "În lucru (Aprobată)", null); }
                        catch (Exception ex) { Console.WriteLine($"[EMAIL ERROR]: {ex.Message}"); }
                    }
                }

                return Ok(new { mesaj = "Sesizarea a fost publicată pe hartă!" });
            }
            else
            {
                // Respingem sesizarea (Status 4 = Respins)
                await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE \"REPORT\" SET id_status = 4 WHERE id_report = {0}",
                    idReport
                );

                // NOTIFICARE EMAIL CETĂȚEAN
                if (report.IdUser.HasValue)
                {
                    var user = await _context.Users.FindAsync(report.IdUser.Value);
                    if (user != null && !string.IsNullOrEmpty(user.Email))
                    {
                        try { await SendUserStatusEmailAsync(user.Email, user.FirstName ?? "Cetățean", idReport, "Respinsă", null); }
                        catch (Exception ex) { Console.WriteLine($"[EMAIL ERROR]: {ex.Message}"); }
                    }
                }

                return Ok(new { mesaj = "Sesizarea a fost respinsă." });
            }
        }

        // 4. ASIGNARE COMPANIE ȘI EMAIL
        // PUT: api/Employees/reports/{idReport}/assign-company
        [HttpPut("reports/{idReport}/assign-company")]
        public async Task<IActionResult> AssignCompany(int idReport, [FromBody] AssignCompanyDto request)
        {
            // Restricție D10
            if (!IsD10())
                return StatusCode(403, new { eroare = "Doar departamentul D10 poate asigna companii." });

            var report = await _context.Reports.FindAsync(idReport);
            if (report == null) return NotFound(new { eroare = "Sesizarea nu există." });

            var company = await _context.Companies.FirstOrDefaultAsync(c => c.TaxId == request.TaxId);
            if (company == null) return NotFound(new { eroare = "Compania nu există în sistem." });

            // Assign company + priority (dacă este furnizată)
            if (request.IdPriority.HasValue)
            {
                await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE \"REPORT\" SET tax_id = {0}, id_priority = {1} WHERE id_report = {2}",
                    company.TaxId, request.IdPriority.Value, idReport
                );
            }
            else
            {
                await _context.Database.ExecuteSqlRawAsync(
                    "UPDATE \"REPORT\" SET tax_id = {0} WHERE id_report = {1}",
                    company.TaxId, idReport
                );
            }
            // Reîncărcăm entitatea ca să fie sincronizată
            await _context.Entry(report).ReloadAsync();

            // Pregătim info prioritate pentru email
            string? priorityInfo = null;
            if (request.IdPriority.HasValue)
            {
                var priority = await _context.Priorities.FindAsync(request.IdPriority.Value);
                if (priority != null)
                {
                    priorityInfo = $"{priority.LevelName} ({priority.ResolutionDays} zile)";
                }
            }

            // Trimitem email companiei (cu prioritate)
            try
            {
                await SendCompanyEmailAsync(company.Email, company.CompanyName, report.Description, priorityInfo);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL ERROR]: {ex.Message}");
                return Ok(new { mesaj = "Compania a fost asignată, dar trimiterea email-ului a eșuat. Verificați conexiunea." });
            }

            return Ok(new { mesaj = $"Compania {company.CompanyName} a fost asignată și notificată pe email!" });
        }

        // 5. FINALIZARE SESIZARE
        // PUT: api/Employees/reports/{idReport}/resolve
        [HttpPut("reports/{idReport}/resolve")]
        public async Task<IActionResult> ResolveReport(int idReport, [FromBody] ResolveReportDto request)
        {
            // Restricție D10
            if (!IsD10())
                return StatusCode(403, new { eroare = "Doar departamentul D10 poate finaliza sesizări." });

            var report = await _context.Reports.FindAsync(idReport);
            if (report == null) return NotFound(new { eroare = "Sesizarea nu există." });

            // Poate fi finalizată DOAR dacă este "În lucru" (Status 2)
            if (report.IdStatus != 2)
            {
                return BadRequest(new { eroare = "Sesizarea poate fi finalizată doar dacă este 'În lucru'." });
            }

            // Resolve: Status 2 (În lucru) → 3 (Rezolvat)
            await _context.Database.ExecuteSqlRawAsync(
                "UPDATE \"REPORT\" SET id_status = 3, official_response = {0}, resolved_at = {1} WHERE id_report = {2}",
                request.OfficialResponse, DateTime.UtcNow, idReport
            );

            // NOTIFICARE EMAIL CETĂȚEAN
            if (report.IdUser.HasValue)
            {
                var user = await _context.Users.FindAsync(report.IdUser.Value);
                if (user != null && !string.IsNullOrEmpty(user.Email))
                {
                    try { await SendUserStatusEmailAsync(user.Email, user.FirstName ?? "Cetățean", idReport, "Finalizată (Rezolvat)", request.OfficialResponse); }
                    catch (Exception ex) { Console.WriteLine($"[EMAIL ERROR]: {ex.Message}"); }
                }
            }

            return Ok(new { mesaj = "Sesizarea a fost marcată ca finalizată cu succes!" });
        }

        // ==========================================
        // 6. RAPOARTE DE ABUZ (ADMIN)
        // ==========================================

        // GET: api/Employees/abuse-reports
        [HttpGet("abuse-reports")]
        public async Task<IActionResult> GetAbuseReports()
        {
            var abuseReports = await _context.AbuseReports
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new
                {
                    a.IdAbuse,
                    a.IdReport,
                    a.IdUser,
                    a.Reason,
                    a.CreatedAt,
                    a.IsResolved,
                    ReportDescription = _context.Reports.Where(r => r.IdReport == a.IdReport).Select(r => r.Description).FirstOrDefault(),
                    UserName = _context.Users.Where(u => u.IdUser == a.IdUser).Select(u => (u.FirstName ?? "") + " " + (u.LastName ?? "")).FirstOrDefault(),
                    UserEmail = _context.Users.Where(u => u.IdUser == a.IdUser).Select(u => u.Email).FirstOrDefault()
                })
                .ToListAsync();

            return Ok(abuseReports);
        }

        // PUT: api/Employees/abuse-reports/{id}/resolve
        [HttpPut("abuse-reports/{id}/resolve")]
        public async Task<IActionResult> ResolveAbuseReport(int id)
        {
            if (!IsD10())
                return StatusCode(403, new { eroare = "Doar departamentul D10 poate gestiona rapoartele de abuz." });

            var abuse = await _context.AbuseReports.FindAsync(id);
            if (abuse == null) return NotFound(new { eroare = "Raportul de abuz nu a fost găsit." });

            abuse.IsResolved = true;
            await _context.SaveChangesAsync();

            return Ok(new { mesaj = "Raportul a fost marcat ca rezolvat." });
        }

        // DELETE: api/Employees/abuse-reports/{id}
        [HttpDelete("abuse-reports/{id}")]
        public async Task<IActionResult> DeleteAbuseReport(int id)
        {
            if (!IsD10())
                return StatusCode(403, new { eroare = "Doar departamentul D10 poate șterge rapoartele de abuz." });

            var abuse = await _context.AbuseReports.FindAsync(id);
            if (abuse == null) return NotFound(new { eroare = "Raportul de abuz nu a fost găsit." });

            _context.AbuseReports.Remove(abuse);
            await _context.SaveChangesAsync();

            return Ok(new { mesaj = "Raportul de abuz a fost șters." });
        }

        // ==========================================
        // PRIVATE HELPER METHOD FOR EMAILS
        // ==========================================
        private async Task SendCompanyEmailAsync(string targetEmail, string companyName, string reportDescription, string? priorityInfo = null)
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var senderEmail = emailSettings["SenderEmail"];
            var senderPassword = emailSettings["SenderPassword"];
            var smtpServer = emailSettings["SmtpServer"];
            int smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");

            string body = $"Salut {companyName},\n\nV-a fost alocată o nouă sesizare pentru soluționare.\n\nDetalii problemă:\n{reportDescription}\n";
            if (!string.IsNullOrEmpty(priorityInfo))
            {
                body += $"\nNivel de prioritate: {priorityInfo}\n";
            }
            body += "\nVă rugăm să accesați platforma pentru detalii.\n\nEchipa Sesizări Galați.";

            var mailMessage = new MailMessage(senderEmail!, targetEmail)
            {
                Subject = "Nouă sesizare alocată - Sesizări Galați",
                Body = body,
                IsBodyHtml = false
            };

            using var smtpClient = new SmtpClient(smtpServer, smtpPort)
            {
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = true
            };

            await smtpClient.SendMailAsync(mailMessage);
        }

        private async Task SendUserStatusEmailAsync(string targetEmail, string firstName, int reportId, string newStatus, string? officialResponse)
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var senderEmail = emailSettings["SenderEmail"];
            var senderPassword = emailSettings["SenderPassword"];
            var smtpServer = emailSettings["SmtpServer"];
            int smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");

            string body = $"Salut {firstName},\n\nSesizarea ta cu numărul #{reportId} a primit o actualizare de status.\n\nNoul status: {newStatus}\n";
            if (!string.IsNullOrEmpty(officialResponse))
            {
                body += $"\nRăspuns oficial din partea echipei:\n\"{officialResponse}\"\n";
            }
            body += "\nDeschide platforma Sesizări Galați pentru mai multe detalii.\n\nÎți mulțumim pentru implicare!";

            var mailMessage = new MailMessage(senderEmail!, targetEmail)
            {
                Subject = $"Actualizare status sesizare #{reportId}",
                Body = body,
                IsBodyHtml = false
            };

            using var smtpClient = new SmtpClient(smtpServer, smtpPort)
            {
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = true
            };

            await smtpClient.SendMailAsync(mailMessage);
        }
    }

    // ==========================================
    // DTOs
    // ==========================================
    public class ModerateReportDto
    {
        public bool Aproba { get; set; } // true = Publică pe hartă, false = Șterge
        public int? NewCategoryId { get; set; } // Angajatul poate corecta categoria
        public int? NewPriorityId { get; set; } // Angajatul setează prioritatea
    }

    public class AssignCompanyDto
    {
        public required string TaxId { get; set; } // CUI-ul companiei
        public int? IdPriority { get; set; } // Prioritatea sesizării (setată de D10)
    }

    public class ResolveReportDto
    {
        public required string OfficialResponse { get; set; } // Răspunsul oficial al primăriei
    }
}