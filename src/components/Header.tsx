import { useNavigate } from "react-router-dom";

interface Props {
  onRefresh?: () => void;
}

export default function Header({ onRefresh }: Props) {
  const navigate = useNavigate();

  return (
    <header className="header">
      <button className="home-btn" onClick={() => navigate("/")}>
        🏠 Home
      </button>

      <h1>Dashboard Global</h1>

      <button className="refresh-btn" onClick={onRefresh}>
        Atualizar Dados
      </button>
    </header>
  );
}
