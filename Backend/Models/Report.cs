using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SesizariGalatiAPI.Models
{
    [Table("REPORT")]
    public class Report
    {
        [Key]
        [Column("id_report")]
        public int IdReport { get; set; }
        [Column("id_user")]
        public int? IdUser { get; set; }
        [Column("id_category")]
        public int IdCategory { get; set; }
        [Column("description")]
        public required string Description { get; set; }
        [Column("official_response")]
        public string? OfficialResponse { get; set; }
        [Column("id_status")]
        public int IdStatus { get; set; }
        [Column("id_priority")]
        public int? IdPriority { get; set; }
        [Column("tax_id")]
        public string? TaxId { get; set; }
        [Column("created_at")]
        public DateTime CreatedAt { get; set; }
        [Column("resolved_at")]
        public DateTime? ResolvedAt { get; set; }
        [Column("latitude")]
        public decimal Latitude { get; set; }
        [Column("longitude")]
        public decimal Longitude { get; set; }
    }
}