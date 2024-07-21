using Microsoft.EntityFrameworkCore;

public class AppDbContext : DbContext
{
    public DbSet<Post> Posts { get; set; }
    public DbSet<Counter> Counters { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ClientVote>().HasKey(c => new { c.ClientID });
        modelBuilder.Entity<Counter>().HasData(new Counter { Name = "postUID", Value = 0 });
    }
}
