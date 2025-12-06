namespace Identity.API.Services;

/// <summary>
/// Interface for password hashing and verification
/// </summary>
public interface IPasswordHasher
{
    /// <summary>
    /// Hashes a password using Argon2id
    /// </summary>
    string HashPassword(string password);

    /// <summary>
    /// Verifies a password against its hash
    /// </summary>
    bool VerifyPassword(string password, string hash);
}
