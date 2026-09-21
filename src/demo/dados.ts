// ---------------------------------------------------------------------------
// DADOS ARTIFICIAIS
//
// Uma resposta do doGet copiada na mao, nao uma segunda implementacao das
// contas: nada aqui recalcula nada. Se a forma da resposta mudar no Apps
// Script, este arquivo tem que ser atualizado junto - e o preco de poder ver
// a interface sem backend.
//
// Os numeros fecham de proposito (as turmas somam as escolas, que somam as
// cidades, que somam o resumo). Dado de mentira que nao fecha vira caca a
// bug inexistente na primeira vez que alguem conferir a conta na tela.
//
// Casos cobertos:
// - alerta verde, amarelo e vermelho nos cards de cidade, escola e turma
// - turma lotada (vagasDisponiveis negativo)
// - escolas homonimas em cidades diferentes ("EE Monteiro Lobato")
// - supervisores nas tres faixas de frequencia
// - cidade com um unico aluno no 9o ano (singular na tela)
// - cidade que so existe numa das series (Votorantim nao tem 8o ano), para
//   conferir que os chips trocam junto com o card de serie
// - nomes acentuados, para conferir a ordem alfabetica
// - alunos ativos sem serie, que ficam de fora das contas das duas series
// ---------------------------------------------------------------------------

// Nome de escola se repete entre municipios de verdade, e agruparEscolas
// chaveia so pelo nome: as duas "EE Monteiro Lobato" chegam ao front ja
// somadas numa escola so, com a cidade da primeira. Esta copiado assim
// porque e o que a API responde hoje, nao porque esteja certo.
const ESCOLA_HOMONIMA = "EE Monteiro Lobato";

const NOMES_NONO_ANO = [
  ["Álvaro Dias Pinto", "São Roque", ESCOLA_HOMONIMA],
  ["Alice Ferreira Braga", "Sorocaba", "EE Paulo Freire"],
  ["Ana Clara Monteiro", "São Roque", ESCOLA_HOMONIMA],
  ["Beatriz Nogueira Sá", "Ibiúna", "EE Cecília Meireles"],
  ["Bruno Tavares Lima", "Sorocaba", ESCOLA_HOMONIMA],
  ["Caio Medeiros Rocha", "Votorantim", "EE Carolina de Jesus"],
  ["Camila Restinga", "São Roque", ESCOLA_HOMONIMA],
  ["Cauã Oliveira Prado", "Sorocaba", ESCOLA_HOMONIMA],
  ["Débora Antunes Vaz", "Ibiúna", "EE Cecília Meireles"],
  ["Diego Fontes Aparecido", "São Roque", ESCOLA_HOMONIMA],
  ["Eduardo Vilela Cruz", "Sorocaba", ESCOLA_HOMONIMA],
  ["Elisa Camargo Pires", "São Roque", ESCOLA_HOMONIMA],
  ["Fernanda Rocha Alves", "São Roque", ESCOLA_HOMONIMA],
  ["Gabriel Siqueira Dias", "Ibiúna", "EE Cecília Meireles"],
  ["Heloísa Barreto Luz", "Sorocaba", "EE Paulo Freire"],
  ["Igor Nascimento Reis", "São Roque", ESCOLA_HOMONIMA],
  ["Íris Salgado Moura", "Ibiúna", "EE Cecília Meireles"],
  ["João Vitor Peixoto", "Sorocaba", ESCOLA_HOMONIMA],
  ["Larissa Quintana", "Sorocaba", "EE Paulo Freire"],
  ["Luís Otávio Marques", "São Roque", ESCOLA_HOMONIMA],
  ["Mariana Espíndola", "Ibiúna", "EE Cecília Meireles"],
  ["Otávio Bandeira Melo", "Sorocaba", ESCOLA_HOMONIMA],
  ["Rafaela Coutinho", "São Roque", ESCOLA_HOMONIMA],
  ["Sofia Mendonça Leal", "Sorocaba", "EE Paulo Freire"],
  ["Thiago Aparício Neves", "Sorocaba", ESCOLA_HOMONIMA],
] as const;

