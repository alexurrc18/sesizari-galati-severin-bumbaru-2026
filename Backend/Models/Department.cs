using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SesizariGalatiAPI.Models
{
    [Table("DEPT")]
    public class Dept
    {
        [Key]
        [Column("dept_code")]
        public required string DeptCode { get; set; }
        [Column("dept_name")]
        public required string DeptName { get; set; }
    }
}