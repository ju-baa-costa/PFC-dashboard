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

export default function Escolas() {
  const {
    data,
    loading,
    atualizar,
  } = useDashboard();

  const [cidadeSelecionada, setCidadeSelecionada] = useState(TODAS_CIDADES);
  const [ordenacao, setOrdenacao] = useState("alerta");

  if (loading) {
    return <h1>Carregando...</h1>;
  }

  function gerarCompleto() {
    gerarRelatorioDetalhadoPDF(
      "Relatório Completo - Escolas",
      montarSecoesEntidades(data.escolas, { mostrarDesligados: false }),
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

  const cidades: string[] = [...new Set<string>(data.cidades.map((c: any) => c.nome))].sort();

  const escolasFiltradas =
    cidadeSelecionada === TODAS_CIDADES
      ? data.escolas
      : data.escolas.filter((escola: any) => escola.cidade === cidadeSelecionada);

  const escolasOrdenadas =
    ordenacao === "evasao"
      ? ordenarPorTaxaEvasao(escolasFiltradas)
      : ordenarPorAlerta(escolasFiltradas);

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
        {escolasOrdenadas.map((escola: any) => (
          <EntityCard
            key={escola.nome}
            {...escola}
            mostrarDesligados={false}
          />
        ))}
      </div>
    </Layout>
  );
}
