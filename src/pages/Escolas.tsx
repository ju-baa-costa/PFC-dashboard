import Layout from "../components/Layout";
import EntityCard from "../components/EntityCard";
import { useDashboard } from "../hooks/useDashboard";

export default function Escolas() {
  const {
    data,
    loading,
    atualizar,
  } = useDashboard();

  if (loading) {
    return <h1>Carregando...</h1>;
  }

  return (
    <Layout
  onRefresh={atualizar}
      sidebar={
        <>
          <h2>Escolas</h2>

          <p>
            Total: {data.escolas.length}
          </p>
        </>
      }
    >
      <div className="grid">
        {data.escolas.map((escola:any) => (
          <EntityCard
            key={escola.nome}
            {...escola}
          />
        ))}
      </div>
    </Layout>
  );
}