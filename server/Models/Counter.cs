using System.ComponentModel.DataAnnotations;

public class Counter
{
    [Key]
    [Required]
    public string Name { get; set; } = string.Empty;
    public int Value { get; set; } = 0;
}
