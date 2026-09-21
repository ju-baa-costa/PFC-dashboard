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
// ---------------------------------------------------------------------------
// AUTENTICACAO
//
// Sem servidor proprio, o "login" usa uma aba de usuarios (API_Usuarios) e
// um token assinado (HMAC) que carrega usuario/papel/turmas + validade. Nao
// ha sessao guardada no servidor: qualquer token com assinatura valida e
// ainda dentro do prazo e aceito.
//
// Aba API_Usuarios, colunas: nome | usuario | senhaHash | papel | turmas
// - papel: "admin" ou "professor"
// - turmas: codigos de turma separados por virgula (so usado no futuro,
//   pela funcionalidade de chamada; hoje qualquer login libera os nomes)
// - senhaHash: gerado rodando gerarHash("a senha") direto no editor do
//   Apps Script e colando o resultado na planilha - nao existe tela de
//   cadastro de usuario.
// ---------------------------------------------------------------------------

const ABA_USUARIOS = "API_Usuarios";
const VALIDADE_TOKEN_DIAS = 30;

function segredoToken() {
  const props = PropertiesService.getScriptProperties();
  let segredo = props.getProperty("TOKEN_SECRET");

  if (!segredo) {
    segredo = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty("TOKEN_SECRET", segredo);
  }

  return segredo;
}

function paraHex(bytes) {
  return bytes
    .map(b => (b + 256).toString(16).slice(-2))
    .join("");
}

// Rodar manualmente pelo editor do Apps Script (Executar > gerarHash, ou
// direto no console) para gerar o valor a colar em senhaHash.
function gerarHash(senha) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    senha + segredoToken()
  );

  return paraHex(bytes);
}

function base64UrlEncode(texto) {
  return Utilities.base64EncodeWebSafe(texto).replace(/=+$/, "");
}

function base64UrlDecode(texto) {
  return Utilities
    .newBlob(Utilities.base64DecodeWebSafe(texto))
    .getDataAsString();
}

function assinar(texto) {
  const bytes = Utilities.computeHmacSha256Signature(
    texto,
    segredoToken()
  );

  return paraHex(bytes);
}

function criarToken(usuario) {
  const payload = {
    usuario: usuario.usuario,
    nome: usuario.nome,
    papel: usuario.papel,
    turmas: usuario.turmas,
    exp: Date.now() + VALIDADE_TOKEN_DIAS * 24 * 60 * 60 * 1000
  };

  const payloadCodificado = base64UrlEncode(
    JSON.stringify(payload)
  );

  return payloadCodificado + "." + assinar(payloadCodificado);
}

function validarToken(token) {
  if (!token) return null;

  const partes = String(token).split(".");
  if (partes.length !== 2) return null;

  const payloadCodificado = partes[0];
  const assinatura = partes[1];

  if (assinar(payloadCodificado) !== assinatura) {
    return null;
  }

  let payload;

  try {
    payload = JSON.parse(base64UrlDecode(payloadCodificado));
  } catch (erro) {
    return null;
  }

  if (!payload.exp || Date.now() > payload.exp) {
    return null;
  }

  return payload;
}

function indiceColunasUsuarios(cabecalho) {
  return {
    nome: indiceColuna(cabecalho, ["nome"]),
    usuario: indiceColuna(cabecalho, ["usuario", "usuário", "login"]),
    senhaHash: indiceColuna(cabecalho, ["senhahash", "senha hash", "hash"]),
    papel: indiceColuna(cabecalho, ["papel", "role", "funcao", "função"]),
    turmas: indiceColuna(cabecalho, ["turmas", "turma"])
  };
}

function lerUsuarios() {
  const aba = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(ABA_USUARIOS);

  if (!aba) return [];

  const values = aba.getDataRange().getValues();
  if (values.length < 2) return [];

  const colunas = indiceColunasUsuarios(values[0]);

  return values
    .slice(1)
    .filter(row => normalizarTexto(row[colunas.usuario]) !== "")
    .map(row => ({
      nome: normalizarTexto(row[colunas.nome]),
      usuario: normalizarTexto(row[colunas.usuario]).toLowerCase(),
      senhaHash: normalizarTexto(row[colunas.senhaHash]),
      papel: normalizarTexto(row[colunas.papel]).toLowerCase(),
      turmas: normalizarTexto(row[colunas.turmas])
        .split(",")
        .map(t => t.trim())
        .filter(t => t !== "")
    }));
}

function autenticar(usuario, senha) {
  const chave = normalizarTexto(usuario).toLowerCase();
  const encontrado = lerUsuarios().find(u => u.usuario === chave);

  if (!encontrado) return null;
  if (gerarHash(senha) !== encontrado.senhaHash) return null;

  return encontrado;
}

function respostaJson(objeto) {
  return ContentService
    .createTextOutput(JSON.stringify(objeto))
    .setMimeType(ContentService.MimeType.JSON);
}

// O login teria que ser POST por natureza, mas o Apps Script nao devolve
// cabecalho CORS em respostas de doPost quando chamado via fetch() de outra
// origem (doGet devolve normalmente - e por isso o resto da API usa GET).
// Entao o login tambem vai por doGet, com usuario/senha na query string.
function respostaLogin(parametros) {
  const usuario = autenticar(
    parametros.usuario,
    parametros.senha
  );

  if (!usuario) {
    return respostaJson({ erro: "Usuario ou senha invalidos" });
  }

  return respostaJson({
    token: criarToken(usuario),
    nome: usuario.nome,
    papel: usuario.papel,
    turmas: usuario.turmas
  });
}

// Sem sessao valida, os nomes dos alunos nao saem na resposta publica.
function turmasParaResposta(turmas, autenticado) {
  if (autenticado) return turmas;

  return turmas.map(turma => {
    const copia = Object.assign({}, turma);
    delete copia.alunosLista;
    return copia;
  });
}

