using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Vitus.Infrastructure.Security
{
    public class AesEncryptionConverter : ValueConverter<string?, string?>
    {
        private static byte[]? _key;

        public static void Configure(string rawKey)
        {
            if (string.IsNullOrWhiteSpace(rawKey))
                throw new InvalidOperationException("A chave de criptografia não pode ser vazia.");

            _key = SHA256.HashData(Encoding.UTF8.GetBytes(rawKey));
        }

        public AesEncryptionConverter()
            : base(
                v => Encrypt(v),
                v => Decrypt(v))
        {
        }

        private static byte[] GetKey()
        {
            if (_key != null)
                return _key;

            var envKey = Environment.GetEnvironmentVariable("ENCRYPTION_KEY");
            if (!string.IsNullOrWhiteSpace(envKey))
            {
                _key = SHA256.HashData(Encoding.UTF8.GetBytes(envKey));
                return _key;
            }

            throw new InvalidOperationException("A chave de criptografia ENCRYPTION_KEY não está configurada.");
        }

        private static string? Encrypt(string? plainText)
        {
            if (string.IsNullOrEmpty(plainText))
                return plainText;

            using var aes = Aes.Create();
            aes.Key = GetKey();
            aes.GenerateIV();

            using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
            var plainBytes = Encoding.UTF8.GetBytes(plainText);
            var cipherBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

            var result = new byte[aes.IV.Length + cipherBytes.Length];
            Buffer.BlockCopy(aes.IV, 0, result, 0, aes.IV.Length);
            Buffer.BlockCopy(cipherBytes, 0, result, aes.IV.Length, cipherBytes.Length);

            return Convert.ToBase64String(result);
        }

        private static string? Decrypt(string? cipherText)
        {
            if (string.IsNullOrEmpty(cipherText))
                return cipherText;

            var fullCipher = Convert.FromBase64String(cipherText);

            using var aes = Aes.Create();
            aes.Key = GetKey();

            var iv = new byte[16];
            var cipher = new byte[fullCipher.Length - 16];

            Buffer.BlockCopy(fullCipher, 0, iv, 0, 16);
            Buffer.BlockCopy(fullCipher, 16, cipher, 0, cipher.Length);

            aes.IV = iv;

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            var plainBytes = decryptor.TransformFinalBlock(cipher, 0, cipher.Length);

            return Encoding.UTF8.GetString(plainBytes);
        }
    }
}