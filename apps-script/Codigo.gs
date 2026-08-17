const CAPACIDADE_ESCOLA = { //capacidade de alunos nas turmas de determinada escola
  "E.M. Franciso Mariano": 20,
  "E.M. Ricardo Pucetti":20,
  "E.M. Marcilio Leite":15,
  "E.M. Joaquim Salvador":20,
  "E.M. Francisco Munhoz Sanches":20,
  "EMEFEI Profa. Maria de Lourdes Pedroso Perin": 20,
  "E.E. Coronel Castanho de Almeida":20,
  "EMEF Prof° João Alcindo Vieira":20,
  "Henory de Campos Goes":10,
  "Elisa Moreira dos Santos Dona":20,
  "Pedrina de Campos Pedrozo Rosa Profa":20,
  "Zilma Thibes Melo":20,
  "EM. Dra. Gláucia Aparecida Andrade Nogueira":20,
  "Roque Ayres de Oliveiras":20,
  "Francisco Adolfo de Varnhagen":20,
  "E.M. Profª Lydia Cortez de Aquino":20,
  "E.M. João Veiga Martins":20,
  "E.M. Profª Terezinha de Lordes Jaze": 20,
  "E.M. Kame Miadaira": 20,
  "E.M. Prof Maria do Carmo":20,
  "EMEFEI Prof. Wilson Paschoal":20,
  "EMEFEI Prof. Darcy Amâncio":20,
  "EMEF Rubens Foot Guimarães":20,
  "CEMUS 5":20,
  "E.M Prof.ª Maria Constança de Miranda Campos":20,
  "EMEIF Prof. Joaquim Silveira Santos":20,
  "EMEIF Professor Antonio Cavaglieri":20,
  "Escola Municipal Iracema Villaça":20,
  "EMEF Sonia Maria Abreu Ghilardi":20,
  "EMEF Barão de Piratininga":20,
  "EMEIF Prof. Leônidas Antônio de Moraes":20,
  "EMEF Dr. Rabindranath Tagore dos S. Pires":20,
  "EMEF Professora Maria José Ferraz Schoenacker":20,
  "EMEF Professor Tibério Justo da Silva":20,
  "EMEF Tetsu Chinone":20
};
// Os nomes vindos da planilha passam por normalizarTexto, entao as chaves
// daqui precisam passar pelo mesmo tratamento: sem isso, um espaco ou um
// ponto final sobrando no cadastro acima faz a escola cair no default de 15
// vagas e contamina vagas, taxaEvasao, nivelAlerta e vagasDisponiveis.
const CAPACIDADE_POR_ESCOLA = Object.keys(
  CAPACIDADE_ESCOLA
).reduce(function (mapa, chave) {
  mapa[normalizarTexto(chave)] =
    CAPACIDADE_ESCOLA[chave];

  return mapa;
}, {});

