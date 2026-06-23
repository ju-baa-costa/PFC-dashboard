import Layout from "../components/Layout";
import SupervisorCard from "../components/SupervisorCard";
import { useDashboard } from "../hooks/useDashboard";
import { ordenarPorFrequencia } from "../utils/ordenacaoFreq";


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