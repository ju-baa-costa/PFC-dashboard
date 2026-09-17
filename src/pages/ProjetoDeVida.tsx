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
}

const SEM_DADO = "—";

const TODAS = "todos";

// new Date().getFullYear() usa o fuso do navegador; entre a meia-noite de
// 31/12 no Brasil e a virada em UTC ele responde o ano errado, e o card diria
// "9º ano em 2027" no dia 1º de janeiro de 2027.
function anoLetivoAtual() {
  return Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
    }).format(new Date())
  );
}

// Nome de escola se repete entre municipios, entao a selecao guarda cidade e
// nome juntos: filtrar so pelo nome faria a "EE Lobato" de uma cidade trazer
// junto os alunos da homonima da outra.
function chaveEscola(cidade: string, nome: string) {
  return `${cidade}|${nome}`;
}

export default function ProjetoDeVida() {
  const { token, nome, papel } = useAuth();
  const { data, loading, atualizar } = useDashboard();

  const [modalAberto, setModalAberto] = useState(false);
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
            A lista do 9º ano está disponível apenas para contas de
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
              ? "Sem a coluna de série na planilha não é possível saber quem está no 9º ano."
              : "A versão publicada da API ainda não responde o Projeto de Vida."}
          </p>
        </div>
      </Layout>
    );
  }

  const alunos = pdv.alunos ?? [];

  const escolasVisiveis =
    cidadeSelecionada === TODAS
      ? pdv.escolas
      : pdv.escolas.filter((escola) => escola.cidade === cidadeSelecionada);

  // Sem a cidade no rotulo, duas escolas homonimas viram dois chips iguais na
  // tela e nao da para saber qual e qual.
  const nomesRepetidos = new Set(
    pdv.escolas
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
      <div className="grid pdv-resumo-grid">
        <SummaryCard
          title={`No ${pdv.ano}º ano`}
          value={pdv.noAno}
          hint="Alunos ativos hoje"
        />

        <SummaryCard
          title={`No ${pdv.ano}º ano em ${anoLetivoAtual() + 1}`}
          value={pdv.proximoAno}
          hint={`Projeção: os ${pdv.ano - 1}º anos ativos de hoje`}
        />

        <SummaryCard
          title="Fatia do programa"
          value={
            pdv.percentualDoPrograma !== null
              ? `${pdv.percentualDoPrograma}%`
              : SEM_DADO
          }
          hint={`${pdv.noAno} de ${pdv.totalAtivos} alunos ativos`}
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

              {pdv.cidades.map((cidade) => (
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
        <h3>Alunos no {pdv.ano}º ano</h3>

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
