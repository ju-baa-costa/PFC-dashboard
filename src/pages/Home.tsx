import { useNavigate } from "react-router-dom";

import Layout from "../components/Layout";
import SummaryCard from "../components/SummaryCard";

import { useDashboard } from "../hooks/useDashboard";

export default function Home() {
  const { data, loading, atualizar } = useDashboard();
  const navigate = useNavigate();

  if (loading) return <h1>Carregando...</h1>;

  return (
    <Layout
      onRefresh={atualizar}
      sidebar={
        <>
          <h2>Resumo Geral</h2>

          <p>Alunos: {data.resumo.alunos}</p>

          <p>Ativos: {data.resumo.ativos}</p>

          <p>Desligados: {data.resumo.desligados}</p>
          <p>Última atualização:</p>

          <p>{new Date(data.ultimaAtualizacao).toLocaleString("pt-BR")}</p>
        </>
      }
    >
      <div className="grid">
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
      </div>
    </Layout>
  );
}
