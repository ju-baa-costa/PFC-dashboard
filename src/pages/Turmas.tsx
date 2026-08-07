import { useState } from "react";
import Layout from "../components/Layout";
import EntityCard from "../components/EntityCard";
import FilterPanel, { TODAS_CIDADES } from "../components/FilterPanel";
import OrdenacaoSelector from "../components/OrdenacaoSelector";
import { useDashboard } from "../hooks/useDashboard";
import { ordenarPorAlerta } from "../utils/ordenacaoAlerta";
import { ordenarPorTaxaEvasao } from "../utils/ordenacaoTaxaEvasao";
import {
  calcularAgregadoEntidades,
  gerarRelatorioPDF,
  gerarRelatorioDetalhadoPDF,
  montarSecoesEntidades,
} from "../utils/pdfReport";

const OPCOES_ORDENACAO = [
  { value: "alerta", label: "Nível de alerta" },
  { value: "evasao", label: "Taxa de evasão (maior-menor)" },
];

export default function Turmas() {
  const { data, loading, atualizar } = useDashboard();

  const [cidadeSelecionada, setCidadeSelecionada] = useState(TODAS_CIDADES);
  const [ordenacao, setOrdenacao] = useState("alerta");

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

  const cidades: string[] = [...new Set<string>(data.cidades.map((c: any) => c.nome))].sort();

  const turmasFiltradas =
    cidadeSelecionada === TODAS_CIDADES
      ? data.turmas
      : data.turmas.filter((turma: any) => turma.cidade === cidadeSelecionada);

  const turmasOrdenadas =
    ordenacao === "evasao"
      ? ordenarPorTaxaEvasao(turmasFiltradas)
      : ordenarPorAlerta(turmasFiltradas);

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

        <OrdenacaoSelector
          value={ordenacao}
          onChange={setOrdenacao}
          opcoes={OPCOES_ORDENACAO}
        />
      </div>

      <div className="grid">
        {turmasOrdenadas.map((turma: any) => (
          <EntityCard key={turma.nome} {...turma} />
        ))}
      </div>
    </Layout>
  );
}