function getCapacidadeTurma(escola) {
  return (
    CAPACIDADE_POR_ESCOLA[
      normalizarTexto(escola)
    ] || 15
  );
}
function calcularTaxaEvasao(
  vagas,
  ativos
) {
  if (vagas <= 0) return 0;

  return Number(
    Math.max(
      0,
      ((vagas - ativos) /
        vagas) *
        100
    ).toFixed(1)
  );
}
function doGet() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("API_Alunos");

  const values = sheet.getDataRange().getValues();

  // O ano escolar e uma coluna nova e opcional: em vez de fixar a posicao,
  // procuramos pelo cabecalho para nao quebrar caso ela seja inserida no meio
  // da planilha. Sem ela, o bloco do cursinho nao consegue calcular elegiveis.
  const colunaAno = indiceColuna(values[0], [
    "ano",
    "serie",
    "ano escolar",
    "ano/serie",
    "serie/ano"
  ]);

  const alunos = values
    .slice(1)
    .filter(row => {
      const nome = normalizarTexto(row[0]);

      return (
        nome !== "" &&
        nome !== "#N/A" &&
        nome !== "#ERROR!"
      );
    })
    .map(row => ({
      nome: normalizarTexto(row[0]),
      cidade: normalizarTexto(row[1]),
      escola: normalizarTexto(row[2]),
      turma: normalizarTexto(row[3]),
      supervisor: normalizarTexto(row[4]),
      situacao: normalizarTexto(row[5]).toLowerCase(),

      presencas: Number(row[6]) || 0,
      faltas: Number(row[7]) || 0,

      aulasTotais: Number(row[8]) || 0,
      aulasPlanejadas: Number(row[9]) || 0,

      dataEntrada: row[10],

      ano:
        colunaAno === -1
          ? null
          : extrairAnoEscolar(row[colunaAno])
    }));

  const cidades = agruparCidades(alunos);
  const escolas = agruparEscolas(alunos);
  const turmas = agruparTurmas(alunos);
  const supervisores = agruparSupervisores(alunos);

  const cursinho = montarCursinho(
    alunos,
    lerAlunosCursinho(),
    colunaAno !== -1
  );

  const ativos = alunos.filter(
    a => a.situacao === "ativo"
  ).length;

  const desligados = alunos.filter(
    a => a.situacao === "desligado"
  ).length;

  const alertaGeral =
    calcularAlerta(
      alunos.length,
      desligados
    );

  const response = {
    ultimaAtualizacao:
      new Date().toISOString(),

    resumo: {
      alunos: alunos.length,
      ativos,
      desligados,

      percentualDesligados:
        alertaGeral.percentual,

      nivelAlerta:
        alertaGeral.nivelAlerta,

      cidades: cidades.length,
      escolas: escolas.length,
      turmas: turmas.length,
      supervisores:
        supervisores.length
    },

    cidades,
    escolas,
    turmas,
    supervisores,

    cursinho
  };

  return ContentService
    .createTextOutput(
      JSON.stringify(response)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}

function normalizarTexto(valor) {
  return String(valor || "")
    .trim()
    .replace(/\.+$/, "")
    .trim();
}

