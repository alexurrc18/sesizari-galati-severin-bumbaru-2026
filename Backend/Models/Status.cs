using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SesizariGalatiAPI.Models
{
    [Table("STATUS")]
    public class Status
    {
        [Key]
        [Column("id_status")]
        public int IdStatus { get; set; }
        [Column("status_name")]
        public required string StatusName { get; set; }
    }
}