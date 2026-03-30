namespace FoTestApi.Application.Authentication.Commands
{
    public class ChangePasswordCommand
    {
        public string CurrentPassword { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }
}

