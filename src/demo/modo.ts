// ---------------------------------------------------------------------------
// MODO DEMONSTRACAO
//
// Existe para ver a interface de uma funcionalidade nova sem depender do Apps
// Script publicado, sem copia da planilha e sem nome de aluno de verdade na
// tela de quem esta desenvolvendo.
//
// Fica desligado a menos que alguem peca explicitamente, por variavel de
// ambiente. O build de producao (deploy.yml) nao define VITE_MODO_DEMO, entao
// o site publicado nunca cai aqui.
//
//   VITE_MODO_DEMO=1           dados completos
//   VITE_MODO_DEMO=sem-serie   planilha sem a coluna de serie
//   VITE_MODO_DEMO=api-antiga  API publicada sem a secao do Projeto de Vida
//
// Ligado, a tela ganha uma tarja: numero inventado que passa por real e um
// print dele numa reuniao e exatamente o tipo de erro silencioso que este
// projeto ja pagou caro.
// ---------------------------------------------------------------------------

export type ModoDemo = "completo" | "sem-serie" | "api-antiga";

const VALOR = String(
  import.meta.env.VITE_MODO_DEMO ?? ""
).trim();

const APELIDOS: Record<string, ModoDemo> = {
  "1": "completo",
  true: "completo",
  completo: "completo",
  "sem-serie": "sem-serie",
  "api-antiga": "api-antiga",
};

export const MODO_DEMO: ModoDemo | null = APELIDOS[VALOR] ?? null;