const NOMES_OITAVO_ANO = [
  ["Antônio Vilar Prates", "São Roque", ESCOLA_HOMONIMA],
  ["Aurora Gentil Paz", "Ibiúna", "EE Cecília Meireles"],
  ["Benício Fagundes Rios", "Sorocaba", ESCOLA_HOMONIMA],
  ["Clarice Andrade Bueno", "São Roque", ESCOLA_HOMONIMA],
  ["Davi Lucca Serrano", "Sorocaba", "EE Paulo Freire"],
  ["Emanuelly Saraiva Pilar", "Ibiúna", "EE Cecília Meireles"],
  ["Enzo Gabriel Portela", "São Roque", ESCOLA_HOMONIMA],
  ["Giovanna Teles Ramires", "Ibiúna", "EE Cecília Meireles"],
  ["Helena Cordeiro Brasil", "São Roque", ESCOLA_HOMONIMA],
  ["Isaac Villaça Moreno", "Sorocaba", ESCOLA_HOMONIMA],
  ["Joana Darc Figueiró", "Ibiúna", "EE Cecília Meireles"],
  ["Kauã Bezerra Tinoco", "Sorocaba", "EE Paulo Freire"],
  ["Lorena Pontes Amaral", "São Roque", ESCOLA_HOMONIMA],
  ["Miguel Arcanjo Duarte", "Ibiúna", "EE Cecília Meireles"],
  ["Nicolas Vieira Sampaio", "Sorocaba", ESCOLA_HOMONIMA],
  ["Olívia Marçal Bastos", "São Roque", ESCOLA_HOMONIMA],
  ["Pietra Guimarães Sodré", "Ibiúna", "EE Cecília Meireles"],
  ["Rodrigo Yuji Nakamura", "Sorocaba", "EE Paulo Freire"],
  ["Valentina Uchôa Lins", "São Roque", ESCOLA_HOMONIMA],
] as const;

