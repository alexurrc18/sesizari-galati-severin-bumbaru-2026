using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SesizariGalatiAPI.Models
{
    [Table("PRIORITY")]
    public class Priority
    {
        [Key]
        [Column("id_priority")]
        public int IdPriority { get; set; }
        [Column("level_name")]
        public string? LevelName { get; set; }
        [Column("resolution_days")]
        public int ResolutionDays { get; set; }
    }
}