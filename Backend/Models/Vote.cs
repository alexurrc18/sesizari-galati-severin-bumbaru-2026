using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SesizariGalatiAPI.Models
{
    [Table("VOTE")]
    public class Vote
    {
        //Cheie compusa, de configurat in DbContext
        [Column("id_user")]
        public int IdUser { get; set; }
        [Column("id_report")]
        public int IdReport { get; set; }
        [Column("voted_at")]
        public DateTime VotedAt { get; set; }
    }
}