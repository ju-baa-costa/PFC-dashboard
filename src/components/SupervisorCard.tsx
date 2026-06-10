import { getCardColor } from "../utils/cardColor";

interface Props {
  nome: string;

  alunos: number;

  cidades: string[];
  escolas: string[];
  turmas: string[];

  frequenciaMedia: number;
}

export default function SupervisorCard({
  nome,
  alunos,
  cidades,
  escolas,
  turmas,
  frequenciaMedia,
}: Props) {
  const classeCor =
    getCardColor(frequenciaMedia);

  return (
    <div className={`entity-card ${classeCor}`}>
      <h3>{nome}</h3>

      <p>
        <strong>Alunos:</strong> {alunos}
      </p>

      <p>
        <strong>Cidade(s):</strong>
      </p>

      <ul className="subList">
        {cidades.map((cidade) => (
          <li key={cidade}>
            {cidade}
          </li>
        ))}
      </ul>

      <p>
        <strong>
          Escolas ({escolas.length}):
        </strong>
      </p>

      <ul className="subList">
        {escolas.map((escola) => (
          <li key={escola}>
            {escola}
          </li>
        ))}
      </ul>

      <p>
        <strong>
          Turmas ({turmas.length}):
        </strong>
      </p>

      <ul className="subList">
        {turmas.map((turma) => (
          <li key={turma}>
            {turma}
          </li>
        ))}
      </ul>

      <p>
        <strong>Frequência:</strong>{" "}
        {frequenciaMedia.toFixed(1)}%
      </p>
    </div>
  );
}