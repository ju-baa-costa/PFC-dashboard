import Layout from "../components/Layout";
import SupervisorCard from "../components/SupervisorCard";
import { useDashboard } from "../hooks/useDashboard";
import { ordenarPorFrequencia } from "../utils/ordenacaoFreq";
import {
  calcularAgregadoSupervisores,
  gerarRelatorioPDF,
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
    const agregado = calcularAgregadoSupervisores(data.supervisores);

    gerarRelatorioPDF(
      "Relatório Completo - Supervisores",
      [
        { label: "Supervisores", valor: agregado.total },
        { label: "Alunos atendidos", valor: agregado.totalAlunos },
        {
          label: "Frequência média geral",
          valor:
            agregado.frequenciaMedia !== null
              ? `${agregado.frequenciaMedia.toFixed(1)}%`
              : "N/A",
        },
        { label: "Cidades atendidas", valor: agregado.cidadesAtendidas },
        { label: "Escolas atendidas", valor: agregado.escolasAtendidas },
        { label: "Turmas atendidas", valor: agregado.turmasAtendidas },
      ],
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