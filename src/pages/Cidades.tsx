import { useState } from "react";
import Layout from "../components/Layout";
import EntityCard from "../components/EntityCard";
import OrdenacaoSelector from "../components/OrdenacaoSelector";
import { ordenarPorTaxaEvasao } from "../utils/ordenacaoTaxaEvasao";
import { ordenarPorNome } from "../utils/ordenacaoNome";

import { useDashboard } from "../hooks/useDashboard";
import {
  calcularAgregadoEntidades,
  gerarRelatorioPDF,
  gerarRelatorioDetalhadoPDF,
  montarSecoesEntidades,
} from "../utils/pdfReport";

const OPCOES_ORDENACAO = [
  { value: "evasao", label: "Taxa de evasão (maior-menor)" },
  { value: "nome", label: "Nome (A-Z)" },
];

export default function Cidades() {
  const {
    data,
    loading,
    atualizar,
  } = useDashboard();

  const [ordenacao, setOrdenacao] = useState("evasao");

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
    ordenacao === "nome"
      ? ordenarPorNome(data.cidades)
      : ordenarPorTaxaEvasao(data.cidades);

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