// Leitura de API_Alunos compartilhada pelo dashboard (doGet) e pelo relatorio
// por email. Ficava duplicada, e so o doGet foi corrigido quando a coluna
// Serie entrou na planilha - o relatorio continuou lendo por posicao fixa e
// passou a reportar todas as escolas como verdes. Com uma leitura so, uma
// mudanca de coluna nao consegue mais quebrar metade do sistema.
function lerAlunosApi() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("API_Alunos");

  if (!sheet) {
    throw new Error(
      'A aba "API_Alunos" não foi encontrada.'
    );
  }

  const values = sheet.getDataRange().getValues();

  const colunas = mapearColunasAlunos(
    values[0]
  );

  const alunos = values
    .slice(1)
    .filter(row => {
      const nome = normalizarTexto(
        row[colunas.nome]
      );

      return (
        nome !== "" &&
        nome !== "#N/A" &&
        nome !== "#ERROR!"
      );
    })
    .map(row => ({
      nome: normalizarTexto(row[colunas.nome]),
      cidade: normalizarTexto(row[colunas.cidade]),
      escola: normalizarTexto(row[colunas.escola]),
      turma: normalizarTexto(row[colunas.turma]),
      supervisor: normalizarTexto(row[colunas.supervisor]),
      situacao: normalizarTexto(row[colunas.situacao]).toLowerCase(),

      presencas: Number(row[colunas.presencas]) || 0,
      faltas: Number(row[colunas.faltas]) || 0,

      aulasTotais: Number(row[colunas.aulasTotais]) || 0,
      aulasPlanejadas: Number(row[colunas.aulasPlanejadas]) || 0,

      dataEntrada: row[colunas.dataEntrada],

      ano:
        colunas.serie === -1
          ? null
          : extrairAnoEscolar(
              row[colunas.serie]
            )
    }));

  return { alunos, colunas };
}


function doGet(e) {
  const parametros = (e && e.parameter) || {};

  if (parametros.action === "login") {
    return respostaLogin(parametros);
  }

  const sessao = validarToken(parametros.token);

  const { alunos, colunas } = lerAlunosApi();

  const cidades = agruparCidades(alunos);
  const escolas = agruparEscolas(alunos);
  const turmas = agruparTurmas(alunos);
  const supervisores = agruparSupervisores(alunos);

  const cursinho = montarCursinho(
    alunos,
    lerAlunosCursinho(),
    colunas.serie !== -1
  );

  // A lista nominal do 9o ano so sai para admin - ver o comentario do bloco
  // PROJETO DE VIDA. O papel vem assinado dentro do token, entao nao da para
  // o front pedir a lista dizendo que e admin.
  const projetoDeVida = montarProjetoDeVida(
    alunos,
    colunas.serie !== -1,
    !!sessao && sessao.papel === "admin"
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

  // null enquanto a aba API_Historico nao existir; a Home usa isso para
  // explicar que a coleta comecou agora, em vez de desenhar uma linha reta
  // no zero como se ninguem tivesse evadido.
  const historico = lerHistorico();

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
    turmas: turmasParaResposta(turmas, !!sessao),
    supervisores,

    cursinho,

    projetoDeVida,

    historico,

    tendencia: calcularTendencia(historico),

    comparativoQuinzenal:
      calcularComparativoQuinzenal(historico)
  };

  return respostaJson(response);
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

// Ate agora as colunas de API_Alunos eram lidas por posicao fixa, o que quebra
// tudo assim que alguem insere uma coluna no meio (foi o caso da serie, que
// entrou depois do supervisor e empurrou situacao, presencas, faltas...).
// Agora cada coluna e achada pelo cabecalho; a posicao antiga so entra como
// ultimo recurso, ja corrigida pelo deslocamento que a serie causa.
function mapearColunasAlunos(cabecalho) {
  const serie = indiceColuna(cabecalho, [
    "serie",
    "ano",
    "ano escolar",
    "ano/serie",
    "serie/ano"
  ]);

  function posicaoAntiga(indice) {
    return serie !== -1 &&
      serie <= indice
      ? indice + 1
      : indice;
  }

  function coluna(nomes, indiceAntigo) {
    const encontrada = indiceColuna(
      cabecalho,
      nomes
    );

    return encontrada === -1
      ? posicaoAntiga(indiceAntigo)
      : encontrada;
  }

  return {
    nome: coluna(
      ["nome", "aluno", "nome do aluno"],
      0
    ),

    cidade: coluna(
      ["cidade", "municipio"],
      1
    ),

    escola: coluna(
      ["escola", "unidade escolar"],
      2
    ),

    turma: coluna(
      ["turma", "codigo da turma", "cod turma"],
      3
    ),

    supervisor: coluna(
      ["supervisor", "supervisora"],
      4
    ),

    situacao: coluna(
      ["situacao", "status"],
      5
    ),

    presencas: coluna(
      ["presencas", "presenca"],
      6
    ),

    faltas: coluna(
      ["faltas", "falta"],
      7
    ),

    aulasTotais: coluna(
      ["aulas totais", "aulas dadas", "total de aulas"],
      8
    ),

    aulasPlanejadas: coluna(
      ["aulas planejadas", "aulas previstas"],
      9
    ),

    dataEntrada: coluna(
      ["data de entrada", "data entrada", "entrada"],
      10
    ),

    // Opcional: sem ela nao da para saber quem e do 8o/9o ano.
    serie: serie
  };
}

// O ano vem escrito de tudo quanto e jeito: "8", "8o", "8º ano", "9ª serie" e
// principalmente junto da turma ("6b", "8a"). Por isso procuramos o numero
// dentro do texto em vez de comparar o valor inteiro.
//
// O grupo so vale quando nao esta colado em outro digito, senao um "2024 - 8A"
// casaria com um pedaco do ano do calendario em vez da serie.
function extrairAnoEscolar(valor) {
  const match = normalizarTexto(
    valor
  ).match(/(?:^|\D)(\d{1,2})(?=\D|$)/);

  if (!match) return null;

  const ano = Number(match[1]);

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

        somenteIfsp: 0,
        somenteEtec: 0,
        ambos: 0,
        semTurma: 0,

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

  let somenteIfsp = 0;
  let somenteEtec = 0;
  let ambos = 0;
  let semTurma = 0;

  const escolas = {};
  const series = {};

  alunosCursinho.forEach(aluno => {
    const cidade = entradaCidade(
      aluno.cidade
    );

    cidade.alunos++;

    // Quem faz as duas turmas cai em "ambos" em vez de contar duas vezes,
    // assim somenteIfsp + somenteEtec + ambos + semTurma fecha com o total.
    if (aluno.ifsp && aluno.etec) {
      ambos++;
      cidade.ambos++;
    } else if (aluno.ifsp) {
      somenteIfsp++;
      cidade.somenteIfsp++;
    } else if (aluno.etec) {
      somenteEtec++;
      cidade.somenteEtec++;
    } else {
      semTurma++;
      cidade.semTurma++;
    }

    if (aluno.escola) {
      escolas[
        chaveComparacao(aluno.escola)
      ] = true;
    }

    // "8a" e "8b" sao a mesma serie: sem agrupar pelo ano a quebra viraria
    // uma linha por turma. So cai no texto cru quando nao da para ler o ano.
    const ano = extrairAnoEscolar(
      aluno.serie
    );

    const rotulo =
      ano !== null
        ? ano + "º ano"
        : aluno.serie || "Não informado";

    if (!series[rotulo]) {
      series[rotulo] = {
        serie: rotulo,
        ano: ano,
        alunos: 0
      };
    }

    series[rotulo].alunos++;
  });

  const porSerie = Object.keys(series)
    .map(rotulo => series[rotulo])
    .sort((a, b) => {
      // Quem nao tem ano legivel vai para o fim da lista.
      if (a.ano === null && b.ano === null) {
        return a.serie.localeCompare(
          b.serie,
          "pt-BR"
        );
      }

      if (a.ano === null) return 1;
      if (b.ano === null) return -1;

      return a.ano - b.ano;
    });

  const ranking = Object.keys(cidades)
    .map(chave => {
      const cidade = cidades[chave];

      cidade.ifsp =
        cidade.somenteIfsp +
        cidade.ambos;

      cidade.etec =
        cidade.somenteEtec +
        cidade.ambos;

      return cidade;
    })
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

    somenteIfsp,
    somenteEtec,
    ambos,
    semTurma,

    // Totais por turma, ja contando quem faz as duas.
    ifsp: somenteIfsp + ambos,
    etec: somenteEtec + ambos,

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

    cidades: ranking,

    diagnostico:
      montarDiagnosticoCursinho(
        alunos,
        temColunaAno
      )
  };
}

