import { useCallback, useRef } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

export function useAtualizacaoAutomatica(
  carregar: () => unknown,
  intervaloMs = 15000,
) {
  const ref = useRef(carregar);
  ref.current = carregar;

  useFocusEffect(
    useCallback(() => {
      let ativo = AppState.currentState === "active";
      let executando = false;

      async function executar() {
        if (!ativo || executando) return;
        executando = true;
        try {
          await ref.current();
        } catch {
          /* falha silenciosa: mantém os dados atuais até a próxima tentativa */
        } finally {
          executando = false;
        }
      }

      executar();
      const timer = setInterval(executar, intervaloMs);
      const sub = AppState.addEventListener("change", (estado) => {
        const voltou = estado === "active" && !ativo;
        ativo = estado === "active";
        if (voltou) executar();
      });

      return () => {
        clearInterval(timer);
        sub.remove();
      };
    }, [intervaloMs]),
  );
}
