import { useNavigate } from "react-router-dom";

import EvasaoTendencia from "../components/EvasaoTendencia";
import Layout from "../components/Layout";
import SummaryCard from "../components/SummaryCard";

import { useDashboard } from "../hooks/useDashboard";
import {
  calcularAgregadoEntidades,
  gerarRelatorioPDF,
} from "../utils/pdfReport";

export default function Home() {
  const { data, loading, atualizar } = useDashboard();
  const navigate = useNavigate();

  if (loading) return <h1>Carregando...</h1>;

  function gerarCompleto() {
    const agregado = calcularAgregadoEntidades(data.cidades ?? []);

    gerarRelatorioPDF(
      "Relatório Completo - Dashboard Global",
      [
        { label: "Cidades", valor: data.resumo.cidades },
        { label: "Escolas", valor: data.resumo.escolas },
        { label: "Turmas", valor: data.resumo.turmas },
        { label: "Supervisores", valor: data.resumo.supervisores },
        { label: "Alunos totais", valor: agregado.totalAlunos },
        { label: "Alunos ativos", valor: agregado.totalAlunosAtivos },
        { label: "Alunos desligados", valor: agregado.totalDesligados },
        { label: "Vagas ofertadas", valor: agregado.totalVagas },
        {
          label: "Vagas disponíveis",
          valor: agregado.totalVagasDisponiveis ?? "N/A",
        },
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
      "relatorio-completo-dashboard-global.pdf"
    );
  }

  function gerarResumido() {
    const agregado = calcularAgregadoEntidades(data.cidades ?? []);

    gerarRelatorioPDF(
      "Relatório Resumido - Dashboard Global",
      [
        { label: "Cidades ativas", valor: data.resumo.cidades },
        { label: "Escolas ativas", valor: data.resumo.escolas },
        { label: "Turmas ativas", valor: data.resumo.turmas },
        { label: "Alunos ativos", valor: agregado.totalAlunosAtivos },
      ],
      "relatorio-resumido-dashboard-global.pdf"
    );
  }

  return (
    <Layout
      onRefresh={atualizar}
      onRelatorioCompleto={gerarCompleto}
      onRelatorioResumido={gerarResumido}
    >
      <div className="grid home-grid">
        <SummaryCard
          title="Cidades"
          value={data.resumo.cidades}
          onClick={() => navigate("/cidades")}
        />

        <SummaryCard
          title="Escolas"
          value={data.resumo.escolas}
          onClick={() => navigate("/escolas")}
        />

        <SummaryCard
          title="Turmas"
          value={data.resumo.turmas}
          onClick={() => navigate("/turmas")}
        />

        <SummaryCard
          title="Supervisores"
          value={data.resumo.supervisores}
          onClick={() => navigate("/supervisores")}
        />

        <section className="section-card anos-finais-card">
          <h3 className="anos-finais-titulo">Anos Finais</h3>

          <div className="anos-finais-grid">
            <SummaryCard
              title="Cursinho"
              value={data.cursinho ? data.cursinho.total : "—"}
              onClick={() => navigate("/cursinho")}
            />

            <SummaryCard
              title="Projeto de Vida"
              value="—"
              onClick={() => navigate("/projeto-de-vida")}
            />
          </div>
        </section>

        <EvasaoTendencia
          historico={data.historico ?? null}
          tendencia={data.tendencia ?? null}
          comparativo={data.comparativoQuinzenal ?? null}
        />
      </div>
    </Layout>
  );
}