// ---------------------------------------------------------------------------
// TEMPORARIO - enquanto a coluna de serie nao estiver toda preenchida.
//
// Um aluno ativo sem serie nao entra nem nos elegiveis nem no "ainda podem
// entrar", e some da conta sem deixar rastro. Este bloco existe so para dar
// visibilidade a esse buraco.
//
// Para remover quando a planilha estiver completa: apague esta funcao, a
// chave `diagnostico` no retorno de montarCursinho, e o componente
// AvisoSemSerie do front. Nada mais depende disso.
// ---------------------------------------------------------------------------
function montarDiagnosticoCursinho(
  alunos,
  temColunaAno
) {
  // Sem a coluna nao ha o que diagnosticar: o front ja avisa pelo
  // anoDisponivel que o dado inteiro esta faltando.
  if (!temColunaAno) return null;

  let semSerie = 0;

  alunos.forEach(aluno => {
    if (aluno.situacao !== "ativo") {
      return;
    }

    if (aluno.ano === null) {
      semSerie++;
    }
  });

  return {
    alunosSemSerie: semSerie
  };
}

// ---------------------------------------------------------------------------
// PROJETO DE VIDA
//
// A pagina acompanha os anos finais do fundamental: quem esta no 8o e no 9o
// ano agora, com a lista de cada um. O 8o ano de hoje e a projecao do 9o do
// ano que vem - quem evadir ou repetir nao chega la -, e a tela diz isso.
//
// As duas series saem prontas na mesma resposta porque o front so alterna
// entre elas: buscar de novo a cada clique no card seria uma ida ao Apps
// Script para um dado que ja estava calculado aqui.
//
// A lista nominal so sai para sessao de admin. O resto da API entrega nomes
// para qualquer token (turmasParaResposta), mas aqui e uma lista unica com
// cidade e escola de cada aluno - um cadastro, nao um detalhe de turma -,
// entao vale o corte mais estreito.
//
// Como todo o resto que depende de serie, devolve null inteiro quando a coluna
// nao existe: zero aqui seria lido como "nenhum aluno no 9o ano".
// ---------------------------------------------------------------------------

const ANO_PROJETO_DE_VIDA = 9;

// Da mais nova para a mais velha nao: a tela mostra os cards nesta ordem, e
// 8o antes de 9o e como a escola fala.
const ANOS_PROJETO_DE_VIDA = [8, 9];

function ordenarPorNomePt(itens) {
  return itens.sort(
    (a, b) => String(a.nome).localeCompare(
      String(b.nome),
      "pt-BR"
    )
  );
}

// Uma serie so: os alunos ativos daquele ano, agrupados por cidade e por
// escola, mais a fatia que ela representa do programa.
//
// Esta funcao e o unico lugar que conta aluno por serie. Quando o 8o ano
// entrou na tela, a tentacao era somar os 8os anos num contador a parte e
// deixar o agrupamento so para o 9o - e ai o numero do card e o tamanho da
// lista viram duas contas diferentes, livres para divergir.
function resumirSerieProjetoDeVida(
  ativos,
  ano,
  totalAtivos,
  ehAdmin
) {
  const naSerie = ativos.filter(
    a => a.ano === ano
  );

  const cidades = {};
  const escolas = {};

  // Guarda a chave de cada aluno para, no fim, devolver a lista com o mesmo
  // nome de cidade e escola que foi para os chips.
  //
  // Antes a lista saia com a grafia crua da planilha. Como o agrupamento
  // compara por chaveComparacao, "SAO ROQUE" e "São Roque" viravam um chip so
  // com dois alunos - mas o filtro do front casa texto com texto, e clicar no
  // chip mostrava um aluno so. O chip dizia 2 e a tabela mostrava 1, sem erro
  // nenhum na tela.
  const listados = [];

  naSerie.forEach(aluno => {
    const nomeCidade =
      normalizarTexto(aluno.cidade) ||
      "Não informada";

    const nomeEscola =
      normalizarTexto(aluno.escola) ||
      "Não informada";

    const chaveCidade =
      chaveComparacao(nomeCidade);

    if (!cidades[chaveCidade]) {
      cidades[chaveCidade] = {
        nome: nomeCidade,
        alunos: 0
      };
    }

    cidades[chaveCidade].alunos++;

    // A escola entra chaveada junto com a cidade porque nome de escola se
    // repete entre municipios ("EE Monteiro Lobato" existe em mais de um).
    // Sem a cidade na chave, as duas virariam um card so e o filtro de uma
    // puxaria os alunos da outra.
    const chaveEscola =
      chaveCidade + "|" +
      chaveComparacao(nomeEscola);

    if (!escolas[chaveEscola]) {
      escolas[chaveEscola] = {
        nome: nomeEscola,
        cidade: nomeCidade,
        alunos: 0
      };
    }

    escolas[chaveEscola].alunos++;

    listados.push({
      nome: aluno.nome,
      chaveCidade,
      chaveEscola
    });
  });

  return {
    ano,

    noAno: naSerie.length,

    percentualDoPrograma:
      totalAtivos > 0
        ? Number(
            (
              naSerie.length * 100 /
              totalAtivos
            ).toFixed(1)
          )
        : null,

    cidades: ordenarPorNomePt(
      Object.keys(cidades).map(
        chave => cidades[chave]
      )
    ),

    escolas: ordenarPorNomePt(
      Object.keys(escolas).map(
        chave => escolas[chave]
      )
    ),

    // null distingue "voce nao pode ver a lista" de "nao ha ninguem nesta
    // serie" - a pagina precisa dos dois para escolher a mensagem certa.
    alunos: ehAdmin
      ? ordenarPorNomePt(
          listados.map(aluno => ({
            nome: aluno.nome,
            cidade:
              cidades[aluno.chaveCidade].nome,
            escola:
              escolas[aluno.chaveEscola].nome
          }))
        )
      : null
  };
}

