import Layout from "../components/Layout";
import EntityCard from "../components/EntityCard";

import { useDashboard } from "../hooks/useDashboard";

export default function Cidades() {
  const {
    data,
    loading,
    atualizar,
  } = useDashboard();

  if (loading)
    return <h1>Carregando...</h1>;

  return (
    <Layout
  onRefresh={atualizar}
    >
      <div className="grid">
        {data.cidades.map(
          (cidade:any) => (
            <EntityCard
              key={cidade.nome}
              {...cidade}
            />
          )
        )}
      </div>
    </Layout>
  );
}