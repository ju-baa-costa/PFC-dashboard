import { useState } from "react";

import Layout from "../components/Layout";
import LoginModal from "../components/LoginModal";
import SummaryCard from "../components/SummaryCard";

import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../hooks/useDashboard";

interface CidadeProjetoDeVida {
  nome: string;
  alunos: number;
}

interface EscolaProjetoDeVida {
  nome: string;
  cidade: string;
  alunos: number;
}

interface AlunoProjetoDeVida {
  nome: string;
  cidade: string;
  escola: string;
}

interface SerieProjetoDeVida {
  ano: number;
  noAno: number;
  percentualDoPrograma: number | null;
  cidades: CidadeProjetoDeVida[];
  escolas: EscolaProjetoDeVida[];
  alunos: AlunoProjetoDeVida[] | null;
}

interface DadosProjetoDeVida {
  ano: number;
  noAno: number;
  proximoAno: number;
  totalAtivos: number;
  percentualDoPrograma: number | null;
  alunosSemSerie: number;
  cidades: CidadeProjetoDeVida[];
  escolas: EscolaProjetoDeVida[];
  alunos: AlunoProjetoDeVida[] | null;

  // Ausente nas versoes da API anteriores ao 8o ano entrar na tela - ver
  // seriesDaResposta.
  series?: SerieProjetoDeVida[];
}

const SEM_DADO = "—";

const TODAS = "todos";

// Qual card ja vem escolhido ao abrir a pagina. O 9o ano e o motivo de a tela
// existir; o 8o entrou depois, para planejar o ano seguinte.
const ANO_PADRAO = 9;

// Nome de escola se repete entre municipios, entao a selecao guarda cidade e
// nome juntos: filtrar so pelo nome faria a "EE Lobato" de uma cidade trazer
// junto os alunos da homonima da outra.
function chaveEscola(cidade: string, nome: string) {
  return `${cidade}|${nome}`;
}

// O Apps Script publicado pode ser mais velho que este front - o deploy do
// site e o "implantar" da planilha sao dois botoes diferentes, apertados em
// momentos diferentes. Sem `series`, a resposta antiga ainda traz o 9o ano
// solto na raiz: a pagina mostra um card so em vez de quebrar.
function seriesDaResposta(pdv: DadosProjetoDeVida): SerieProjetoDeVida[] {
  if (pdv.series && pdv.series.length > 0) {
    return pdv.series;
  }

  return [
    {
      ano: pdv.ano,
      noAno: pdv.noAno,
      percentualDoPrograma: pdv.percentualDoPrograma,
      cidades: pdv.cidades,
      escolas: pdv.escolas,
      alunos: pdv.alunos,
    },
  ];
}

