import Layout from "../components/Layout";
import EntityCard from "../components/EntityCard";
import { ordenarPorAlerta } from "../utils/ordenacaoAlerta";

import { useDashboard } from "../hooks/useDashboard";
import {
  calcularAgregadoEntidades,
  gerarRelatorioPDF,
  gerarRelatorioDetalhadoPDF,
  montarSecoesEntidades,
} from "../utils/pdfReport";

export default function Cidades() {
  const {
    data,
    loading,
    atualizar,
  } = useDashboard();

  if (loading)
    return <h1>Carregando...</h1>;

  function gerarCompleto() {
    gerarRelatorioDetalhadoPDF(
      "Relatório Completo - Cidades",
      montarSecoesEntidades(data.cidades),
      "relatorio-completo-cidades.pdf"
    );
  }

  function gerarResumido() {
    const agregado = calcularAgregadoEntidades(data.cidades);

    gerarRelatorioPDF(
      "Relatório Resumido - Cidades",
      [
        { label: "Cidades ativas", valor: agregado.total },
        { label: "Alunos ativos", valor: agregado.totalAlunosAtivos },
      ],
      "relatorio-resumido-cidades.pdf"
    );
  }

  return (
    <Layout
      onRefresh={atualizar}
      onRelatorioCompleto={gerarCompleto}
      onRelatorioResumido={gerarResumido}
    >
      <div className="grid">
        {ordenarPorAlerta(data.cidades).map(
          (cidade:any) => (
            <EntityCard
              key={cidade.nome}
              {...cidade}
            />
          )
        )}
      </div>
    </Layout>
  );
}