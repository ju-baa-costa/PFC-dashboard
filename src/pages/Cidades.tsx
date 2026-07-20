import Layout from "../components/Layout";
import EntityCard from "../components/EntityCard";
import { ordenarPorAlerta } from "../utils/ordenacaoAlerta";

import { useDashboard } from "../hooks/useDashboard";
import {
  calcularAgregadoEntidades,
  gerarRelatorioPDF,
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
    const agregado = calcularAgregadoEntidades(data.cidades);

    gerarRelatorioPDF(
      "Relatório Completo - Cidades",
      [
        { label: "Cidades", valor: agregado.total },
        { label: "Alunos totais", valor: agregado.totalAlunos },
        { label: "Alunos ativos", valor: agregado.totalAlunosAtivos },
        { label: "Alunos desligados", valor: agregado.totalDesligados },
        { label: "Vagas ofertadas", valor: agregado.totalVagas },
        {
          label: "Taxa de evasão média",
          valor:
            agregado.taxaEvasaoMedia !== null
              ? `${agregado.taxaEvasaoMedia.toFixed(1)}%`
              : "N/A",
        },
        { label: "Cidades em alerta verde", valor: agregado.porAlerta.verde },
        {
          label: "Cidades em alerta amarelo",
          valor: agregado.porAlerta.amarelo,
        },
        {
          label: "Cidades em alerta vermelho",
          valor: agregado.porAlerta.vermelho,
        },
      ],
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