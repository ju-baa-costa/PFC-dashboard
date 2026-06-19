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
          <strong>Vagas ofertadas na turma:</strong>{" "}
          {vagas}
        </p>
      )}

      {taxaEvasao !== undefined && (
        <p>
          <strong>Taxa de evasão:</strong>{" "}
          {taxaEvasao.toFixed(1)}%
        </p>
      )}
    </div>
  );
}