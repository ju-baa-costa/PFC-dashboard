import Layout from "../components/Layout";
import SupervisorCard from "../components/SupervisorCard";
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

  return (
    <Layout
      onRefresh={atualizar}
      onRelatorioCompleto={gerarCompleto}
      onRelatorioResumido={gerarResumido}
    >
      <div className="grid">
        {ordenarPorFrequencia(data.supervisores).map(
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