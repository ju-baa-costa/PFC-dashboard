import { useState } from "react";
import Layout from "../components/Layout";
import EntityCard from "../components/EntityCard";
import OrdenacaoSelector from "../components/OrdenacaoSelector";
import { ordenarPorAlerta } from "../utils/ordenacaoAlerta";
import { ordenarPorTaxaEvasao } from "../utils/ordenacaoTaxaEvasao";

import { useDashboard } from "../hooks/useDashboard";
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

export default function Cidades() {
  const {
    data,
    loading,
    atualizar,
  } = useDashboard();

  const [ordenacao, setOrdenacao] = useState("alerta");

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

  const cidadesOrdenadas =
    ordenacao === "evasao"
      ? ordenarPorTaxaEvasao(data.cidades)
      : ordenarPorAlerta(data.cidades);

  return (
    <Layout
      onRefresh={atualizar}
      onRelatorioCompleto={gerarCompleto}
      onRelatorioResumido={gerarResumido}
    >
      <div className="toolbar">
        <OrdenacaoSelector
          value={ordenacao}
          onChange={setOrdenacao}
          opcoes={OPCOES_ORDENACAO}
        />
      </div>

      <div className="grid">
        {cidadesOrdenadas.map(
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