function montarProjetoDeVida(
  alunos,
  temColunaAno,
  ehAdmin
) {
  if (!temColunaAno) {
    return null;
  }

  const ativos = alunos.filter(
    a => a.situacao === "ativo"
  );

  const totalAtivos = ativos.length;

  const series = ANOS_PROJETO_DE_VIDA.map(
    ano => resumirSerieProjetoDeVida(
      ativos,
      ano,
      totalAtivos,
      ehAdmin
    )
  );

  const serieNona = series.filter(
    s => s.ano === ANO_PROJETO_DE_VIDA
  )[0];

  const serieOitava = series.filter(
    s => s.ano === ANO_PROJETO_DE_VIDA - 1
  )[0];

  // Ativo sem serie nao entra em nenhuma das contas acima e some da tela.
  // Enquanto a coluna nao estiver toda preenchida, esse numero e o unico
  // aviso de que as series podem estar subcontadas.
  const semSerie = ativos.filter(
    a => a.ano === null
  ).length;

  return {
    // Os campos soltos abaixo sao os de antes do 8o ano entrar na tela, e
    // estao aqui porque a Home le `noAno` e porque um front ainda nao
    // atualizado continua funcionando contra esta versao da API. Sao copias
    // do que ja esta em `series`, nunca uma segunda conta: se virarem conta
    // propria, um dia o card e a lista discordam.
    ano: ANO_PROJETO_DE_VIDA,

    noAno: serieNona.noAno,
    proximoAno: serieOitava.noAno,

    totalAtivos,

    percentualDoPrograma:
      serieNona.percentualDoPrograma,

    alunosSemSerie: semSerie,

    cidades: serieNona.cidades,
    escolas: serieNona.escolas,
    alunos: serieNona.alunos,

    series
  };
}


// ---------------------------------------------------------------------------
// HISTORICO
//
// A API so sabe responder "como esta agora": o doGet monta tudo ao vivo e nada
// fica guardado. Para a Home poder mostrar a evolucao da evasao, alguem precisa
// anotar o numero de cada dia - e como a planilha nao registra quando o aluno
// saiu, nao da para reconstruir o passado depois. Por isso o snapshot ja entra
// no ar antes da tela existir: cada dia sem ele e um dia perdido para sempre.
//
// A Home vai mostrar a retencao sobre vagas (ativos / vagas), complemento da
// taxaEvasao que ja colore os cards de escola. Por isso os ativos aqui sao
// contados como "alunos - desligados", igual agruparEscolas faz, e nao pelo
// filtro situacao === "ativo" que o resumo do doGet usa: as duas contas
// divergem se existir qualquer situacao fora de ativo/desligado. Gravamos as
// duas assim mesmo, e a diferenca entre elas em outrasSituacoes, para que essa
// divergencia apareca na planilha em vez de virar erro silencioso no grafico.
// ---------------------------------------------------------------------------

const ABA_HISTORICO = "API_Historico";

const COLUNAS_HISTORICO = [
  "data",
  "alunos",
  "ativos",
  "ativosDeclarados",
  "desligados",
  "outrasSituacoes",
  "vagas",
  "retencao",
  "taxaEvasao",
  "escolasVermelhas",
  "escolasAmarelas",
  "escolasVerdes"
];

function dataSnapshot(quando) {
  return Utilities.formatDate(
    quando || new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd"
  );
}

// Garante a aba E o cabecalho. Escrever o cabecalho so ao criar a aba nao
// bastava: se ela ja existisse - criada na mao, ou por uma execucao que morreu
// entre o insertSheet e a escrita - os snapshots caiam na linha 1 sem nome
// nenhum, e a leitura seguinte tomava essa linha de dados por cabecalho.
function abaHistorico() {
  const planilha = SpreadsheetApp
    .getActiveSpreadsheet();

  let aba = planilha.getSheetByName(
    ABA_HISTORICO
  );

  if (!aba) {
    aba = planilha.insertSheet(
      ABA_HISTORICO
    );
  }

  const largura = Math.max(
    1,
    aba.getLastColumn()
  );

  const primeiraLinha = aba
    .getRange(1, 1, 1, largura)
    .getValues()[0];

  // Procura pelo nome, nao pela posicao: cabecalho reordenado na mao continua
  // valido, porque lerHistorico() tambem acha as colunas pelo nome.
  if (
    indiceColuna(primeiraLinha, ["data"]) !== -1
  ) {
    return aba;
  }

  // Ja ha dados sem cabecalho (o caso acima): empurra tudo para baixo em vez
  // de sobrescrever a leitura que ja tinha sido gravada.
  if (aba.getLastRow() > 0) {
    aba.insertRowBefore(1);
  }

  aba
    .getRange(1, 1, 1, COLUNAS_HISTORICO.length)
    .setValues([COLUNAS_HISTORICO])
    .setFontWeight("bold");

  aba.setFrozenRows(1);

  return aba;
}

