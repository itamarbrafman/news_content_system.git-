public class Post
{
    public int UID { get; set; }
    public string? Title { get; set; }
    public string? Text { get; set; }
    public int TotalUpvotes { get; set; }
    public int TotalDownvotes { get; set; }
    public string MyVote { get; set; }

    // Define ClientIDs if it should exist
    public ICollection<ClientVote> ClientIDs { get; set; } = new List<ClientVote>();
}