// Chave usada so para comparar textos entre as duas abas: os cadastros nem
// sempre batem em caixa e acentuacao ("São Roque" x "SAO ROQUE"), e sem isso
// a mesma cidade ou o mesmo aluno apareceria duas vezes.
function chaveComparacao(valor) {
  return normalizarTexto(valor)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function indiceColuna(
  cabecalho,
  nomesAceitos
) {
  const chaves = nomesAceitos.map(
    chaveComparacao
  );

  for (
    let i = 0;
    i < cabecalho.length;
    i++
  ) {
    if (
      chaves.indexOf(
        chaveComparacao(cabecalho[i])
      ) !== -1
    ) {
      return i;
    }
  }

  return -1;
}

// Aceita "8", "8o", "8º ano", "9ª serie" etc. e devolve so o numero do ano.
function extrairAnoEscolar(valor) {
  const match = normalizarTexto(
    valor
  ).match(/\d{1,2}/);

  if (!match) return null;

  const ano = Number(match[0]);

  return ano >= 1 && ano <= 12
    ? ano
    : null;
}

function formatarNomeTurma(
  codigoTurma,
  escola
) {
  const codigo = String(
    codigoTurma
  ).trim();

  const match =
    codigo.match(/-(A|B)$/i);

  if (match) {
    return `${escola} ${match[1].toUpperCase()}`;
  }

  return escola;
}

function calcularFrequencia(
  presencas,
  faltas
) {
  presencas =
    Number(presencas) || 0;

  faltas =
    Number(faltas) || 0;

  const total =
    presencas + faltas;

  if (total === 0) return 0;

  return Number(
    (
      (presencas / total) *
      100
    ).toFixed(1)
  );
}
function calcularNivelEvasao(
  taxaEvasao
) {
  if (taxaEvasao > 40)
    return "vermelho";

  if (taxaEvasao > 20)
    return "amarelo";

  return "verde";
}
function calcularAlerta(
  alunos,
  desligados
) {
  const percentual =
    alunos === 0
      ? 0
      : Number(
          (
            (desligados / alunos) *
            100
          ).toFixed(1)
        );

  let nivelAlerta = "verde";

  if (percentual > 40) {
    nivelAlerta = "vermelho";
  } else if (percentual > 20) {
    nivelAlerta = "amarelo";
  }

  return {
    percentual,
    nivelAlerta
  };
}

function agruparCidades(
  alunos
) {
  const mapa = {};

  alunos.forEach(aluno => {
    const chave =
      aluno.cidade ||
      "Não informado";

    if (!mapa[chave]) {
      mapa[chave] = {
        nome: chave,

        alunos: 0,
        desligados: 0,

        escolas: new Set(),
        turmas: new Set(),
        supervisores:
          new Set(),

        frequenciaTotal: 0
      };
    }

    mapa[chave].alunos++;

    if (
      aluno.situacao ===
      "desligado"
    ) {
      mapa[chave]
        .desligados++;
    }

    mapa[chave].escolas.add(
      aluno.escola
    );

    mapa[chave].turmas.add(
  formatarNomeTurma(
    aluno.turma,
    aluno.escola
  )
);

    mapa[chave].supervisores.add(
      aluno.supervisor
    );

    mapa[
      chave
    ].frequenciaTotal +=
      calcularFrequencia(
        aluno.presencas,
        aluno.faltas
      );
  });

  return Object.values(mapa)
  .map(cidade => {

    const alunosAtivos =
      cidade.alunos -
      cidade.desligados;

    let vagas = 0;

    cidade.escolas.forEach(
      escola => {

        const qtdTurmas =
          [...cidade.turmas]
            .filter(t =>
              t.startsWith(
                escola
              )
            ).length;

        vagas +=
          qtdTurmas *
          getCapacidadeTurma(
            escola
          );
      }
    );

    const taxaEvasao =
      calcularTaxaEvasao(
        vagas,
        alunosAtivos
      );
    const nivelAlerta =
  calcularNivelEvasao(
    taxaEvasao
  );

    return {
      nome: cidade.nome,

      alunos:
        cidade.alunos,

      desligados:
        cidade.desligados,

      alunosAtivos,

      vagas,

      vagasDisponiveis:
        vagas - alunosAtivos,

      taxaEvasao,
      nivelAlerta,

      escolas: [
        ...cidade.escolas
      ].sort(),

      turmas: [
        ...cidade.turmas
      ].sort(),

      supervisores: [
        ...cidade
          .supervisores
      ].sort(),

      frequenciaMedia:
        Number(
          (
            cidade.frequenciaTotal /
            cidade.alunos
          ).toFixed(1)
        )
    };
  })
  .sort(
    (a, b) =>
      b.alunos -
      a.alunos
  );
}

function agruparEscolas(
  alunos
) {
  const mapa = {};

  alunos.forEach(aluno => {
    const chave =
      aluno.escola ||
      "Não informado";

    if (!mapa[chave]) {
      mapa[chave] = {
        nome: chave,

        cidade:
          aluno.cidade,

        alunos: 0,
        desligados: 0,

        turmas: new Set(),

        supervisores:
          new Set(),

        frequenciaTotal: 0
      };
    }

    mapa[chave].alunos++;

    if (
      aluno.situacao ===
      "desligado"
    ) {
      mapa[chave]
        .desligados++;
    }

    mapa[chave].turmas.add(
  formatarNomeTurma(
    aluno.turma,
    aluno.escola
  )
);

    mapa[chave].supervisores.add(
      aluno.supervisor
    );

    mapa[
      chave
    ].frequenciaTotal +=
      calcularFrequencia(
        aluno.presencas,
        aluno.faltas
      );
  });

  return Object.values(mapa)
  .map(escola => {

    const alunosAtivos =
      escola.alunos -
      escola.desligados;

    const vagas =
      escola.turmas.size *
      getCapacidadeTurma(
        escola.nome
      );

    const taxaEvasao =
      calcularTaxaEvasao(
        vagas,
        alunosAtivos
      );
    const nivelAlerta =
  calcularNivelEvasao(
    taxaEvasao
  );

    return {
      nome: escola.nome,

      cidade:
        escola.cidade,

      alunos:
        escola.alunos,

      desligados:
        escola.desligados,

      alunosAtivos,

      vagas,

      vagasDisponiveis:
        vagas - alunosAtivos,

      taxaEvasao,
      nivelAlerta,

      turmas: [
        ...escola.turmas
      ].sort(),

      supervisores: [
        ...escola
          .supervisores
      ].sort(),

      frequenciaMedia:
        Number(
          (
            escola.frequenciaTotal /
            escola.alunos
          ).toFixed(1)
        )
    };
  })
  .sort(
    (a, b) =>
      b.alunos -
      a.alunos
  );
}

function agruparTurmas(
  alunos
) {
  const mapa = {};

  alunos.forEach(aluno => {
    const chave =
      aluno.turma ||
      "Não informado";

    if (!mapa[chave]) {

      const nomeExibicao =
  formatarNomeTurma(
    chave,
    aluno.escola
  );

      mapa[chave] = {
  codigo: chave,

  nome: nomeExibicao,

  cidade: aluno.cidade,

  escola: aluno.escola,

  supervisor:
    aluno.supervisor,

  alunos: 0,
  desligados: 0,

  vagas:
    getCapacidadeTurma(
      aluno.escola
    ),

  alunosLista: [],

  frequenciaTotal: 0
};
    }

    mapa[chave].alunos++;

    if (
      aluno.situacao ===
      "desligado"
    ) {
      mapa[chave]
        .desligados++;
    }

    mapa[
      chave
    ].alunosLista.push(
      aluno.nome
    );

    mapa[
      chave
    ].frequenciaTotal +=
      calcularFrequencia(
        aluno.presencas,
        aluno.faltas
      );
  });

  return Object.values(mapa)
  .map(turma => {
    const alunosAtivos =
      turma.alunos -
      turma.desligados;

    const taxaEvasao =
      calcularTaxaEvasao(
        turma.vagas,
        alunosAtivos
      );
      const nivelAlerta =
  calcularNivelEvasao(
    taxaEvasao
  );

    return {
      codigo: turma.codigo,

      nome: turma.nome,

      cidade: turma.cidade,

      escola: turma.escola,

      supervisor:
        turma.supervisor,

      alunos:
        turma.alunos,

      desligados:
        turma.desligados,

      alunosAtivos,

      vagas:
        turma.vagas,

      vagasDisponiveis:
        turma.vagas - alunosAtivos,

      taxaEvasao,
      nivelAlerta,

      alunosLista:
        turma.alunosLista.sort(),

      frequenciaMedia:
        Number(
          (
            turma.frequenciaTotal /
            turma.alunos
          ).toFixed(1)
        )
    };
  })
  .sort(
    (a, b) =>
      b.alunos -
      a.alunos
  );
}

function agruparSupervisores(
  alunos
) {
  const mapa = {};

  alunos.forEach(aluno => {
    const chave =
      aluno.supervisor ||
      "Não informado";

    if (!mapa[chave]) {
      mapa[chave] = {
        nome: chave,

        alunos: 0,

        cidades: new Set(),

        escolas: new Set(),

        turmas: new Set(),

        frequenciaTotal: 0
      };
    }

    mapa[chave].alunos++;

    mapa[chave].cidades.add(
      aluno.cidade
    );

    mapa[chave].escolas.add(
      aluno.escola
    );

    mapa[chave].turmas.add(
  formatarNomeTurma(
    aluno.turma,
    aluno.escola
  )
);

    mapa[
      chave
    ].frequenciaTotal +=
      calcularFrequencia(
        aluno.presencas,
        aluno.faltas
      );
  });

  return Object.values(
    mapa
  )
    .map(
      supervisor => ({
        nome:
          supervisor.nome,

        alunos:
          supervisor.alunos,

        cidades: [
          ...supervisor
            .cidades
        ].sort(),

        escolas: [
          ...supervisor
            .escolas
        ].sort(),

        turmas: [
          ...supervisor
            .turmas
        ].sort(),

        frequenciaMedia:
          Number(
            (
              supervisor.frequenciaTotal /
              supervisor.alunos
            ).toFixed(1)
          )
      })
    )
    .sort(
      (a, b) =>
        b.alunos -
        a.alunos
    );
}

const ABA_CURSINHO = "API_Cursinho";

const ANOS_ELEGIVEIS_CURSINHO = [
  8,
  9
];

const SITUACOES_FORA_DO_CURSINHO = [
  "desligado",
  "desligada",
  "desistente",
  "inativo",
  "inativa",
  "cancelado",
  "cancelada"
];

// As colunas de turma podem chegar como checkbox (booleano de verdade) ou
// como texto digitado na mao, entao as duas formas contam como marcado.
const MARCACOES_VERDADEIRAS = [
  "true",
  "verdadeiro",
  "sim",
  "s",
  "x",
  "1",
  "ok"
];

function lerMarcacao(valor) {
  if (typeof valor === "boolean") {
    return valor;
  }

  return (
    MARCACOES_VERDADEIRAS.indexOf(
      normalizarTexto(
        valor
      ).toLowerCase()
    ) !== -1
  );
}

// A lista do cursinho vive numa aba propria (importada da outra planilha).
// Se a aba ainda nao existir devolvemos null para o front saber que o dado
// nao esta disponivel, em vez de mostrar zero como se fosse um numero real.
function lerAlunosCursinho() {
  const aba = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(ABA_CURSINHO);

  if (!aba) return null;

  const values = aba
    .getDataRange()
    .getValues();

  if (values.length < 2) return [];

  const cabecalho = values[0];

  const colunaNome = indiceColuna(
    cabecalho,
    ["nome", "aluno", "nome do aluno"]
  );

  const colunaCidade = indiceColuna(
    cabecalho,
    ["cidade", "municipio"]
  );

  const colunaSituacao = indiceColuna(
    cabecalho,
    ["situacao", "status"]
  );

  const colunaEscola = indiceColuna(
    cabecalho,
    ["escola", "unidade escolar"]
  );

  const colunaSerie = indiceColuna(
    cabecalho,
    ["serie", "ano", "ano escolar"]
  );

  const colunaIfsp = indiceColuna(
    cabecalho,
    ["turma ifsp", "ifsp"]
  );

  const colunaEtec = indiceColuna(
    cabecalho,
    ["turma etec", "etec"]
  );

  if (colunaNome === -1) return [];

  return values
    .slice(1)
    .map(row => ({
      nome: normalizarTexto(
        row[colunaNome]
      ),

      cidade:
        colunaCidade === -1
          ? ""
          : normalizarTexto(
              row[colunaCidade]
            ),

      escola:
        colunaEscola === -1
          ? ""
          : normalizarTexto(
              row[colunaEscola]
            ),

      serie:
        colunaSerie === -1
          ? ""
          : normalizarTexto(
              row[colunaSerie]
            ),

      ifsp:
        colunaIfsp !== -1 &&
        lerMarcacao(row[colunaIfsp]),

      etec:
        colunaEtec !== -1 &&
        lerMarcacao(row[colunaEtec]),

      situacao:
        colunaSituacao === -1
          ? ""
          : normalizarTexto(
              row[colunaSituacao]
            ).toLowerCase()
    }))
    .filter(aluno => {
      if (
        aluno.nome === "" ||
        aluno.nome === "#N/A" ||
        aluno.nome === "#ERROR!"
      ) {
        return false;
      }

      // Sem coluna de situacao a aba inteira conta como matriculada.
      return (
        SITUACOES_FORA_DO_CURSINHO.indexOf(
          aluno.situacao
        ) === -1
      );
    });
}

function montarCursinho(
  alunos,
  alunosCursinho,
  temColunaAno
) {
  if (alunosCursinho === null) {
    return null;
  }

  const noCursinho = {};

  alunosCursinho.forEach(aluno => {
    noCursinho[
      chaveComparacao(aluno.nome)
    ] = true;
  });

  // A aba do cursinho costuma escrever a cidade de outro jeito ("Sao Roque"
  // x "SÃO ROQUE"), entao a grafia exibida sai sempre do cadastro do programa.
  const nomeCidade = {};

  alunos.forEach(aluno => {
    const chave = chaveComparacao(
      aluno.cidade
    );

    if (chave && !nomeCidade[chave]) {
      nomeCidade[chave] =
        normalizarTexto(aluno.cidade);
    }
  });

  const cidades = {};

  function entradaCidade(nome) {
    const chave =
      chaveComparacao(nome) ||
      "NAO INFORMADO";

    if (!cidades[chave]) {
      cidades[chave] = {
        nome:
          nomeCidade[chave] ||
          normalizarTexto(nome) ||
          "Não informado",

        alunos: 0,
        ifsp: 0,
        etec: 0,

        elegiveis: 0,
        potenciais: 0
      };
    }

    return cidades[chave];
  }

  let elegiveis = 0;
  let potenciais = 0;

  // Os alunos do programa entram primeiro para o ranking usar o nome da
  // cidade como ele ja aparece no resto do dashboard.
  alunos.forEach(aluno => {
    if (aluno.situacao !== "ativo") {
      return;
    }

    if (
      ANOS_ELEGIVEIS_CURSINHO.indexOf(
        aluno.ano
      ) === -1
    ) {
      return;
    }

    const cidade = entradaCidade(
      aluno.cidade
    );

    cidade.elegiveis++;
    elegiveis++;

    if (
      !noCursinho[
        chaveComparacao(aluno.nome)
      ]
    ) {
      cidade.potenciais++;
      potenciais++;
    }
  });

  let ifsp = 0;
  let etec = 0;
  let semTurma = 0;

  const escolas = {};
  const series = {};

  alunosCursinho.forEach(aluno => {
    const cidade = entradaCidade(
      aluno.cidade
    );

    cidade.alunos++;

    // As duas turmas nao sao exclusivas: quem faz IFSP e ETEC conta nas duas,
    // por isso ifsp + etec pode passar do total.
    if (aluno.ifsp) {
      ifsp++;
      cidade.ifsp++;
    }

    if (aluno.etec) {
      etec++;
      cidade.etec++;
    }

    if (!aluno.ifsp && !aluno.etec) {
      semTurma++;
    }

    if (aluno.escola) {
      escolas[
        chaveComparacao(aluno.escola)
      ] = true;
    }

    const serie =
      aluno.serie || "Não informado";

    series[serie] =
      (series[serie] || 0) + 1;
  });

  const porSerie = Object.keys(series)
    .map(serie => ({
      serie,
      alunos: series[serie]
    }))
    .sort(
      (a, b) =>
        b.alunos - a.alunos ||
        a.serie.localeCompare(
          b.serie,
          "pt-BR"
        )
    );

  const ranking = Object.keys(cidades)
    .map(chave => cidades[chave])
    .sort(
      (a, b) =>
        b.alunos - a.alunos ||
        a.nome.localeCompare(
          b.nome,
          "pt-BR"
        )
    );

  return {
    total: alunosCursinho.length,

    ifsp,
    etec,
    semTurma,

    escolas:
      Object.keys(escolas).length,

    porSerie,

    elegiveis,
    potenciais,

    // Sem a coluna de ano na aba API_Alunos nao da para saber quem e do
    // 8o/9o ano, entao elegiveis e potenciais ficam zerados de proposito.
    anoDisponivel: temColunaAno,

    anosElegiveis:
      ANOS_ELEGIVEIS_CURSINHO,

    cidades: ranking
  };
}