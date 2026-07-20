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

export default function Escolas() {
  const {
    data,
    loading,
    atualizar,
  } = useDashboard();

  if (loading) {
    return <h1>Carregando...</h1>;
  }

  function gerarCompleto() {
    gerarRelatorioDetalhadoPDF(
      "Relatório Completo - Escolas",
      montarSecoesEntidades(data.escolas),
      "relatorio-completo-escolas.pdf"
    );
  }

  function gerarResumido() {
    const agregado = calcularAgregadoEntidades(data.escolas);

    gerarRelatorioPDF(
      "Relatório Resumido - Escolas",
      [
        { label: "Escolas ativas", valor: agregado.total },
        { label: "Alunos ativos", valor: agregado.totalAlunosAtivos },
      ],
      "relatorio-resumido-escolas.pdf"
    );
  }

  return (
    <Layout
      onRefresh={atualizar}
      onRelatorioCompleto={gerarCompleto}
      onRelatorioResumido={gerarResumido}
    >
      <div className="grid">
        {ordenarPorAlerta(data.escolas).map((escola:any) => (
          <EntityCard
            key={escola.nome}
            {...escola}
          />
        ))}
      </div>
    </Layout>
  );
}