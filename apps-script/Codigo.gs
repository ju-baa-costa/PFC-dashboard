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

      dataEntrada: row[10]
    }));

  const cidades = agruparCidades(alunos);
  const escolas = agruparEscolas(alunos);
  const turmas = agruparTurmas(alunos);
  const supervisores = agruparSupervisores(alunos);

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
    supervisores
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