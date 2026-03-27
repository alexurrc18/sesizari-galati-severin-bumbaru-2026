using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SesizariGalatiAPI.Models
{
    [Table("USER")]
    public class User
    {
        [Key]
        [Column("id_user")]
        public int IdUser { get; set; }
        [Column("first_name")]
        public string? FirstName { get; set; }
        [Column("last_name")]
        public string? LastName { get; set; }
        [Column("cnp")]
        public string? Cnp { get; set; }
        [Column("email")]
        public required string Email { get; set; }
        [Column("phone")]
        public string? Phone { get; set; }
        [Column("validation")]
        public required bool Validation { get; set; }
    }
}