// A data vai como texto "yyyy-MM-dd" de proposito: como data de verdade, o
// Sheets a reinterpreta conforme a locale de quem abre a planilha, e ai a
// comparacao que evita linha duplicada passa a depender de quem abriu.
function escreverLinhaHistorico(
  aba,
  indiceLinha,
  valores
) {
  const destino = aba.getRange(
    indiceLinha,
    1,
    1,
    valores.length
  );

  // O formato tem que vir antes do valor: aplicado depois, a data ja teria
  // sido convertida e o texto original estaria perdido.
  destino
    .getCell(1, 1)
    .setNumberFormat("@");

  destino.setValues([valores]);
}

function calcularSnapshot(alunos) {
  const escolas = agruparEscolas(alunos);

  let vagas = 0;
  let ativos = 0;

  const porAlerta = {
    verde: 0,
    amarelo: 0,
    vermelho: 0
  };

  escolas.forEach(escola => {
    vagas += escola.vagas;
    ativos += escola.alunosAtivos;

    porAlerta[escola.nivelAlerta]++;
  });

  const ativosDeclarados = alunos.filter(
    a => a.situacao === "ativo"
  ).length;

  const desligados = alunos.filter(
    a => a.situacao === "desligado"
  ).length;

  const taxaEvasao = calcularTaxaEvasao(
    vagas,
    ativos
  );

  return {
    data: dataSnapshot(),

    alunos: alunos.length,

    ativos,
    ativosDeclarados,
    desligados,

    outrasSituacoes:
      alunos.length -
      ativosDeclarados -
      desligados,

    vagas,

    // Complemento exato da taxaEvasao para os dois nunca brigarem no relatorio.
    // Herda o piso dela: turma acima da capacidade fica em 100%, nao em 110%.
    retencao: Number(
      (100 - taxaEvasao).toFixed(1)
    ),

    taxaEvasao,

    escolasVermelhas: porAlerta.vermelho,
    escolasAmarelas: porAlerta.amarelo,
    escolasVerdes: porAlerta.verde
  };
}

function registrarSnapshotHistorico() {
  const snapshot = calcularSnapshot(
    lerAlunosApi().alunos
  );

  const aba = abaHistorico();

  const linha = COLUNAS_HISTORICO.map(
    coluna => snapshot[coluna]
  );

  const ultimaLinha = aba.getLastRow();

  const datas =
    ultimaLinha < 2
      ? []
      : aba
          .getRange(2, 1, ultimaLinha - 1, 1)
          .getDisplayValues();

  // Rodar de novo no mesmo dia - na mao, ou depois de uma falha - tem que
  // corrigir a linha de hoje, nao criar uma segunda: dia repetido entorta a
  // regressao que calcula a tendencia.
  for (let i = 0; i < datas.length; i++) {
    if (datas[i][0] === snapshot.data) {
      escreverLinhaHistorico(
        aba,
        i + 2,
        linha
      );

      Logger.log(
        "Snapshot de " +
          snapshot.data +
          " atualizado."
      );

      return snapshot;
    }
  }

  escreverLinhaHistorico(
    aba,
    ultimaLinha + 1,
    linha
  );

  Logger.log(
    "Snapshot de " +
      snapshot.data +
      " registrado."
  );

  return snapshot;
}

// Instala o gatilho diario. Rodar uma vez, na mao, pelo editor do Apps Script.
// E idempotente: rodar de novo troca o gatilho em vez de criar um segundo.
function criarGatilhoHistorico() {
  ScriptApp
    .getProjectTriggers()
    .forEach(gatilho => {
      if (
        gatilho.getHandlerFunction() ===
        "registrarSnapshotHistorico"
      ) {
        ScriptApp.deleteTrigger(gatilho);
      }
    });

  ScriptApp
    .newTrigger("registrarSnapshotHistorico")
    .timeBased()
    .atHour(3)
    .everyDays(1)
    .create();

  Logger.log(
    "Gatilho diario do historico criado (por volta das 3h)."
  );
}


// Quantos dias de historico o doGet devolve. O payload ja carrega a lista
// inteira de alunos; meio ano de pontos e de sobra para a Home desenhar a
// linha sem dobrar o tamanho da resposta.
const LIMITE_HISTORICO = 180;

// Abaixo disso a "tendencia" seria so ruido do dia a dia virando manchete.
const MIN_PONTOS_TENDENCIA = 3;
const MIN_DIAS_TENDENCIA = 14;

// Variacao menor que isso em um mes nao e melhora nem piora, e oscilacao.
const LIMIAR_ESTAVEL_MENSAL = 0.3;

// A data e gravada como texto, mas nada impede alguem de reformatar a coluna
// na mao e o Sheets devolver um Date - entao aceitamos os dois.
function normalizarDataHistorico(valor) {
  if (valor instanceof Date) {
    return dataSnapshot(valor);
  }

  return String(valor || "").trim();
}

function diasDesdeEpoca(data) {
  const partes = String(data).split("-");

  return Math.round(
    Date.UTC(
      Number(partes[0]),
      Number(partes[1]) - 1,
      Number(partes[2])
    ) / 86400000
  );
}

// Devolve null quando a aba ainda nao existe, para o front distinguir "ainda
// nao ha historico" de "o historico e zero" - mesma convencao do cursinho.
function lerHistorico() {
  const aba = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(ABA_HISTORICO);

  if (!aba) return null;

  const ultimaLinha = aba.getLastRow();

  if (ultimaLinha < 2) return [];

  // getValues, e nao getDisplayValues: o display devolveria "57,8" numa
  // planilha em pt-BR e todo Number() viraria NaN.
  const valores = aba
    .getRange(
      1,
      1,
      ultimaLinha,
      aba.getLastColumn()
    )
    .getValues();

  const cabecalho = valores[0];

  const indices = {};

  COLUNAS_HISTORICO.forEach(nome => {
    indices[nome] = indiceColuna(
      cabecalho,
      [nome]
    );
  });

  if (indices.data === -1) return [];

  const pontos = valores
    .slice(1)
    .map(linha => {
      const ponto = {
        data: normalizarDataHistorico(
          linha[indices.data]
        )
      };

      COLUNAS_HISTORICO.forEach(nome => {
        if (nome === "data") return;

        ponto[nome] =
          indices[nome] === -1
            ? null
            : Number(
                linha[indices[nome]]
              ) || 0;
      });

      return ponto;
    })
    // Linha meio preenchida na mao nao pode entrar na regressao.
    .filter(ponto =>
      /^\d{4}-\d{2}-\d{2}$/.test(ponto.data)
    );

  pontos.sort((a, b) =>
    a.data < b.data
      ? -1
      : a.data > b.data
        ? 1
        : 0
  );

  return pontos.slice(
    -LIMITE_HISTORICO
  );
}

