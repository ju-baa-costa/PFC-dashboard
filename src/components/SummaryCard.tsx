interface Props {
    title: string;
    value: number;
    onClick: () => void;
  }
  
  export default function SummaryCard({
    title,
    value,
    onClick
  }: Props) {
    return (
      <div
        className="summary-card"
        onClick={onClick}
      >
        <h3>{title}</h3>
        <h2>{value}</h2>
      </div>
    );
  }