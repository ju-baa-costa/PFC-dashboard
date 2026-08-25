import { useState } from "react";
import Layout from "../components/Layout";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../context/AuthContext";

export default function ProjetoDeVida() {
  const { token, nome } = useAuth();
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <Layout>
      <div className="section-card">
        {token ? (
          <>
            <h3>Projeto de Vida</h3>
            <p className="section-card-legenda">
              Em breve — logado como {nome}.
            </p>
          </>
        ) : (
          <>
            <p className="section-card-legenda">
              Faça login para acessar o Projeto de Vida.
            </p>

            <button className="login-btn" onClick={() => setModalAberto(true)}>
              Login
            </button>
          </>
        )}
      </div>

      {modalAberto && (
        <LoginModal onClose={() => setModalAberto(false)} />
      )}
    </Layout>
  );
}