// A tendencia e calculada aqui, e nao no front, para o email e o dashboard
// nunca contarem historias diferentes - foi exatamente assim que o relatorio
// passou meses dizendo que nao havia escola em alerta.
//
// Regressao linear simples sobre (dias, retencao). De proposito nao existe
// previsao de data ("evasao zero em marco"): com poucos meses de dados a
// extrapolacao vira chute com cara de certeza.
function calcularTendencia(pontos) {
  if (!pontos || pontos.length === 0) {
    return null;
  }

  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];

  const diasCobertos =
    diasDesdeEpoca(ultimo.data) -
    diasDesdeEpoca(primeiro.data);

  const base = {
    pontos: pontos.length,
    diasCobertos,

    desde: primeiro.data,
    ate: ultimo.data,

    retencaoInicial: primeiro.retencao,
    retencaoAtual: ultimo.retencao,

    variacaoPontos: Number(
      (
        ultimo.retencao -
        primeiro.retencao
      ).toFixed(1)
    )
  };

  if (
    pontos.length < MIN_PONTOS_TENDENCIA ||
    diasCobertos < MIN_DIAS_TENDENCIA
  ) {
    return Object.assign({}, base, {
      suficiente: false,
      inclinacaoMensal: null,
      r2: null,
      direcao: null
    });
  }

  const x0 = diasDesdeEpoca(primeiro.data);

  let somaX = 0;
  let somaY = 0;
  let somaXY = 0;
  let somaXX = 0;

  pontos.forEach(ponto => {
    const x =
      diasDesdeEpoca(ponto.data) - x0;

    const y = ponto.retencao;

    somaX += x;
    somaY += y;
    somaXY += x * y;
    somaXX += x * x;
  });

  const n = pontos.length;

  const denominador =
    n * somaXX - somaX * somaX;

  if (denominador === 0) {
    return Object.assign({}, base, {
      suficiente: false,
      inclinacaoMensal: null,
      r2: null,
      direcao: null
    });
  }

  const inclinacaoDiaria =
    (n * somaXY - somaX * somaY) /
    denominador;

  const intercepto =
    (somaY - inclinacaoDiaria * somaX) / n;

  const mediaY = somaY / n;

  let somaResiduos = 0;
  let somaTotal = 0;

  pontos.forEach(ponto => {
    const x =
      diasDesdeEpoca(ponto.data) - x0;

    const previsto =
      intercepto + inclinacaoDiaria * x;

    somaResiduos += Math.pow(
      ponto.retencao - previsto,
      2
    );

    somaTotal += Math.pow(
      ponto.retencao - mediaY,
      2
    );
  });

  const inclinacaoMensal = Number(
    (inclinacaoDiaria * 30).toFixed(2)
  );

  return Object.assign({}, base, {
    suficiente: true,

    inclinacaoMensal,

    // Serie perfeitamente plana tem variacao total zero: r2 vira 1, nao 0/0.
    r2:
      somaTotal === 0
        ? 1
        : Number(
            (
              1 - somaResiduos / somaTotal
            ).toFixed(3)
          ),

    direcao:
      Math.abs(inclinacaoMensal) <
      LIMIAR_ESTAVEL_MENSAL
        ? "estavel"
        : inclinacaoMensal > 0
          ? "melhora"
          : "piora"
  });
}


// ---------------------------------------------------------------------------
// COMPARATIVO QUINZENAL
//
// A regressao acima responde "que direcao o programa esta tomando". Esta conta
// responde outra pergunta, mais direta: em relacao a quinzena passada, a
// evasao caiu quantos por cento?
//
// E variacao RELATIVA, nao pontos percentuais: evasao de 25% que vira 20% caiu
// 20% (5 de 25), e nao "5 p.p.". Os dois numeros descrevem a mesma mudanca, e
// confundi-los e o jeito mais facil de exagerar ou minimizar um resultado.
//
// Compara a media de cada janela, e nao o valor de um dia contra o de 15 dias
// atras: um unico dia ruim nos dois extremos inventaria uma melhora ou uma
// piora que nao existe.
// ---------------------------------------------------------------------------

const DIAS_QUINZENA = 15;

// Com snapshot diario cada janela tem 15 leituras. Exigir 3 tolera o gatilho
// ter falhado alguns dias sem deixar uma janela de 1 leitura virar "media".
const MIN_LEITURAS_QUINZENA = 3;

// Menos de 1% de variacao relativa entre quinzenas e oscilacao, nao noticia.
const LIMIAR_ESTAVEL_QUINZENAL = 1;

function mediaEvasao(valores) {
  const soma = valores.reduce(
    (total, valor) => total + valor,
    0
  );

  return Number(
    (soma / valores.length).toFixed(1)
  );
}

function calcularComparativoQuinzenal(pontos) {
  if (!pontos || pontos.length === 0) {
    return null;
  }

  const fim = diasDesdeEpoca(
    pontos[pontos.length - 1].data
  );

  const atual = [];
  const anterior = [];

  pontos.forEach(ponto => {
    const idade =
      fim - diasDesdeEpoca(ponto.data);

    if (idade < DIAS_QUINZENA) {
      atual.push(ponto.taxaEvasao);
    } else if (idade < DIAS_QUINZENA * 2) {
      anterior.push(ponto.taxaEvasao);
    }
  });

  const base = {
    diasPorJanela: DIAS_QUINZENA,
    leiturasAtual: atual.length,
    leiturasAnterior: anterior.length,
    semBase: false
  };

  const incompleto = Object.assign({}, base, {
    suficiente: false,
    evasaoAtual: atual.length
      ? mediaEvasao(atual)
      : null,
    evasaoAnterior: anterior.length
      ? mediaEvasao(anterior)
      : null,
    variacaoRelativa: null,
    direcao: null
  });

  if (
    atual.length < MIN_LEITURAS_QUINZENA ||
    anterior.length < MIN_LEITURAS_QUINZENA
  ) {
    return incompleto;
  }

  const evasaoAtual = mediaEvasao(atual);
  const evasaoAnterior = mediaEvasao(anterior);

  // Sem evasao na quinzena anterior nao existe "caiu x%": qualquer valor
  // dividido por zero. O programa estava cheio, e isso a tela diz com palavras.
  if (evasaoAnterior === 0) {
    return Object.assign({}, incompleto, {
      evasaoAtual,
      evasaoAnterior,
      semBase: true
    });
  }

  const variacaoRelativa = Number(
    (
      ((evasaoAnterior - evasaoAtual) /
        evasaoAnterior) *
      100
    ).toFixed(1)
  );

  return Object.assign({}, base, {
    suficiente: true,

    evasaoAtual,
    evasaoAnterior,

    // Positivo = a evasao caiu = mais alunos ficaram.
    variacaoRelativa,

    direcao:
      Math.abs(variacaoRelativa) <
      LIMIAR_ESTAVEL_QUINZENAL
        ? "estavel"
        : variacaoRelativa > 0
          ? "melhora"
          : "piora"
  });
}




