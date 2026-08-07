import { useState } from "react";
import Layout from "../components/Layout";
import SupervisorCard from "../components/SupervisorCard";
import FilterPanel, { TODAS_CIDADES } from "../components/FilterPanel";
import { useDashboard } from "../hooks/useDashboard";
import { ordenarPorFrequencia } from "../utils/ordenacaoFreq";
import {
  calcularAgregadoSupervisores,
  gerarRelatorioPDF,
  gerarRelatorioDetalhadoPDF,
  montarSecoesSupervisores,
} from "../utils/pdfReport";


export default function Supervisores() {
  const {
    data,
    loading,
    atualizar,
  } = useDashboard();

  const [cidadeSelecionada, setCidadeSelecionada] = useState(TODAS_CIDADES);

  if (loading) {
    return <h1>Carregando...</h1>;
  }

  function gerarCompleto() {
    gerarRelatorioDetalhadoPDF(
      "Relatório Completo - Supervisores",
      montarSecoesSupervisores(data.supervisores),
      "relatorio-completo-supervisores.pdf"
    );
  }

  function gerarResumido() {
    const agregado = calcularAgregadoSupervisores(data.supervisores);

    gerarRelatorioPDF(
      "Relatório Resumido - Supervisores",
      [
        { label: "Supervisores ativos", valor: agregado.total },
        { label: "Alunos atendidos", valor: agregado.totalAlunos },
      ],
      "relatorio-resumido-supervisores.pdf"
    );
  }

  const cidades: string[] = [...new Set<string>(data.cidades.map((c: any) => c.nome))].sort();

  const supervisoresFiltrados =
    cidadeSelecionada === TODAS_CIDADES
      ? data.supervisores
      : data.supervisores.filter((supervisor: any) =>
          supervisor.cidades?.includes(cidadeSelecionada)
        );

  return (
    <Layout
      onRefresh={atualizar}
      onRelatorioCompleto={gerarCompleto}
      onRelatorioResumido={gerarResumido}
    >
      <div className="toolbar">
        <FilterPanel
          cidades={cidades}
          cidadeSelecionada={cidadeSelecionada}
          onChange={setCidadeSelecionada}
        />
      </div>

      <div className="grid">
        {ordenarPorFrequencia(supervisoresFiltrados).map(
  (supervisor: any) => (
    <SupervisorCard
      key={supervisor.nome}
      {...supervisor}
    />
  )
)}
      </div>
    </Layout>
  );
}
