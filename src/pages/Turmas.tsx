import Layout from "../components/Layout";
import EntityCard from "../components/EntityCard";
import { useDashboard } from "../hooks/useDashboard";

export default function Turmas() {
  const { data, loading, atualizar } = useDashboard();

  if (loading) {
    return <h1>Carregando...</h1>;
  }

  return (
    <Layout
      onRefresh={atualizar}
    >
      <div className="grid">
        {data.turmas.map((turma: any) => (
          <EntityCard key={turma.nome} {...turma} />
        ))}
      </div>
    </Layout>
  );
}
