import { useState } from "react";
import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import ReportButtons from "./ReportButtons";
import LoginModal from "./LoginModal";
import { useAuth } from "../context/AuthContext";

interface Props {
  onRefresh?: () => void;
  onRelatorioCompleto?: () => void;
  onRelatorioResumido?: () => void;
}

export default function Header({
  onRefresh,
  onRelatorioCompleto,
  onRelatorioResumido,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, nome, logout } = useAuth();
  const [modalAberto, setModalAberto] = useState(false);

  const pageTitles: Record<
    string,
    string
  > = {
    "/": "Dashboard Global",
    "/cidades":
      "Dashboard de Cidades",
    "/escolas":
      "Dashboard de Escolas",
    "/turmas":
      "Dashboard de Turmas",
    "/supervisores":
      "Dashboard de Supervisores",
    "/cursinho":
      "Dashboard do Cursinho",
    "/projeto-de-vida":
      "Projeto de Vida",
  };

  const currentTitle =
    pageTitles[
      location.pathname
    ] || "Dashboard";

  return (
    <header className="header">
      <button
        className="home-btn"
        onClick={() =>
          navigate("/")
        }
      >
        🏠 Home
      </button>

      <h1>{currentTitle}</h1>

      <div className="header-actions">
        {onRelatorioCompleto && onRelatorioResumido && (
          <ReportButtons
            onCompleto={onRelatorioCompleto}
            onResumido={onRelatorioResumido}
          />
        )}

        <button
          className="refresh-btn"
          onClick={onRefresh}
        >
          Atualizar Dados
        </button>

        {token ? (
          <div className="auth-status">
            <span className="auth-nome">{nome}</span>
            <button className="pdf-btn" onClick={logout}>
              Sair
            </button>
          </div>
        ) : (
          <button
            className="login-btn"
            onClick={() => setModalAberto(true)}
          >
            Login
          </button>
        )}
      </div>

      {modalAberto && (
        <LoginModal onClose={() => setModalAberto(false)} />
      )}
    </header>
  );
}