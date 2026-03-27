using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;
using SesizariGalatiAPI.Models;

namespace SesizariGalatiAPI.Data
{
    public class SesizariGalatiDbContext : DbContext
    {
        public SesizariGalatiDbContext(DbContextOptions<SesizariGalatiDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Report> Reports { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Dept> Departments { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Status> Statuses { get; set; }
        public DbSet<Domain> Domains { get; set; }
        public DbSet<Priority> Priorities { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<Vote> Votes { get; set; }
        public DbSet<ReportHistory> ReportHistories { get; set; }
        public DbSet<AbuseReport> AbuseReports { get; set; }
        
        //cheie compusa VOTE: id_user + id_report
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configurare cheie compusa pentru EF Vote
            modelBuilder.Entity<Vote>()
                .HasKey(v => new { v.IdUser, v.IdReport });
        }
    }
}