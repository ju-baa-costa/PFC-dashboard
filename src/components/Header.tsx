import {
  useNavigate,
  useLocation,
} from "react-router-dom";

interface Props {
  onRefresh?: () => void;
}

export default function Header({
  onRefresh,
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

      <button
        className="refresh-btn"
        onClick={onRefresh}
      >
        Atualizar Dados
      </button>
    </header>
  );
}