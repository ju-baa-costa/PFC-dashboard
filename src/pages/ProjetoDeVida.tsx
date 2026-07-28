import Layout from "../components/Layout";

import { useDashboard } from "../hooks/useDashboard";
import { gerarRelatorioPDF } from "../utils/pdfReport";

export default function ProjetoDeVida() {
  const { data, loading, atualizar } = useDashboard();

  if (loading) return <h1>Carregando...</h1>;

  function gerarCompleto() {
    gerarRelatorioPDF(
      "Relatório Completo - Projeto de Vida",
      [
        { label: "Alunos totais", valor: data.resumo.alunos },
        { label: "Alunos ativos", valor: data.resumo.ativos },
        { label: "Alunos desligados", valor: data.resumo.desligados },
        {
          label: "Percentual de desligados",
          valor: `${data.resumo.percentualDesligados}%`,
        },
        { label: "Nível de alerta", valor: data.resumo.nivelAlerta },
        { label: "Cidades atendidas", valor: data.resumo.cidades },
        { label: "Escolas atendidas", valor: data.resumo.escolas },
        { label: "Turmas atendidas", valor: data.resumo.turmas },
        { label: "Supervisores", valor: data.resumo.supervisores },
      ],
      "relatorio-completo-projeto-de-vida.pdf"
    );
  }

  function gerarResumido() {
    gerarRelatorioPDF(
      "Relatório Resumido - Projeto de Vida",
      [
        { label: "Alunos ativos", valor: data.resumo.ativos },
        { label: "Turmas atendidas", valor: data.resumo.turmas },
        { label: "Supervisores", valor: data.resumo.supervisores },
      ],
      "relatorio-resumido-projeto-de-vida.pdf"
    );
  }

  return (
    <Layout
      onRefresh={atualizar}
      onRelatorioCompleto={gerarCompleto}
      onRelatorioResumido={gerarResumido}
    >
      <div className="grid">
        <div className={`entity-card ${data.resumo.nivelAlerta}`}>
          <h3>Alunos do programa</h3>

          <p>
            <strong>Alunos totais:</strong> {data.resumo.alunos}
          </p>

          <p>
            <strong>Alunos ativos:</strong> {data.resumo.ativos}
          </p>

          <p>
            <strong>Alunos desligados:</strong> {data.resumo.desligados}
          </p>

          <p>
            <strong>Percentual de desligados:</strong>{" "}
            {data.resumo.percentualDesligados}%
          </p>
        </div>

        <div className="entity-card">
          <h3>Abrangência</h3>

          <p>
            <strong>Cidades:</strong> {data.resumo.cidades}
          </p>

          <p>
            <strong>Escolas:</strong> {data.resumo.escolas}
          </p>

          <p>
            <strong>Turmas:</strong> {data.resumo.turmas}
          </p>

          <p>
            <strong>Supervisores:</strong> {data.resumo.supervisores}
          </p>
        </div>
      </div>
    </Layout>
  );
}
