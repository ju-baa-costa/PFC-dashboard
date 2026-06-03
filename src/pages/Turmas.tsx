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
      sidebar={
        <>
          <h2>Turmas</h2>

          <p>Total: {data.turmas.length}</p>
        </>
      }
    >
      <div className="grid">
        {data.turmas.map((turma) => (
          <EntityCard key={turma.nome} {...turma} />
        ))}
      </div>
    </Layout>
  );
}
