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
//
// O valor tem que bater exato (sem espaco em volta): quem compara e o
// bundler, no build, nao o codigo rodando.
// ---------------------------------------------------------------------------

export type ModoDemo = "completo" | "sem-serie" | "api-antiga";

// A comparacao e literal de proposito. O Vite troca import.meta.env por uma
// constante no build, e so assim o Rollup consegue dobrar isto em `null` e
// apagar o `if (MODO_DEMO)` inteiro do api.ts - junto com o import dos dados
// de mentira. Um Record indexado por variavel, que era como estava antes, ele
// nao consegue resolver, e os 25 nomes inventados iam parar no site publicado.
const VALOR = import.meta.env.VITE_MODO_DEMO;

export const MODO_DEMO: ModoDemo | null =
  VALOR === "1" || VALOR === "true" || VALOR === "completo"
    ? "completo"
    : VALOR === "sem-serie"
      ? "sem-serie"
      : VALOR === "api-antiga"
        ? "api-antiga"
        : null;
