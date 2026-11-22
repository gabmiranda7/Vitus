import * as FileSystem from "expo-file-system/legacy";

const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Conversão pura de ArrayBuffer para Base64, sem depender de btoa (falha no Hermes com bytes binários)
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;
  let base64 = "";

  for (let i = 0; i < len; i += 3) {
    const b1 = bytes[i];
    const b2 = i + 1 < len ? bytes[i + 1] : 0;
    const b3 = i + 2 < len ? bytes[i + 2] : 0;

    base64 += BASE64_CHARS[b1 >> 2];
    base64 += BASE64_CHARS[((b1 & 3) << 4) | (b2 >> 4)];
    base64 += i + 1 < len ? BASE64_CHARS[((b2 & 15) << 2) | (b3 >> 6)] : "=";
    base64 += i + 2 < len ? BASE64_CHARS[b3 & 63] : "=";
  }

  return base64;
}

const PREFIXOS_TEMPORARIOS = [
  "Receita_",
  "exame_",
  "perfil_",
  "auditoria_vitus_",
];

// Remove do cache os arquivos clínicos gerados pelo app (receitas, exames, relatórios e foto)
export async function limparArquivosTemporarios() {
  const dir = FileSystem.cacheDirectory;
  if (!dir) return;

  try {
    const nomes = await FileSystem.readDirectoryAsync(dir);
    await Promise.all(
      nomes
        .filter((nome) =>
          PREFIXOS_TEMPORARIOS.some((prefixo) => nome.startsWith(prefixo)),
        )
        .map((nome) =>
          FileSystem.deleteAsync(dir + nome, { idempotent: true }),
        ),
    );
  } catch {
    // limpeza é best-effort: não deve impedir o logout
  }
}
