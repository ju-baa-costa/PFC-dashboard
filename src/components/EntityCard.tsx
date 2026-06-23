interface Props {
  nome: string;

  cidade?: string;
  escola?: string;
  supervisor?: string;

  supervisores?: string[];

  alunos: number;

  desligados?: number;
  alunosAtivos?: number;
  vagas?: number;
  taxaEvasao?: number;

  nivelAlerta?: string;
}

export default function EntityCard({
  nome,
  cidade,
  escola,
  supervisor,
  supervisores,
  alunos,
  desligados,
  alunosAtivos,
  vagas,
  taxaEvasao,
  nivelAlerta,
}: Props) {
  return (
    <div className={`entity-card ${nivelAlerta}`}>
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

      

      {desligados !== undefined && (
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
      <p>
        <strong>Alunos totais:</strong>{" "}
        {alunos}
      </p>

      {vagas !== undefined && (
        <p>
          <strong>Vagas ofertadas:</strong>{" "}
          {vagas}
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