using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SesizariGalatiAPI.Models
{
    [Table("COMPANY")]
    public class Company
    {
        [Key]
        [Column("id_company")]
        public int IdCompany { get; set; }
        [Column("tax_id")]
        public required string TaxId { get; set; }
        [Column("company_name")]
        public required string CompanyName { get; set; }
        [Column("id_domain")]
        public int IdDomain { get; set; }
        [Column("email")]
        public required string Email { get; set; }
        [Column("phone")]
        public required string Phone { get; set; }
    }
}