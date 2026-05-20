namespace Titan_Project.Server.Application.Auth;

public enum DuplicateUserField
{
    Username,
    Email,
}

public sealed class DuplicateUserException : Exception
{
    public DuplicateUserField Field { get; }

    public DuplicateUserException(DuplicateUserField field)
        : base($"Duplicate user field: {field}")
    {
        Field = field;
    }
}
