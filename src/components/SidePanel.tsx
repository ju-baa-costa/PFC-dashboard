type SidePanelProps = {
  titulo: string;
};

export default function SidePanel({ titulo }: SidePanelProps) {
  return (
    <>
      <h2>{titulo}</h2>

      <hr />

      <p>Aqui ficarão os filtros.</p>
    </>
  );
}
