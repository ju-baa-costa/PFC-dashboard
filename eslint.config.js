import js from "@eslint/js";
import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

// Mesmo escopo do antigo .eslintrc.cjs: apenas os fontes TypeScript.
const TS_FILES = ["**/*.{ts,tsx}"];

export default [
  { ignores: ["dist", "apps-script"] },

  { files: TS_FILES, ...js.configs.recommended },

  ...tseslint.configs["flat/recommended"].map((config) => ({
    files: TS_FILES,
    ...config,
  })),

  {
    files: TS_FILES,

    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },

    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },

    rules: {
      ...reactHooks.configs["recommended-latest"].rules,

      // Desestruturar com rest e a forma idiomatica de omitir um campo
      // (ex.: `TURMAS.map(({ alunosLista, ...turma }) => turma)`), entao o
      // nome descartado nao conta como variavel sem uso. O prefixo `_` serve
      // para o descarte explicito nos demais casos.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // TODO (debito tecnico): a resposta de getDashboardData() nao tem tipo,
      // entao `any` se espalha por useDashboard e pelas paginas (16 pontos).
      // O conserto real e modelar o payload do apps-script/Codigo.gs em
      // src/services/types.ts e tipar getDashboardData — ai esta regra volta
      // a ser "error".
      "@typescript-eslint/no-explicit-any": "off",

      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
];
