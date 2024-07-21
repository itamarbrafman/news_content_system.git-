using System.ComponentModel.DataAnnotations;

public class ClientVote
{
    [Required]
    public string ClientID { get; set; } = string.Empty;     
    [Required]
    public VoteType MyVote { get; set; }
}
