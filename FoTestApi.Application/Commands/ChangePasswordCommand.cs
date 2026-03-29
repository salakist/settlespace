namespace FoTestApi.Application.Commands
{
    public class ChangePasswordCommand
    {
        public string CurrentPassword { get; set; } = null!;
        public string NewPassword { get; set; } = null!;
    }
}