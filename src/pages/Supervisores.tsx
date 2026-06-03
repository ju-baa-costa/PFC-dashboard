import Layout from "../components/Layout";
import SupervisorCard from "../components/SupervisorCard";
import { useDashboard } from "../hooks/useDashboard";

export default function Supervisores() {
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
          <h2>Supervisores</h2>

          <p>
            Total: {data.supervisores.length}
          </p>
        </>
      }
    >
      <div className="grid">
        {data.supervisores.map(
          (supervisor:any) => (
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