export interface OpcaoOrdenacao {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  opcoes: OpcaoOrdenacao[];
}

export default function OrdenacaoSelector({
  value,
  onChange,
  opcoes,
}: Props) {
  return (
    <div className="ordenacao-selector">
      <span className="toolbar-label">Ordenar por:</span>

      <div className="chip-group">
        {opcoes.map((opcao) => (
          <button
            type="button"
            key={opcao.value}
            className={`chip ${value === opcao.value ? "active" : ""}`}
            onClick={() => onChange(opcao.value)}
          >
            {opcao.label}
          </button>
        ))}
      </div>
    </div>
  );
}
