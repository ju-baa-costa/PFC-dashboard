import { createContext, useContext } from "react";

export interface AuthState {
  token: string | null;
  nome: string | null;
  papel: string | null;
  turmas: string[];
}

export interface AuthContextValue extends AuthState {
  login: (usuario: string, senha: string) => Promise<void>;
  logout: () => void;
}

export const ESTADO_VAZIO: AuthState = {
  token: null,
  nome: null,
  papel: null,
  turmas: [],
};

export const STORAGE_KEY = "pfc_auth";

// O contexto e o hook moram aqui, fora do AuthContext.tsx, para que aquele
// arquivo exporte apenas componentes — exigencia do Fast Refresh do Vite.
export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth precisa estar dentro de um AuthProvider");
  }

  return contexto;
}
