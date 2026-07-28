interface ProjetoDeVidaCardProps {
    title: string;
    onClick: () => void;
  }
  
  export default function ProjetoDeVidaCard({
    title,
    onClick
  }: ProjetoDeVidaCardProps) {
    return (
      <div
        className="projeto-de-vida-card"
        onClick={onClick}
      >
        <h3>{title}</h3>
      </div>
    );
  }