// O backend ja entrega ordenado; ordenar aqui e so para a lista de mentira
// nao depender de eu ter digitado os nomes na ordem certa.
function ordenados(
  nomes: ReadonlyArray<readonly [string, string, string]>
) {
  return nomes
    .map(([nome, cidade, escola]) => ({ nome, cidade, escola }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

const ALUNOS_NONO_ANO = ordenados(NOMES_NONO_ANO);
const ALUNOS_OITAVO_ANO = ordenados(NOMES_OITAVO_ANO);

// As duas series como a API responde em `projetoDeVida.series`: cada uma com
// os proprios chips de cidade e escola, porque o card de serie e o que decide
// o que aparece nos filtros e na tabela.
//
// As contagens estao digitadas na mao, como o resto deste arquivo - mas elas
// tem que bater com as listas de nomes acima. Chip dizendo 7 e tabela
// mostrando 6 e exatamente a divergencia que a tela existe para nao ter.
const SERIE_OITAVO_ANO = {
  ano: 8,

  noAno: 19,

  percentualDoPrograma: 22.9,

  cidades: [
    { nome: "Ibiúna", alunos: 6 },
    { nome: "São Roque", alunos: 7 },
    { nome: "Sorocaba", alunos: 6 },
  ],

  escolas: [
    { nome: "EE Cecília Meireles", cidade: "Ibiúna", alunos: 6 },
    { nome: ESCOLA_HOMONIMA, cidade: "São Roque", alunos: 7 },
    { nome: ESCOLA_HOMONIMA, cidade: "Sorocaba", alunos: 3 },
    { nome: "EE Paulo Freire", cidade: "Sorocaba", alunos: 3 },
  ],

  alunos: ALUNOS_OITAVO_ANO,
};

const SERIE_NONO_ANO = {
  ano: 9,

  noAno: 25,

  percentualDoPrograma: 30.1,

  cidades: [
    { nome: "Ibiúna", alunos: 5 },
    { nome: "São Roque", alunos: 9 },
    { nome: "Sorocaba", alunos: 10 },
    { nome: "Votorantim", alunos: 1 },
  ],

  escolas: [
    { nome: "EE Carolina de Jesus", cidade: "Votorantim", alunos: 1 },
    { nome: "EE Cecília Meireles", cidade: "Ibiúna", alunos: 5 },
    { nome: ESCOLA_HOMONIMA, cidade: "São Roque", alunos: 9 },
    { nome: ESCOLA_HOMONIMA, cidade: "Sorocaba", alunos: 6 },
    { nome: "EE Paulo Freire", cidade: "Sorocaba", alunos: 4 },
  ],

  alunos: ALUNOS_NONO_ANO,
};

// Os campos soltos sao os que a API mantem para a Home (`noAno`) e para um
// front mais velho que o Apps Script publicado. Aqui eles saem de
// SERIE_NONO_ANO pelo mesmo motivo que saem no backend: copia, nunca uma
// segunda conta.
const PROJETO_DE_VIDA = {
  ano: SERIE_NONO_ANO.ano,

  noAno: SERIE_NONO_ANO.noAno,
  proximoAno: SERIE_OITAVO_ANO.noAno,

  totalAtivos: 83,

  percentualDoPrograma: SERIE_NONO_ANO.percentualDoPrograma,

  alunosSemSerie: 3,

  cidades: SERIE_NONO_ANO.cidades,
  escolas: SERIE_NONO_ANO.escolas,
  alunos: SERIE_NONO_ANO.alunos,

  series: [SERIE_OITAVO_ANO, SERIE_NONO_ANO],
};

const TURMAS = [
  {
    codigo: "SR-LOBATO-A",
    nome: `${ESCOLA_HOMONIMA} A`,
    cidade: "São Roque",
    escola: ESCOLA_HOMONIMA,
    supervisor: "Ana Paula Ribeiro",
    alunos: 20,
    desligados: 2,
    alunosAtivos: 18,
    vagas: 20,
    vagasDisponiveis: 2,
    taxaEvasao: 10.0,
    nivelAlerta: "verde",
    frequenciaMedia: 88.4,
    alunosLista: [
      "Ana Clara Monteiro",
      "Camila Restinga",
      "Diego Fontes Aparecido",
      "Elisa Camargo Pires",
      "Fernanda Rocha Alves",
    ],
  },
  {
    codigo: "SR-LOBATO-B",
    nome: `${ESCOLA_HOMONIMA} B`,
    cidade: "São Roque",
    escola: ESCOLA_HOMONIMA,
    supervisor: "Ana Paula Ribeiro",
    alunos: 18,
    desligados: 5,
    alunosAtivos: 13,
    vagas: 20,
    vagasDisponiveis: 7,
    taxaEvasao: 35.0,
    nivelAlerta: "amarelo",
    frequenciaMedia: 74.2,
    alunosLista: [
      "Álvaro Dias Pinto",
      "Igor Nascimento Reis",
      "Luís Otávio Marques",
      "Rafaela Coutinho",
    ],
  },
  // Lotada: mais alunos ativos do que vagas, para ver a tarja de lotacao.
  {
    codigo: "SO-LOBATO-A",
    nome: `${ESCOLA_HOMONIMA} A`,
    cidade: "Sorocaba",
    escola: ESCOLA_HOMONIMA,
    supervisor: "Carlos Eduardo Nunes",
    alunos: 24,
    desligados: 1,
    alunosAtivos: 23,
    vagas: 20,
    vagasDisponiveis: -3,
    taxaEvasao: 0,
    nivelAlerta: "verde",
    frequenciaMedia: 83.1,
    alunosLista: [
      "Bruno Tavares Lima",
      "Cauã Oliveira Prado",
      "Eduardo Vilela Cruz",
      "João Vitor Peixoto",
      "Otávio Bandeira Melo",
      "Thiago Aparício Neves",
    ],
  },
  {
    codigo: "SO-FREIRE-A",
    nome: "EE Paulo Freire",
    cidade: "Sorocaba",
    escola: "EE Paulo Freire",
    supervisor: "Carlos Eduardo Nunes",
    alunos: 14,
    desligados: 5,
    alunosAtivos: 9,
    vagas: 20,
    vagasDisponiveis: 11,
    taxaEvasao: 55.0,
    nivelAlerta: "vermelho",
    frequenciaMedia: 61.7,
    alunosLista: [
      "Alice Ferreira Braga",
      "Heloísa Barreto Luz",
      "Larissa Quintana",
      "Sofia Mendonça Leal",
    ],
  },
  {
    codigo: "IB-MEIRELES-A",
    nome: "EE Cecília Meireles",
    cidade: "Ibiúna",
    escola: "EE Cecília Meireles",
    supervisor: "Mariana Alves Prado",
    alunos: 13,
    desligados: 1,
    alunosAtivos: 12,
    vagas: 15,
    vagasDisponiveis: 3,
    taxaEvasao: 20.0,
    nivelAlerta: "verde",
    frequenciaMedia: 79.6,
    alunosLista: [
      "Beatriz Nogueira Sá",
      "Débora Antunes Vaz",
      "Gabriel Siqueira Dias",
      "Íris Salgado Moura",
      "Mariana Espíndola",
    ],
  },
  {
    codigo: "VO-JESUS-A",
    nome: "EE Carolina de Jesus",
    cidade: "Votorantim",
    escola: "EE Carolina de Jesus",
    supervisor: "Mariana Alves Prado",
    alunos: 12,
    desligados: 4,
    alunosAtivos: 8,
    vagas: 15,
    vagasDisponiveis: 7,
    taxaEvasao: 46.7,
    nivelAlerta: "vermelho",
    frequenciaMedia: 52.8,
    alunosLista: ["Caio Medeiros Rocha"],
  },
];

const ESCOLAS = [
  {
    nome: ESCOLA_HOMONIMA,
    cidade: "São Roque",
    alunos: 62,
    desligados: 8,
    alunosAtivos: 54,
    vagas: 60,
    vagasDisponiveis: 6,
    taxaEvasao: 10.0,
    nivelAlerta: "verde",
    supervisores: ["Ana Paula Ribeiro", "Carlos Eduardo Nunes"],
  },
  {
    nome: "EE Paulo Freire",
    cidade: "Sorocaba",
    alunos: 14,
    desligados: 5,
    alunosAtivos: 9,
    vagas: 20,
    vagasDisponiveis: 11,
    taxaEvasao: 55.0,
    nivelAlerta: "vermelho",
    supervisores: ["Carlos Eduardo Nunes"],
  },
  {
    nome: "EE Cecília Meireles",
    cidade: "Ibiúna",
    alunos: 13,
    desligados: 1,
    alunosAtivos: 12,
    vagas: 15,
    vagasDisponiveis: 3,
    taxaEvasao: 20.0,
    nivelAlerta: "verde",
    supervisores: ["Mariana Alves Prado"],
  },
  {
    nome: "EE Carolina de Jesus",
    cidade: "Votorantim",
    alunos: 12,
    desligados: 4,
    alunosAtivos: 8,
    vagas: 15,
    vagasDisponiveis: 7,
    taxaEvasao: 46.7,
    nivelAlerta: "vermelho",
    supervisores: ["Mariana Alves Prado"],
  },
];

const CIDADES = [
  {
    nome: "São Roque",
    alunos: 38,
    desligados: 7,
    alunosAtivos: 31,
    vagas: 40,
    vagasDisponiveis: 9,
    taxaEvasao: 22.5,
    nivelAlerta: "amarelo",
    supervisores: ["Ana Paula Ribeiro"],
  },
  {
    nome: "Sorocaba",
    alunos: 38,
    desligados: 6,
    alunosAtivos: 32,
    vagas: 40,
    vagasDisponiveis: 8,
    taxaEvasao: 20.0,
    nivelAlerta: "verde",
    supervisores: ["Carlos Eduardo Nunes"],
  },
  {
    nome: "Ibiúna",
    alunos: 13,
    desligados: 1,
    alunosAtivos: 12,
    vagas: 15,
    vagasDisponiveis: 3,
    taxaEvasao: 20.0,
    nivelAlerta: "verde",
    supervisores: ["Mariana Alves Prado"],
  },
  {
    nome: "Votorantim",
    alunos: 12,
    desligados: 4,
    alunosAtivos: 8,
    vagas: 15,
    vagasDisponiveis: 7,
    taxaEvasao: 46.7,
    nivelAlerta: "vermelho",
    supervisores: ["Mariana Alves Prado"],
  },
];

// Uma faixa de frequencia em cada cor (verde >= 80, amarelo >= 60, resto).
const SUPERVISORES = [
  {
    nome: "Ana Paula Ribeiro",
    alunos: 38,
    cidades: ["São Roque"],
    escolas: [ESCOLA_HOMONIMA],
    turmas: [`${ESCOLA_HOMONIMA} A`, `${ESCOLA_HOMONIMA} B`],
    frequenciaMedia: 81.3,
  },
  {
    nome: "Carlos Eduardo Nunes",
    alunos: 38,
    cidades: ["Sorocaba"],
    escolas: [ESCOLA_HOMONIMA, "EE Paulo Freire"],
    turmas: [`${ESCOLA_HOMONIMA} A`, "EE Paulo Freire"],
    frequenciaMedia: 68.9,
  },
  {
    nome: "Mariana Alves Prado",
    alunos: 25,
    cidades: ["Ibiúna", "Votorantim"],
    escolas: ["EE Carolina de Jesus", "EE Cecília Meireles"],
    turmas: ["EE Carolina de Jesus", "EE Cecília Meireles"],
    frequenciaMedia: 57.4,
  },
];

const CURSINHO = {
  total: 30,
  somenteIfsp: 12,
  somenteEtec: 9,
  ambos: 8,
  semTurma: 1,
  ifsp: 20,
  etec: 17,
  escolas: 4,

  porSerie: [
    { serie: "8º ano", alunos: 14 },
    { serie: "9º ano", alunos: 16 },
  ],

  // Os elegiveis batem com o Projeto de Vida: 19 no 8o ano + 25 no 9o.
  elegiveis: 44,
  potenciais: 22,

  anoDisponivel: true,
  anosElegiveis: [8, 9],

  cidades: [
    {
      nome: "São Roque",
      alunos: 11,
      somenteIfsp: 5,
      somenteEtec: 3,
      ambos: 3,
      semTurma: 0,
      ifsp: 8,
      etec: 6,
      elegiveis: 15,
      potenciais: 8,
    },
    {
      nome: "Sorocaba",
      alunos: 10,
      somenteIfsp: 4,
      somenteEtec: 3,
      ambos: 3,
      semTurma: 0,
      ifsp: 7,
      etec: 6,
      elegiveis: 16,
      potenciais: 8,
    },
    {
      nome: "Ibiúna",
      alunos: 6,
      somenteIfsp: 2,
      somenteEtec: 2,
      ambos: 2,
      semTurma: 0,
      ifsp: 4,
      etec: 4,
      elegiveis: 9,
      potenciais: 4,
    },
    {
      nome: "Votorantim",
      alunos: 3,
      somenteIfsp: 1,
      somenteEtec: 1,
      ambos: 0,
      semTurma: 1,
      ifsp: 1,
      etec: 1,
      elegiveis: 4,
      potenciais: 2,
    },
  ],

  diagnostico: { alunosSemSerie: 3 },
};

const RESUMO = {
  alunos: 101,
  ativos: 83,
  desligados: 18,
  percentualDesligados: 17.8,
  nivelAlerta: "verde",
  cidades: 4,
  escolas: 4,
  turmas: 6,
  supervisores: 3,
};

export function respostaDemo(
  modo: "completo" | "sem-serie" | "api-antiga" | "sem-oitavo",
  autenticadoComoAdmin: boolean
) {
  const base = {
    ultimaAtualizacao: new Date().toISOString(),

    resumo: RESUMO,

    cidades: CIDADES,
    escolas: ESCOLAS,

    // Sem sessao a API tira os nomes, e a tela de turma muda por causa disso.
    turmas: autenticadoComoAdmin
      ? TURMAS
      : TURMAS.map(({ alunosLista, ...turma }) => turma),

    supervisores: SUPERVISORES,

    cursinho: CURSINHO,

    // A Home nao mostra evasao desde o revert; null e o que a API responde
    // enquanto a aba API_Historico nao existir.
    historico: null,
    tendencia: null,
    comparativoQuinzenal: null,
  };

  if (modo === "api-antiga") {
    // Sem a chave: e assim que responde um Apps Script publicado antes desta
    // funcionalidade existir.
    return base;
  }

  return {
    ...base,

    // Sem sessao de admin a API corta a lista nominal - de cada serie e da
    // copia solta na raiz. Cortar so uma delas deixaria os nomes vazando pelo
    // outro caminho, que e o tipo de descuido que o modo demo tem que mostrar.
    projetoDeVida:
      modo === "sem-serie"
        ? null
        : {
            ...PROJETO_DE_VIDA,

            alunos: autenticadoComoAdmin
              ? PROJETO_DE_VIDA.alunos
              : null,

            // Sem `series` e como responde um Apps Script publicado antes
            // de o 8o ano entrar na tela. Acontece de verdade: o deploy do
            // site e o "implantar" da planilha sao dois botoes diferentes, e
            // a pagina tem que mostrar so o 9o ano em vez de quebrar.
            series:
              modo === "sem-oitavo"
                ? undefined
                : PROJETO_DE_VIDA.series.map((serie) => ({
                    ...serie,
                    alunos: autenticadoComoAdmin ? serie.alunos : null,
                  })),
          },
  };
}
