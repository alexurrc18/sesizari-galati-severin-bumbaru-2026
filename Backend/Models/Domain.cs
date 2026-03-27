using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SesizariGalatiAPI.Models
{
    [Table("DOMAIN")]
    public class Domain
    {
        [Key]
        [Column("id_domain")]
        public int IdDomain { get; set; }
        [Column("domain_name")]
        public required string DomainName { get; set; }
    }
}