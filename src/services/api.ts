import { MODO_DEMO } from "../demo/modo";
import { respostaDemo } from "../demo/dados";

const API_URL = import.meta.env.VITE_API_URL;

// O modo demo entra aqui, e nao dentro de cada tela, para que as paginas nao
// saibam que ele existe: elas continuam recebendo a resposta da API no mesmo
// formato de sempre.
const TOKEN_DEMO_ADMIN = "demo:admin";
const TOKEN_DEMO_PROFESSOR = "demo:professor";

export async function getDashboardData(token?: string | null) {
  if (MODO_DEMO) {
    return respostaDemo(MODO_DEMO, token === TOKEN_DEMO_ADMIN);
  }

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
  // No modo demo qualquer senha entra. O usuario escolhe o papel: "professor"
  // cai na conta sem acesso a lista nominal, qualquer outro entra como admin,
  // que e o jeito de ver as duas telas sem ter dois cadastros de mentira.
  if (MODO_DEMO) {
    const ehProfessor =
      usuario.trim().toLowerCase() === "professor";

    return {
      token: ehProfessor ? TOKEN_DEMO_PROFESSOR : TOKEN_DEMO_ADMIN,
      nome: ehProfessor ? "Professora de Demonstração" : "Admin de Demonstração",
      papel: ehProfessor ? "professor" : "admin",
      turmas: [],
    } as LoginResponse;
  }

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
