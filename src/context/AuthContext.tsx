import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { login as loginRequest } from "../services/api";

interface AuthState {
  token: string | null;
  nome: string | null;
  papel: string | null;
  turmas: string[];
}

interface AuthContextValue extends AuthState {
  login: (usuario: string, senha: string) => Promise<void>;
  logout: () => void;
}

const ESTADO_VAZIO: AuthState = {
  token: null,
  nome: null,
  papel: null,
  turmas: [],
};

const STORAGE_KEY = "pfc_auth";

const AuthContext = createContext<AuthContextValue | null>(null);

function lerEstadoSalvo(): AuthState {
  try {
    const bruto = localStorage.getItem(STORAGE_KEY);
    if (!bruto) return ESTADO_VAZIO;

    return { ...ESTADO_VAZIO, ...JSON.parse(bruto) };
  } catch {
    return ESTADO_VAZIO;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<AuthState>(lerEstadoSalvo);

  useEffect(() => {
    if (estado.token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [estado]);

  async function login(usuario: string, senha: string) {
    const resposta = await loginRequest(usuario, senha);

    setEstado({
      token: resposta.token,
      nome: resposta.nome,
      papel: resposta.papel,
      turmas: resposta.turmas,
    });
  }

  function logout() {
    setEstado(ESTADO_VAZIO);
  }

  return (
    <AuthContext.Provider value={{ ...estado, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth precisa estar dentro de um AuthProvider");
  }

  return contexto;
}
