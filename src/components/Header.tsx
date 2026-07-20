import {
  useNavigate,
  useLocation,
} from "react-router-dom";

import ReportButtons from "./ReportButtons";

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
      </div>
    </header>
  );
}