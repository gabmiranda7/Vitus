import { useEffect, useRef } from "react";

export function useAtualizacaoAutomatica(
  carregar: () => unknown,
  intervaloMs = 15000,
) {
  const ref = useRef(carregar);
  useEffect(() => {
    ref.current = carregar;
  });

  useEffect(() => {
    let executando = false;

    async function executar() {
      if (document.hidden || executando) return;
      executando = true;
      try {
        await ref.current();
      } catch {
        /* falha silenciosa: mantém os dados atuais até a próxima tentativa */
      } finally {
        executando = false;
      }
    }

    const timer = setInterval(executar, intervaloMs);
    document.addEventListener("visibilitychange", executar);
    window.addEventListener("focus", executar);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", executar);
      window.removeEventListener("focus", executar);
    };
  }, [intervaloMs]);
}
