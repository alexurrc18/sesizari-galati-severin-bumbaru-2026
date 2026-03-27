using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SesizariGalatiAPI.Models
{
    [Table("ATTACHMENT")]
    public class Attachment
    {
        [Key]
        [Column("id_attachment")]
        public int IdAttachment { get; set; }
        [Column("file_url")]
        public required string FileUrl { get; set; }
        [Column("id_report")]
        public int IdReport { get; set; }
    }
}