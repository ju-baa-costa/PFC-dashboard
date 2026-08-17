import Layout from "../components/Layout";
import SummaryCard from "../components/SummaryCard";

import { useDashboard } from "../hooks/useDashboard";
import {
  gerarRelatorioPDF,
  gerarRelatorioDetalhadoPDF,
} from "../utils/pdfReport";

interface CidadeCursinho {
  nome: string;
  alunos: number;
  ifsp: number;
  etec: number;
  elegiveis: number;
  potenciais: number;
}

interface SerieCursinho {
  serie: string;
  alunos: number;
}

interface DadosCursinho {
  total: number;
  ifsp: number;
  etec: number;
  semTurma: number;
  escolas: number;
  porSerie: SerieCursinho[];
  elegiveis: number;
  potenciais: number;
  anoDisponivel: boolean;
  anosElegiveis: number[];
  cidades: CidadeCursinho[];
}

const SEM_DADO = "—";

function formatarAnos(anos: number[]) {
  return anos.map((ano) => `${ano}º ano`).join(" e ");
}

export default function Cursinho() {
  const { data, loading, atualizar } = useDashboard();

  if (loading) return <h1>Carregando...</h1>;

  const cursinho: DadosCursinho | null = data.cursinho ?? null;

  const ranking = cursinho?.cidades ?? [];

  // Sem a coluna de ano escolar na planilha nao da para saber quem e elegivel,
  // entao mostramos travessao em vez de zero para nao passar por numero real.
  const anoDisponivel = cursinho?.anoDisponivel ?? false;

  const anosElegiveis = formatarAnos(
    cursinho?.anosElegiveis ?? [8, 9]
  );

  function gerarCompleto() {
    if (!cursinho) return;

    gerarRelatorioDetalhadoPDF(
      "Relatório Completo - Cursinho",
      [
        {
          titulo: "Resumo",
          itens: [
            { label: "Alunos no cursinho", valor: cursinho.total },
            { label: "Turma IFSP", valor: cursinho.ifsp },
            { label: "Turma ETEC", valor: cursinho.etec },
            { label: "Sem turma informada", valor: cursinho.semTurma },
            { label: "Escolas atendidas", valor: cursinho.escolas },
            {
              label: `Alunos do programa (${anosElegiveis})`,
              valor: anoDisponivel ? cursinho.elegiveis : "N/A",
            },
            {
              label: "Ainda podem entrar",
              valor: anoDisponivel ? cursinho.potenciais : "N/A",
            },
            { label: "Cidades no ranking", valor: ranking.length },
          ],
        },
        {
          titulo: "Alunos por série",
          itens: cursinho.porSerie.map((item) => ({
            label: item.serie,
            valor: item.alunos,
          })),
        },
        ...ranking.map((cidade, indice) => ({
          titulo: `${indice + 1}. ${cidade.nome}`,
          itens: [
            { label: "Alunos no cursinho", valor: cidade.alunos },
            { label: "Turma IFSP", valor: cidade.ifsp },
            { label: "Turma ETEC", valor: cidade.etec },
            {
              label: `Alunos do programa (${anosElegiveis})`,
              valor: anoDisponivel ? cidade.elegiveis : "N/A",
            },
            {
              label: "Ainda podem entrar",
              valor: anoDisponivel ? cidade.potenciais : "N/A",
            },
          ],
        })),
      ],
      "relatorio-completo-cursinho.pdf"
    );
  }

  function gerarResumido() {
    if (!cursinho) return;

    gerarRelatorioPDF(
      "Relatório Resumido - Cursinho",
      [
        { label: "Alunos no cursinho", valor: cursinho.total },
        {
          label: "Ainda podem entrar",
          valor: anoDisponivel ? cursinho.potenciais : "N/A",
        },
        { label: "Cidades atendidas", valor: ranking.length },
      ],
      "relatorio-resumido-cursinho.pdf"
    );
  }

  return (
    <Layout
      onRefresh={atualizar}
      onRelatorioCompleto={cursinho ? gerarCompleto : undefined}
      onRelatorioResumido={cursinho ? gerarResumido : undefined}
    >
      {!cursinho && (
        <div className="section-card aviso-dados">
          Os dados do cursinho ainda não estão disponíveis na planilha.
        </div>
      )}

      <div className="grid">
        <SummaryCard
          title="Alunos no cursinho"
          value={cursinho ? cursinho.total : SEM_DADO}
          hint={
            cursinho
              ? `IFSP: ${cursinho.ifsp} · ETEC: ${cursinho.etec}`
              : undefined
          }
        />

        <SummaryCard
          title="Ainda podem entrar"
          value={
            cursinho && anoDisponivel ? cursinho.potenciais : SEM_DADO
          }
          hint={
            cursinho && anoDisponivel
              ? `${cursinho.elegiveis} alunos do programa no ${anosElegiveis}`
              : `Depende da coluna de ano escolar (${anosElegiveis})`
          }
        />
      </div>

      <div className="section-card">
        <h3>Ranking de cidades</h3>

        <p className="section-card-legenda">
          Da cidade com mais alunos no cursinho para a com menos.
        </p>

        {ranking.length === 0 ? (
          <p>Nenhuma cidade para exibir.</p>
        ) : (
          <ol className="ranking-list">
            {ranking.map((cidade, indice) => (
              <li className="ranking-row" key={cidade.nome}>
                <span className="ranking-posicao">{indice + 1}</span>

                <span className="ranking-nome">{cidade.nome}</span>

                <span className="ranking-detalhe">
                  IFSP: {cidade.ifsp} · ETEC: {cidade.etec}
                </span>

                {anoDisponivel && (
                  <span className="ranking-detalhe">
                    {cidade.potenciais} ainda podem entrar
                  </span>
                )}

                <span className="ranking-valor">
                  {cidade.alunos}{" "}
                  {cidade.alunos === 1 ? "aluno" : "alunos"}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Layout>
  );
}
