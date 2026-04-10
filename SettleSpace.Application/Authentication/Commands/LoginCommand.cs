namespace SettleSpace.Application.Authentication.Commands;

/// <summary>
/// Command to authenticate a user.
/// </summary>
public class LoginCommand
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
