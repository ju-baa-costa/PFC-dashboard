interface Props {
  nome: string;
  cidade: string;

  alunos: number;

  cidades: number;
  escolas: number;
  turmas: number;

  frequenciaMedia: number;
}

export default function SupervisorCard({
  nome,
  cidade,
  alunos,
  cidades,
  escolas,
  turmas,
  frequenciaMedia,
}: Props) {
  return (
    <div className="entity-card">
      <h3>{nome}</h3>

      <p>
        <strong>Cidade:</strong> {cidade}
      </p>

      <p>
        <strong>Alunos:</strong> {alunos}
      </p>

      <p>
        <strong>Escolas:</strong> {escolas}
      </p>

      <p>
        <strong>Turmas:</strong> {turmas}
      </p>

      <p>
        <strong>Frequência:</strong> {frequenciaMedia}%
      </p>
    </div>
  );
}
