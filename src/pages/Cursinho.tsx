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
  somenteIfsp: number;
  somenteEtec: number;
  ambos: number;
  semTurma: number;
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
  somenteIfsp: number;
  somenteEtec: number;
  ambos: number;
  semTurma: number;
  ifsp: number;
  etec: number;
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

// As partes sao exclusivas entre si, entao a soma delas bate com o total de
// alunos. "Sem turma" so aparece quando existe, para nao virar ruido.
function descreverTurmas(item: {
  somenteIfsp: number;
  somenteEtec: number;
  ambos: number;
  semTurma: number;
}) {
  const partes = [
    `Só IFSP: ${item.somenteIfsp}`,
    `Só ETEC: ${item.somenteEtec}`,
    `Ambos: ${item.ambos}`,
  ];

  if (item.semTurma > 0) {
    partes.push(`Sem turma: ${item.semTurma}`);
  }

  return partes.join(" · ");
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
            { label: "Só IFSP", valor: cursinho.somenteIfsp },
            { label: "Só ETEC", valor: cursinho.somenteEtec },
            { label: "IFSP e ETEC", valor: cursinho.ambos },
            { label: "Sem turma informada", valor: cursinho.semTurma },
            { label: "Total na turma IFSP", valor: cursinho.ifsp },
            { label: "Total na turma ETEC", valor: cursinho.etec },
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
            { label: "Só IFSP", valor: cidade.somenteIfsp },
            { label: "Só ETEC", valor: cidade.somenteEtec },
            { label: "IFSP e ETEC", valor: cidade.ambos },
            { label: "Sem turma informada", valor: cidade.semTurma },
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
            cursinho ? descreverTurmas(cursinho) : undefined
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
                  {descreverTurmas(cidade)}
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
