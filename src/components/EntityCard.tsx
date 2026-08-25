interface Props {
  nome: string;

  cidade?: string;
  escola?: string;
  supervisor?: string;

  supervisores?: string[];

  desligados?: number;
  alunosAtivos?: number;
  vagas?: number;
  vagasDisponiveis?: number;
  taxaEvasao?: number;

  nivelAlerta?: string;

  mostrarDesligados?: boolean;

  onClick?: () => void;
}

export default function EntityCard({
  nome,
  cidade,
  escola,
  supervisor,
  supervisores,
  desligados,
  alunosAtivos,
  vagas,
  vagasDisponiveis,
  taxaEvasao,
  nivelAlerta,
  mostrarDesligados = true,
  onClick,
}: Props) {
  const lotado =
    vagasDisponiveis !== undefined && vagasDisponiveis < 0;
  return (
    <div
      className={`entity-card ${nivelAlerta} ${onClick ? "entity-card-clickable" : ""}`}
      onClick={onClick}
    >
      <h3>{nome}</h3>

      {cidade && (
        <p>
          <strong>Cidade:</strong> {cidade}
        </p>
      )}

      {escola && (
        <p>
          <strong>Escola:</strong> {escola}
        </p>
      )}

      {supervisor && (
        <p>
          <strong>Supervisor:</strong> {supervisor}
        </p>
      )}

      {supervisores &&
        supervisores.length > 0 && (
          <p>
            <strong>Supervisores:</strong>{" "}
            {supervisores.join(", ")}
          </p>
        )}

      

      {mostrarDesligados && desligados !== undefined && (
        <p>
          <strong>Alunos desligados:</strong>{" "}
          {desligados}
        </p>
      )}

      {alunosAtivos !== undefined && (
        <p>
          <strong>Alunos ativos:</strong>{" "}
          {alunosAtivos}
        </p>
      )}
      {vagas !== undefined && (
        <p>
          <strong>Vagas ofertadas:</strong>{" "}
          {vagas}
        </p>
      )}

      {vagasDisponiveis !== undefined && (
        <p>
          <strong>Vagas disponíveis:</strong>{" "}
          {Math.max(0, vagasDisponiveis)}

          {lotado && (
            <span className="lotacao-aviso">
              lotado: {Math.abs(vagasDisponiveis)} aluno
              {Math.abs(vagasDisponiveis) > 1 ? "s" : ""} acima
              das vagas
            </span>
          )}
        </p>
      )}

{taxaEvasao !== undefined && (
  <p>
    <strong>
      Taxa de evasão
      <span className="tooltip-container">
        ℹ️

        <span className="tooltip-text">
          Calculado com base na quantidade de vagas disponibilizadas. <br/>
          0% a 20% - Verde <br/>
          21% a 40% - Laranja <br/>
          61% a 100% - Vermelho
        </span>
      </span>
      :
    </strong>{" "}
    {taxaEvasao}%
  </p>
)}
      
    </div>
  );
}