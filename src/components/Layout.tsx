import Header from "./Header";
import Tarja from "../demo/Tarja";

interface Props {
  children: React.ReactNode;
  onRefresh?: () => void;
  onRelatorioCompleto?: () => void;
  onRelatorioResumido?: () => void;
}

export default function Layout({
  children,
  onRefresh,
  onRelatorioCompleto,
  onRelatorioResumido,
}: Props) {
  return (
    <>
      <Header
        onRefresh={onRefresh}
        onRelatorioCompleto={onRelatorioCompleto}
        onRelatorioResumido={onRelatorioResumido}
      />

      <Tarja />

      <main className="content">
        {children}
      </main>
    </>
  );
}