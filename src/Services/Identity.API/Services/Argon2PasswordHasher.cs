using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;

namespace Identity.API.Services;

/// <summary>
/// Production-ready password hasher using Argon2id
/// </summary>
public class Argon2PasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16; // 128 bits
    private const int HashSize = 32; // 256 bits
    private const int Iterations = 3;
    private const int MemorySize = 65536; // 64 MB
    private const int DegreeOfParallelism = 1;

    public string HashPassword(string password)
    {
        // Generate a random salt
        var salt = RandomNumberGenerator.GetBytes(SaltSize);

        // Hash the password
        var hash = HashPasswordWithSalt(password, salt);

        // Combine salt and hash
        var combined = new byte[SaltSize + HashSize];
        Buffer.BlockCopy(salt, 0, combined, 0, SaltSize);
        Buffer.BlockCopy(hash, 0, combined, SaltSize, HashSize);

        // Return as base64 string with algorithm identifier
        return $"$argon2id$v=19$m={MemorySize},t={Iterations},p={DegreeOfParallelism}${Convert.ToBase64String(combined)}";
    }

    public bool VerifyPassword(string password, string hash)
    {
        try
        {
            // Parse the hash string
            if (!hash.StartsWith("$argon2id$"))
            {
                return false;
            }

            var parts = hash.Split('$');
            if (parts.Length < 5)
            {
                return false;
            }

            var combined = Convert.FromBase64String(parts[4]);
            if (combined.Length != SaltSize + HashSize)
            {
                return false;
            }

            // Extract salt and stored hash
            var salt = new byte[SaltSize];
            var storedHash = new byte[HashSize];
            Buffer.BlockCopy(combined, 0, salt, 0, SaltSize);
            Buffer.BlockCopy(combined, SaltSize, storedHash, 0, HashSize);

            // Hash the provided password with the same salt
            var computedHash = HashPasswordWithSalt(password, salt);

            // Compare hashes in constant time
            return CryptographicOperations.FixedTimeEquals(storedHash, computedHash);
        }
        catch
        {
            return false;
        }
    }

    private byte[] HashPasswordWithSalt(string password, byte[] salt)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            DegreeOfParallelism = DegreeOfParallelism,
            Iterations = Iterations,
            MemorySize = MemorySize
        };

        return argon2.GetBytes(HashSize);
    }
}
