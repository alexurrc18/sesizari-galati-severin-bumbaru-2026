using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SesizariGalatiAPI.Models
{
    [Table("CATEGORY")]
    public class Category
    {
        [Key]
        [Column("id_category")]
        public int IdCategory { get; set; }
        [Column("category_name")]
        public required string CategoryName { get; set; }
        [Column("id_domain")]
        public int? IdDomain { get; set; }
    }
}