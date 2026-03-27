using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SesizariGalatiAPI.Models
{
    [Table("REPORT_HISTORY")]
    public class ReportHistory
    {
        [Key]
        [Column("id_history")]
        public int IdHistory { get; set; }
        [Column("id_report")]
        public int IdReport { get; set; }
        [Column("id_status_old")]
        public int? IdStatusOld { get; set; }
        [Column("id_status_new")]
        public int IdStatusNew { get; set; }
        [Column("changed_at")]
        public DateTime ChangedAt { get; set; }
    }
}