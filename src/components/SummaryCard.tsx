interface Props {
    title: string;
    value: number | string;
    hint?: string;
    onClick?: () => void;
  }

  export default function SummaryCard({
    title,
    value,
    hint,
    onClick
  }: Props) {
    return (
      <div
        className={
          onClick
            ? "summary-card"
            : "summary-card summary-card-static"
        }
        onClick={onClick}
      >
        <h3>{title}</h3>
        <h2>{value}</h2>

        {hint && (
          <p className="summary-card-hint">
            {hint}
          </p>
        )}
      </div>
    );
  }
