const API_URL = import.meta.env.VITE_API_URL;

export async function getDashboardData() {
  const response = await fetch(`${API_URL}?t=${Date.now()}`);

  if (!response.ok) {
    throw new Error("Erro ao carregar dados");
  }

  return response.json();
}
