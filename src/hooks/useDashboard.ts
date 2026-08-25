import { useEffect, useState } from "react";
import { getDashboardData } from "../services/api";
import { useAuth } from "../context/AuthContext";

export function useDashboard() {
  const { token } = useAuth();

  const [data, setData] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      const dados = await getDashboardData(token);

      setData(dados);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();

    const interval = setInterval(carregar, 60000);

    return () => clearInterval(interval);
    // Refaz a busca ao logar/deslogar para trocar entre turmas com e sem
    // alunosLista sem esperar o proximo ciclo de 60s.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return {
    data,
    loading,
    atualizar: carregar,
  };
}
