using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SesizariGalatiAPI.Models
{
    [Table("EMPLOYEE")]
    public class Employee
    {
        [Key]
        [Column("id_employee")]
        public int IdEmployee { get; set; }
        [Column("first_name")]
        public required string FirstName { get; set; }
        [Column("last_name")]
        public required string LastName { get; set; }
        [Column("email")]
        public required string Email { get; set; }
        [Column("phone")]
        public required string Phone { get; set; }
        [Column("dept_code")]
        public required string DeptCode { get; set; }
    }
}