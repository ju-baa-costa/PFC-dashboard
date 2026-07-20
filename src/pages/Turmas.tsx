import Layout from "../components/Layout";
import EntityCard from "../components/EntityCard";
import { useDashboard } from "../hooks/useDashboard";
import { ordenarPorAlerta } from "../utils/ordenacaoAlerta";
import {
  calcularAgregadoEntidades,
  gerarRelatorioPDF,
} from "../utils/pdfReport";

export default function Turmas() {
  const { data, loading, atualizar } = useDashboard();

  if (loading) {
    return <h1>Carregando...</h1>;
  }

  function gerarCompleto() {
    const agregado = calcularAgregadoEntidades(data.turmas);

    gerarRelatorioPDF(
      "Relatório Completo - Turmas",
      [
        { label: "Turmas", valor: agregado.total },
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
        { label: "Turmas em alerta verde", valor: agregado.porAlerta.verde },
        {
          label: "Turmas em alerta amarelo",
          valor: agregado.porAlerta.amarelo,
        },
        {
          label: "Turmas em alerta vermelho",
          valor: agregado.porAlerta.vermelho,
        },
      ],
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
