import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import LoginModal from "../components/LoginModal";
import { useDashboard } from "../hooks/useDashboard";
import { useAuth } from "../context/AuthContext";

export default function TurmaDetalhe() {
  const { codigo } = useParams();
  const navigate = useNavigate();
  const { data, loading, atualizar } = useDashboard();
  const { token } = useAuth();
  const [modalAberto, setModalAberto] = useState(false);

  if (loading) {
    return <h1>Carregando...</h1>;
  }

  const turma = data.turmas.find((t: any) => t.codigo === codigo);

  if (!turma) {
    return (
      <Layout onRefresh={atualizar}>
        <p>Turma não encontrada.</p>

        <button className="pdf-btn" onClick={() => navigate("/turmas")}>
          Voltar
        </button>
      </Layout>
    );
  }

  return (
    <Layout onRefresh={atualizar}>
      <button className="pdf-btn" onClick={() => navigate("/turmas")}>
        Voltar
      </button>

      <div className={`entity-card ${turma.nivelAlerta}`} style={{ marginTop: 16 }}>
        <h3>{turma.nome}</h3>
        <p><strong>Cidade:</strong> {turma.cidade}</p>
        <p><strong>Escola:</strong> {turma.escola}</p>
        <p><strong>Supervisor:</strong> {turma.supervisor}</p>
        <p><strong>Alunos ativos:</strong> {turma.alunosAtivos}</p>
        <p><strong>Vagas disponíveis:</strong> {Math.max(0, turma.vagasDisponiveis)}</p>
        <p><strong>Taxa de evasão:</strong> {turma.taxaEvasao}%</p>
      </div>

      <div className="section-card" style={{ marginTop: 20 }}>
        <h3>Alunos</h3>

        {token && turma.alunosLista ? (
          <ul className="subList">
            {turma.alunosLista.map((nomeAluno: string) => (
              <li key={nomeAluno}>{nomeAluno}</li>
            ))}
          </ul>
        ) : (
          <>
            <p className="section-card-legenda">
              Faça login para ver os nomes dos alunos desta turma.
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
