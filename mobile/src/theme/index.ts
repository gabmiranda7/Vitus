import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { DefaultTheme, DarkTheme } from "@react-navigation/native";

export const cores = {
  primaria: "#1976d2",
  primariaEscura: "#1565c0",
  primariaClara: "#64b5f6",
  secundaria: "#7b1fa2",
  sucesso: "#2e7d32",
  aviso: "#ed6c02",
  erro: "#d32f2f",
  info: "#0288d1",

  // Gradientes por contexto (mesmo padrão do web)
  gradienteAzul: ["#1565c0", "#1976d2"],
  gradienteLaranja: ["#e65100", "#f57c00"],
  gradienteInfo: ["#0277bd", "#0288d1"],
  gradienteRoxo: ["#4a148c", "#7b1fa2"],
  gradienteVerde: ["#1b5e20", "#2e7d32"],
  gradienteVermelho: ["#b71c1c", "#d32f2f"],

  // Modo claro suave
  fundo: "#dce3ed",
  superficie: "#eaeff5",
  textoSecundario: "#5f6b7a",
  textoDesabilitado: "#8d99a6",

  // Modo escuro
  fundoEscuro: "#0f141a",
  superficieEscura: "#18202a",
  superficieEscuraElevada: "#202b38",
  textoSecundarioEscuro: "#9aa7b8",
  textoDesabilitadoEscuro: "#637080",
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: cores.primaria,
    secondary: cores.secundaria,
    background: cores.fundo,
    surface: cores.superficie,
    surfaceVariant: "#d5dde8",
    onSurface: "#1c2430",
    onSurfaceVariant: cores.textoSecundario,
    outline: "#c5d0de",
    elevation: {
      ...MD3LightTheme.colors.elevation,
      level1: cores.superficie,
      level2: "#e3e9f1",
      level3: "#dce3ed",
    },
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: cores.primariaClara,
    secondary: "#ce93d8",
    background: cores.fundoEscuro,
    surface: cores.superficieEscura,
    surfaceVariant: cores.superficieEscuraElevada,
    onSurface: "#e8eef5",
    onSurfaceVariant: cores.textoSecundarioEscuro,
    outline: "#2e3c4d",
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: cores.superficieEscura,
      level2: cores.superficieEscuraElevada,
      level3: "#263342",
    },
  },
};

export const navigationLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: cores.primaria,
    background: cores.fundo,
    card: cores.superficie,
    text: "#1c2430",
    border: "#d3dce6",
  },
};

export const navigationDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: cores.primariaClara,
    background: cores.fundoEscuro,
    card: cores.superficieEscura,
    text: "#e8eef5",
    border: "#253140",
  },
};

// Mantido para compatibilidade com importações existentes
export const theme = lightTheme;

export function corAvatar(nome: string) {
  const paleta = [
    "#1976d2",
    "#388e3c",
    "#7b1fa2",
    "#c62828",
    "#f57c00",
    "#0097a7",
  ];
  return paleta[(nome?.charCodeAt(0) || 0) % paleta.length];
}

export function iniciais(nome: string) {
  return (nome || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}