export default function ProjetoDeVida() {
  const { token, nome, papel } = useAuth();
  const { data, loading, atualizar } = useDashboard();

  const [modalAberto, setModalAberto] = useState(false);
  const [anoSelecionado, setAnoSelecionado] = useState(ANO_PADRAO);
  const [cidadeSelecionada, setCidadeSelecionada] = useState(TODAS);
  const [escolaSelecionada, setEscolaSelecionada] = useState(TODAS);

  if (!token) {
    return (
      <Layout>
        <div className="section-card">
          <p className="section-card-legenda">
            Faça login para acessar o Projeto de Vida.
          </p>

          <button className="login-btn" onClick={() => setModalAberto(true)}>
            Login
          </button>
        </div>

        {modalAberto && <LoginModal onClose={() => setModalAberto(false)} />}
      </Layout>
    );
  }

  // O papel vem assinado dentro do token e a lista nominal e cortada no
  // backend, entao esta tela e so a mensagem - nao a tranca.
  if (papel !== "admin") {
    return (
      <Layout onRefresh={atualizar}>
        <div className="section-card">
          <h3>Projeto de Vida</h3>

          <p className="section-card-legenda">
            A lista de alunos está disponível apenas para contas de
            administrador. Você entrou como {nome}.
          </p>
        </div>
      </Layout>
    );
  }

  if (loading) return <h1>Carregando...</h1>;

  // Os dois casos sem dado sao diferentes e a mensagem errada mandaria a
  // pessoa mexer na planilha quando o que falta e publicar o Apps Script:
  // undefined = a API no ar ainda nao tem esta secao; null = ela tem, mas a
  // planilha esta sem a coluna de serie.
  const pdv: DadosProjetoDeVida | null | undefined = data?.projetoDeVida;

  if (!pdv) {
    return (
      <Layout onRefresh={atualizar}>
        <div className="section-card">
          <h3>Projeto de Vida</h3>

          <p className="section-card-legenda">
            {pdv === null
              ? "Sem a coluna de série na planilha não é possível saber quem está em cada ano."
              : "A versão publicada da API ainda não responde o Projeto de Vida."}
          </p>
        </div>
      </Layout>
    );
  }

  const series = seriesDaResposta(pdv);

  // O ano escolhido pode nao existir na resposta: a API antiga so traz o 9o, e
  // o estado sobrevive a um refresh que mude a lista de series. Cair no padrao
  // (e, na falta dele, na ultima serie) evita uma tela vazia sem explicacao.
  const serie =
    series.find((item) => item.ano === anoSelecionado) ??
    series.find((item) => item.ano === ANO_PADRAO) ??
    series[series.length - 1];

  const alunos = serie.alunos ?? [];

  const escolasVisiveis =
    cidadeSelecionada === TODAS
      ? serie.escolas
      : serie.escolas.filter((escola) => escola.cidade === cidadeSelecionada);

  // Sem a cidade no rotulo, duas escolas homonimas viram dois chips iguais na
  // tela e nao da para saber qual e qual.
  const nomesRepetidos = new Set(
    serie.escolas
      .map((escola) => escola.nome)
      .filter(
        (nome, indice, todos) => todos.indexOf(nome) !== indice
      )
  );

  const alunosVisiveis = alunos.filter((aluno) => {
    if (cidadeSelecionada !== TODAS && aluno.cidade !== cidadeSelecionada) {
      return false;
    }

    return (
      escolaSelecionada === TODAS ||
      chaveEscola(aluno.cidade, aluno.escola) === escolaSelecionada
    );
  });

  // Trocar de serie sem limpar os filtros deixaria selecionada uma escola que
  // talvez nem tenha aluno no outro ano, e a lista sairia vazia sem explicacao
  // na tela - o mesmo motivo de selecionarCidade limpar a escola.
  function selecionarAno(ano: number) {
    setAnoSelecionado(ano);
    setCidadeSelecionada(TODAS);
    setEscolaSelecionada(TODAS);
  }

  // Trocar de cidade sem limpar a escola deixaria selecionada uma escola de
  // outro município, e a lista sairia vazia sem explicação na tela.
  function selecionarCidade(cidade: string) {
    setCidadeSelecionada((atual) => (atual === cidade ? TODAS : cidade));
    setEscolaSelecionada(TODAS);
  }

  function selecionarEscola(escola: string) {
    setEscolaSelecionada((atual) => (atual === escola ? TODAS : escola));
  }

  return (
    <Layout onRefresh={atualizar}>
      <div
        className={
          series.length > 1
            ? "grid pdv-resumo-grid"
            : "grid pdv-resumo-grid pdv-resumo-grid-2"
        }
      >
        {series.map((item) => (
          <SummaryCard
            key={item.ano}
            title={`No ${item.ano}º ano`}
            value={item.noAno}
            selecionado={item.ano === serie.ano}
            onClick={() => selecionarAno(item.ano)}
          />
        ))}

        <SummaryCard
          title="Fatia do programa"
          value={
            serie.percentualDoPrograma !== null
              ? `${serie.percentualDoPrograma}%`
              : SEM_DADO
          }
          hint={`${serie.noAno} de ${pdv.totalAtivos} alunos ativos`}
        />
      </div>

      {pdv.alunosSemSerie > 0 && (
        <p className="section-card-legenda pdv-aviso">
          {pdv.alunosSemSerie}{" "}
          {pdv.alunosSemSerie === 1
            ? "aluno ativo está sem série"
            : "alunos ativos estão sem série"}{" "}
          na planilha e ficam de fora destas contas.
        </p>
      )}

      <div className="section-card">
        <div className="pdv-filtros">
          <div className="pdv-filtro">
            <span className="toolbar-label">Cidade:</span>

            <div className="chip-group">
              <button
                type="button"
                className={`chip ${cidadeSelecionada === TODAS ? "active" : ""}`}
                onClick={() => selecionarCidade(TODAS)}
              >
                Todas
              </button>

              {serie.cidades.map((cidade) => (
                <button
                  type="button"
                  key={cidade.nome}
                  className={`chip ${
                    cidadeSelecionada === cidade.nome ? "active" : ""
                  }`}
                  onClick={() => selecionarCidade(cidade.nome)}
                >
                  {cidade.nome}
                  <span className="chip-contagem">{cidade.alunos}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pdv-filtro">
            <span className="toolbar-label">Escola:</span>

            <div className="chip-group">
              <button
                type="button"
                className={`chip ${escolaSelecionada === TODAS ? "active" : ""}`}
                onClick={() => selecionarEscola(TODAS)}
              >
                Todas
              </button>

              {escolasVisiveis.map((escola) => {
                const chave = chaveEscola(escola.cidade, escola.nome);

                return (
                  <button
                    type="button"
                    key={chave}
                    className={`chip ${
                      escolaSelecionada === chave ? "active" : ""
                    }`}
                    onClick={() => selecionarEscola(chave)}
                  >
                    {nomesRepetidos.has(escola.nome)
                      ? `${escola.nome} · ${escola.cidade}`
                      : escola.nome}
                    <span className="chip-contagem">{escola.alunos}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="section-card">
        <h3>Alunos no {serie.ano}º ano</h3>

        <p className="section-card-legenda">
          {alunosVisiveis.length === alunos.length
            ? `${alunos.length} ${alunos.length === 1 ? "aluno" : "alunos"} em ordem alfabética.`
            : `${alunosVisiveis.length} de ${alunos.length} alunos com os filtros aplicados.`}
        </p>

        {alunosVisiveis.length === 0 ? (
          <p>Nenhum aluno para exibir.</p>
        ) : (
          <table className="pdv-tabela">
            <thead>
              <tr>
                <th>Aluno</th>
                <th>Cidade</th>
                <th>Escola</th>
              </tr>
            </thead>

            <tbody>
              {alunosVisiveis.map((aluno) => (
                <tr key={`${aluno.nome}-${aluno.cidade}-${aluno.escola}`}>
                  <td>{aluno.nome}</td>
                  <td>{aluno.cidade}</td>
                  <td>{aluno.escola}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
