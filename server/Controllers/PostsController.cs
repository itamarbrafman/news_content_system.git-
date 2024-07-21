using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;

[Route("api/[controller]")]
[ApiController]
public class PostsController : ControllerBase
{
    private readonly AppDbContext _context;

    public PostsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{clientID}")]
    public async Task<IActionResult> GetPostsByClientID(string clientID)
    {
        var posts = await _context.Posts
            .Include(p => p.ClientIDs)
            .Select(p => new
            {
                p.UID,
                p.Title,
                p.Text,
                p.TotalUpvotes,
                p.TotalDownvotes,
                MyVote = p.ClientIDs
                    .Where(c => c.ClientID == clientID)
                    .Select(c => c.MyVote)
                    .FirstOrDefault() // Get the first match or default value if none found
            })
            .ToListAsync();

        return Ok(posts);
    }

    [HttpPost("save_post")]
    public async Task<IActionResult> SavePost([FromBody] Post newPost)
    {
        // Check if the incoming post is valid
        if (newPost == null || !ModelState.IsValid)
        {
            return BadRequest("Invalid post data");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            // Retrieve the counter to generate a unique UID
            var counter = await _context.Counters.FirstOrDefaultAsync(c => c.Name == "postUID");
            if (counter == null)
            {
                return StatusCode(500, "Counter not found");
            }

            // Increment the counter and assign the new UID
            counter.Value += 1;
            newPost.UID = counter.Value;

            // Add the new post to the context
            _context.Posts.Add(newPost);

            // Save changes to the database
            await _context.SaveChangesAsync();

            // Commit the transaction
            await transaction.CommitAsync();

            // Return a 201 Created response with the new post
            return CreatedAtAction(nameof(SavePost), new { id = newPost.UID }, newPost);
        }
        catch (Exception ex)
        {
            // Rollback the transaction in case of an error
            await transaction.RollbackAsync();
            // Log the exception for debugging
            Console.Error.WriteLine(ex.ToString());
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("save_edit")]
    public async Task<IActionResult> SaveEdit([FromBody] Post editedPost)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var post = await _context.Posts.FindAsync(editedPost.UID);
            if (post == null) return NotFound("Post not found");

            post.Text = editedPost.Text;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok("Post updated successfully");
        }
        catch
        {
            await transaction.RollbackAsync();
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("save_vote_score")]
    public async Task<IActionResult> SaveVoteScore([FromBody] VoteRequest voteRequest)
    {
        if (voteRequest == null || !ModelState.IsValid)
        {
            return BadRequest("Invalid vote request");
        }

        using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var post = await _context.Posts.Include(p => p.ClientIDs)
                .FirstOrDefaultAsync(p => p.UID == voteRequest.UID);

            if (post == null)
            {
                return NotFound("Post not found");
            }

            var clientVote = post.ClientIDs.FirstOrDefault(c => c.ClientID == voteRequest.ClientID);
            if (clientVote != null)
            {
                // Update existing vote
                post.TotalUpvotes -= clientVote.MyVote == VoteType.UPVOTE ? 1 : 0;
                post.TotalDownvotes -= clientVote.MyVote == VoteType.DOWNVOTE ? 1 : 0;
                clientVote.MyVote = voteRequest.MyVote;
            }
            else
            {
                // Add new vote
                post.ClientIDs.Add(new ClientVote
                {
                    ClientID = voteRequest.ClientID,
                    MyVote = voteRequest.MyVote
                });
            }

            // Adjust vote counts
            post.TotalUpvotes += voteRequest.ChangeUpScore;
            post.TotalDownvotes += voteRequest.ChangeDownScore;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok("Post updated successfully");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            // Log exception details
            Console.Error.WriteLine(ex.ToString());
            return StatusCode(500, "Internal server error");
        }
    } // Ensure this closing brace matches the method opening brace

    // Add the closing brace for the class here
}

public class VoteRequest
{
    public int UID { get; set; }
    public string ClientID { get; set; }
    public VoteType MyVote { get; set; }
    public int ChangeUpScore { get; set; }
    public int ChangeDownScore { get; set; }
}