// Os mesmos dois numeros que a Home mostra, escritos em frases. Recebe tudo ja
// calculado em vez de recalcular: e a unica forma de garantir que o email e o
// dashboard nunca discordem.
function montarBlocoEvolucaoEmail(historico, comparativo) {
  if (historico === null) {
    return `
      <p style="color:#616161;">
        A coleta de historico ainda nao foi ligada
        (rode <code>criarGatilhoHistorico</code> uma vez).
      </p>
    `;
  }

  if (!historico.length || !comparativo) {
    return `
      <p style="color:#616161;">
        Ainda nao ha leituras registradas.
      </p>
    `;
  }

  const ultimo = historico[historico.length - 1];

  const atual = `
    <p>
      Evasao global hoje:
      <strong>${ultimo.taxaEvasao}%</strong>
      das vagas abertas estao vazias
      (${ultimo.ativos} alunos ativos de
      ${ultimo.vagas} vagas, leitura de ${ultimo.data}).
    </p>
  `;

  if (comparativo.semBase) {
    return `
      ${atual}

      <p style="color:#616161;">
        Na quinzena anterior a evasao era 0%, entao nao
        ha base para calcular de quantos por cento ela
        variou.
      </p>
    `;
  }

  if (!comparativo.suficiente) {
    return `
      ${atual}

      <p style="color:#616161;">
        Ainda nao ha duas quinzenas completas para comparar
        (${comparativo.leiturasAtual} leitura(s) nesta
        quinzena e ${comparativo.leiturasAnterior} na
        anterior; sao precisas
        ${MIN_LEITURAS_QUINZENA} em cada).
      </p>
    `;
  }

  const frase =
    comparativo.direcao === "estavel"
      ? "praticamente igual a quinzena anterior"
      : comparativo.direcao === "melhora"
        ? `uma queda de ${comparativo.variacaoRelativa}% na evasao`
        : `um aumento de ${Math.abs(comparativo.variacaoRelativa)}% na evasao`;

  return `
    ${atual}

    <p>
      Comparado a quinzena anterior: <strong>${frase}</strong>
      (media de ${comparativo.evasaoAnterior}% nos 15 dias
      anteriores contra ${comparativo.evasaoAtual}% nos 15
      dias mais recentes).
    </p>
  `;
}

// ---------------------------------------------------------------------------
// DIAGNOSTICO DE VAGAS
//
// Rodar na mao quando a evasao parecer baixa demais. So imprime agregados por
// escola - nenhum nome de aluno - e responde as duas perguntas que decidem o
// denominador: quantas turmas foram reconhecidas, e de onde veio a capacidade.
// ---------------------------------------------------------------------------
function diagnosticarVagas() {
  const alunos = lerAlunosApi().alunos;

  const mapa = {};

  alunos.forEach(aluno => {
    const escola = aluno.escola || "Não informado";

    if (!mapa[escola]) {
      mapa[escola] = {
        codigos: {},
        turmas: {},
        alunos: 0,
        desligados: 0
      };
    }

    mapa[escola].alunos++;

    if (aluno.situacao === "desligado") {
      mapa[escola].desligados++;
    }

    mapa[escola].codigos[
      String(aluno.turma).trim() || "(vazio)"
    ] = true;

    mapa[escola].turmas[
      formatarNomeTurma(aluno.turma, aluno.escola)
    ] = true;
  });

  const linhas = [];

  let totalVagas = 0;
  let totalAtivos = 0;
  let semCapacidade = 0;

  Object.keys(mapa).sort().forEach(escola => {
    const dados = mapa[escola];

    const codigos = Object.keys(dados.codigos);
    const turmas = Object.keys(dados.turmas);

    const doMapa =
      CAPACIDADE_POR_ESCOLA[
        normalizarTexto(escola)
      ] !== undefined;

    if (!doMapa) semCapacidade++;

    const capacidade = getCapacidadeTurma(escola);

    const ativos = dados.alunos - dados.desligados;
    const vagas = turmas.length * capacidade;

    totalVagas += vagas;
    totalAtivos += ativos;

    linhas.push(
      [
        escola,
        "codigos=" + codigos.length + " [" + codigos.join(", ") + "]",
        "turmas contadas=" + turmas.length,
        "capacidade=" + capacidade + (doMapa ? " (do mapa)" : " (PADRAO 15)"),
        "alunos=" + dados.alunos,
        "ativos=" + ativos,
        "vagas=" + vagas,
        "evasao=" + calcularTaxaEvasao(vagas, ativos) + "%" +
          (ativos > vagas ? "  <-- MAIS ATIVOS QUE VAGAS" : "")
      ].join("\n    ")
    );
  });

  Logger.log(
    "=== DIAGNOSTICO DE VAGAS ===\n\n" +
      linhas.join("\n\n") +
      "\n\n=== TOTAIS ===" +
      "\nvagas=" + totalVagas +
      "\nativos=" + totalAtivos +
      "\nevasao global=" +
        calcularTaxaEvasao(totalVagas, totalAtivos) + "%" +
      "\nescolas sem capacidade cadastrada (usando 15)=" +
        semCapacidade + " de " + Object.keys(mapa).length
  );
}

