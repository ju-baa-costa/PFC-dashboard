export const TODAS_CIDADES = "todos";

interface Props {
  cidades: string[];
  cidadeSelecionada: string;
  onChange: (cidade: string) => void;
}

export default function FilterPanel({
  cidades,
  cidadeSelecionada,
  onChange,
}: Props) {
  return (
    <div className="filter-panel">
      <span className="toolbar-label">Cidade:</span>

      <div className="chip-group">
        <button
          type="button"
          className={`chip ${cidadeSelecionada === TODAS_CIDADES ? "active" : ""}`}
          onClick={() => onChange(TODAS_CIDADES)}
        >
          Todos
        </button>

        {cidades.map((cidade) => (
          <button
            type="button"
            key={cidade}
            className={`chip ${cidadeSelecionada === cidade ? "active" : ""}`}
            onClick={() => onChange(cidade)}
          >
            {cidade}
          </button>
        ))}
      </div>
    </div>
  );
}
