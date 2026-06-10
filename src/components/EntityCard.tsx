interface Props {
  nome: string;

  cidade?: string;
  escola?: string;
  supervisor?: string;

  supervisores?: string[];

  alunos: number;

  desligados?: number;

  percentualDesligados?: number;

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
  percentualDesligados,
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
            <strong>
              Supervisores:
            </strong>{" "}
            {supervisores.join(", ")}
          </p>
      )}

      <p>
        <strong>Alunos:</strong> {alunos}
      </p>

      {desligados !== undefined && (
        <p>
          <strong>Desligados:</strong> {desligados}
        </p>
      )}

      {percentualDesligados !== undefined && (
        <p>
          <strong>Taxa de evasão:</strong>{" "}
          {percentualDesligados}%
        </p>
      )}
    </div>
  );
}