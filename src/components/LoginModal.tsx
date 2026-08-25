import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

interface Props {
  onClose: () => void;
}

export default function LoginModal({ onClose }: Props) {
  const { login } = useAuth();

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(evento: FormEvent) {
    evento.preventDefault();

    setErro("");
    setEnviando(true);

    try {
      await login(usuario, senha);
      onClose();
    } catch (erro: any) {
      setErro(erro.message || "Erro ao entrar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(evento) => evento.stopPropagation()}>
        <h2>Entrar</h2>

        <form onSubmit={handleSubmit}>
          <label>
            Usuário
            <input
              type="text"
              value={usuario}
              onChange={(evento) => setUsuario(evento.target.value)}
              autoFocus
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
              required
            />
          </label>

          {erro && <p className="modal-erro">{erro}</p>}

          <div className="modal-actions">
            <button type="button" className="pdf-btn" onClick={onClose}>
              Cancelar
            </button>

            <button type="submit" className="login-btn" disabled={enviando}>
              {enviando ? "Entrando..." : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
