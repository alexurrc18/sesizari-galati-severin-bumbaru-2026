using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SesizariGalatiAPI.Models
{
    [Table("ABUSE_REPORT")]
    public class AbuseReport
    {
        [Key]
        [Column("id_abuse")]
        public int IdAbuse { get; set; }

        [Column("id_report")]
        public required int IdReport { get; set; }

        [Column("id_user")]
        public required int IdUser { get; set; }

        [Column("reason")]
        public required string Reason { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; }

        [Column("is_resolved")]
        public bool IsResolved { get; set; } = false;
    }
}
