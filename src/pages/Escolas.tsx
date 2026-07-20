import Layout from "../components/Layout";
import EntityCard from "../components/EntityCard";
import { useDashboard } from "../hooks/useDashboard";
import { ordenarPorAlerta } from "../utils/ordenacaoAlerta";
import {
  calcularAgregadoEntidades,
  gerarRelatorioPDF,
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
    const agregado = calcularAgregadoEntidades(data.escolas);

    gerarRelatorioPDF(
      "Relatório Completo - Escolas",
      [
        { label: "Escolas", valor: agregado.total },
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
        { label: "Escolas em alerta verde", valor: agregado.porAlerta.verde },
        {
          label: "Escolas em alerta amarelo",
          valor: agregado.porAlerta.amarelo,
        },
        {
          label: "Escolas em alerta vermelho",
          valor: agregado.porAlerta.vermelho,
        },
      ],
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