// automação de envio do relatório para o email
function deveEnviarRelatorioHoje() {
  const hoje = new Date();

  const diaSemana = Number(
    Utilities.formatDate(
      hoje,
      Session.getScriptTimeZone(),
      "u"
    )
  );

  const diaMes = Number(
    Utilities.formatDate(
      hoje,
      Session.getScriptTimeZone(),
      "d"
    )
  );

  // Segunda-feira
  if (diaSemana !== 1) {
    return false;
  }

  // Primeira segunda-feira do mês
  if (diaMes >= 1 && diaMes <= 7) {
    return true;
  }

  // Terceira segunda-feira do mês
  if (diaMes >= 15 && diaMes <= 21) {
    return true;
  }

  return false;
}


function enviarRelatorioMensalAlertas() {

  // =====================================================
  // CONFIGURAÇÕES
  // =====================================================

  const EMAILS = [
    "jc1780489@gmail.com",
    "Fabioleite@ufscar.br",
    "laviniapereira.pfc@gmail.com"
  ];

  // TRUE = envia sempre que executar manualmente
  // FALSE = respeita a regra da 1ª e 3ª segunda-feira
  const MODO_TESTE = false;

  // Durante o teste, envia SOMENTE para este email
  const EMAIL_TESTE = "jc1780489@gmail.com";

  // Define os destinatários
  const DESTINATARIOS = MODO_TESTE
    ? EMAIL_TESTE
    : EMAILS.join(",");


  // =====================================================
  // VERIFICA SE É DIA DE ENVIO
  // =====================================================

  if (!MODO_TESTE && !deveEnviarRelatorioHoje()) {
    Logger.log(
      "Hoje não é a primeira nem a terceira segunda-feira do mês."
    );
    return;
  }


  // =====================================================
  // CARREGA OS DADOS DA PLANILHA
  //
  // Usa a mesma leitura do dashboard, que acha cada coluna pelo cabecalho.
  // Enquanto o relatorio lia por posicao fixa, a coluna Serie deslocava
  // "situacao": ninguem era contado como desligado, a taxa de evasao de
  // toda escola caia para perto de zero e o email saia dizendo que nao
  // havia escola em alerta vermelho nem amarelo.
  // =====================================================

  const alunos = lerAlunosApi().alunos;


  // =====================================================
  // AGRUPA AS ESCOLAS
  // =====================================================

  const escolas = agruparEscolas(alunos);


  // =====================================================
  // SEPARA E ORDENA OS ALERTAS
  // MAIOR TAXA DE EVASÃO → MENOR
  // =====================================================

  const vermelhas = escolas
    .filter(e => e.nivelAlerta === "vermelho")
    .sort(
      (a, b) => b.taxaEvasao - a.taxaEvasao
    );

  const amarelas = escolas
    .filter(e => e.nivelAlerta === "amarelo")
    .sort(
      (a, b) => b.taxaEvasao - a.taxaEvasao
    );


  // =====================================================
  // EVOLUÇÃO (mesma fonte que alimenta a Home)
  // =====================================================

  const historico = lerHistorico();

  const blocoEvolucao = montarBlocoEvolucaoEmail(
    historico,
    calcularComparativoQuinzenal(historico)
  );


  // =====================================================
  // DATA DO RELATÓRIO
  // =====================================================

  const dataAtual = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "dd/MM/yyyy HH:mm"
  );


  // =====================================================
  // HTML DO EMAIL
  // =====================================================

  const html = `

    <div style="
      font-family: Arial, sans-serif;
      max-width: 900px;
      margin: auto;
    ">

      <h1>PFC - Relatório de Alertas</h1>

      <p>
        Relatório gerado automaticamente em
        <strong>${dataAtual}</strong>.
      </p>


      <h2 style="color:#1565c0;">
        📈 Evolução da evasão
      </h2>

      ${blocoEvolucao}


      <h2 style="color:#d32f2f;">
        🔴 Escolas em Alerta Vermelho
        (${vermelhas.length})
      </h2>

      ${
        vermelhas.length === 0

          ? `
            <p>
              Nenhuma escola em alerta vermelho.
            </p>
          `

          : `

            <table
              border="1"
              cellpadding="6"
              cellspacing="0"
              style="
                border-collapse: collapse;
                width: 100%;
              "
            >

              <tr style="background:#ffebee;">

                <th>#</th>
                <th>Escola</th>
                <th>Cidade</th>
                <th>Taxa de Evasão</th>
                <th>Alunos Ativos</th>
                <th>Vagas</th>

              </tr>

              ${vermelhas.map((e, i) => `

                <tr>

                  <td>${i + 1}</td>

                  <td>
                    ${e.nome}
                  </td>

                  <td>
                    ${e.cidade}
                  </td>

                  <td>
                    <strong>
                      ${e.taxaEvasao}%
                    </strong>
                  </td>

                  <td>
                    ${e.alunosAtivos}
                  </td>

                  <td>
                    ${e.vagas}
                  </td>

                </tr>

              `).join("")}

            </table>

          `
      }


      <br><br>


      <h2 style="color:#f57c00;">
        🟡 Escolas em Alerta Amarelo
        (${amarelas.length})
      </h2>

      ${
        amarelas.length === 0

          ? `
            <p>
              Nenhuma escola em alerta amarelo.
            </p>
          `

          : `

            <table
              border="1"
              cellpadding="6"
              cellspacing="0"
              style="
                border-collapse: collapse;
                width: 100%;
              "
            >

              <tr style="background:#fff8e1;">

                <th>#</th>
                <th>Escola</th>
                <th>Cidade</th>
                <th>Taxa de Evasão</th>
                <th>Alunos Ativos</th>
                <th>Vagas</th>

              </tr>

              ${amarelas.map((e, i) => `

                <tr>

                  <td>${i + 1}</td>

                  <td>
                    ${e.nome}
                  </td>

                  <td>
                    ${e.cidade}
                  </td>

                  <td>
                    <strong>
                      ${e.taxaEvasao}%
                    </strong>
                  </td>

                  <td>
                    ${e.alunosAtivos}
                  </td>

                  <td>
                    ${e.vagas}
                  </td>

                </tr>

              `).join("")}

            </table>

          `
      }


      <br>

      <p style="
        color: gray;
        font-size: 12px;
      ">

        Este email foi enviado automaticamente
        pelo sistema PFC Dashboard.

      </p>

    </div>

  `;


  // =====================================================
  // ENVIA O EMAIL
  // =====================================================

  MailApp.sendEmail({
    to: DESTINATARIOS,
    subject: `PFC - Relatório de Alertas (${dataAtual})`,
    htmlBody: html
  });


  Logger.log(
    "Relatório enviado para: " + DESTINATARIOS
  );
}