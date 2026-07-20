import Layout from "../components/Layout";
import EntityCard from "../components/EntityCard";
import { useDashboard } from "../hooks/useDashboard";
import { ordenarPorAlerta } from "../utils/ordenacaoAlerta";
import {
  calcularAgregadoEntidades,
  gerarRelatorioPDF,
  gerarRelatorioDetalhadoPDF,
  montarSecoesEntidades,
} from "../utils/pdfReport";

export default function Turmas() {
  const { data, loading, atualizar } = useDashboard();

  if (loading) {
    return <h1>Carregando...</h1>;
  }

  function gerarCompleto() {
    gerarRelatorioDetalhadoPDF(
      "Relatório Completo - Turmas",
      montarSecoesEntidades(data.turmas),
      "relatorio-completo-turmas.pdf"
    );
  }

  function gerarResumido() {
    const agregado = calcularAgregadoEntidades(data.turmas);

    gerarRelatorioPDF(
      "Relatório Resumido - Turmas",
      [
        { label: "Turmas ativas", valor: agregado.total },
        { label: "Alunos ativos", valor: agregado.totalAlunosAtivos },
      ],
      "relatorio-resumido-turmas.pdf"
    );
  }

  return (
    <Layout
      onRefresh={atualizar}
      onRelatorioCompleto={gerarCompleto}
      onRelatorioResumido={gerarResumido}
    >
      <div className="grid">
        {ordenarPorAlerta(data.turmas).map((turma: any) => (
          <EntityCard key={turma.nome} {...turma} />
        ))}
      </div>
    </Layout>
  );
}
