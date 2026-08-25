const API_URL = import.meta.env.VITE_API_URL;

export async function getDashboardData(token?: string | null) {
  const params = new URLSearchParams({ t: String(Date.now()) });
  if (token) params.set("token", token);

  const response = await fetch(`${API_URL}?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Erro ao carregar dados");
  }

  return response.json();
}

interface LoginResponse {
  token: string;
  nome: string;
  papel: string;
  turmas: string[];
}

export async function login(usuario: string, senha: string) {
  // GET em vez de POST: respostas de doPost do Apps Script nao vem com
  // cabecalho CORS quando chamadas via fetch() de outra origem (doGet vem
  // normalmente, testado no resto desta API), entao um POST aqui e
  // bloqueado pelo navegador antes mesmo de ler a resposta.
  const params = new URLSearchParams({
    action: "login",
    usuario,
    senha,
  });

  const response = await fetch(`${API_URL}?${params.toString()}`);

  const dados = await response.json();

  if (!response.ok || dados.erro) {
    throw new Error(dados.erro || "Erro ao entrar");
  }

  return dados as LoginResponse;
}
