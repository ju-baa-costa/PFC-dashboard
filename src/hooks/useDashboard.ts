import { useEffect, useState } from "react";
import { getDashboardData } from "../services/api";

export function useDashboard() {
  const [data, setData] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  async function carregar() {
    try {
      const dados = await getDashboardData();

      setData(dados);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();

    const interval = setInterval(carregar, 60000);

    return () => clearInterval(interval);
  }, []);

  return {
    data,
    loading,
    atualizar: carregar,
  };
}
