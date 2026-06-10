import Header from "./Header";

interface Props {
  children: React.ReactNode;
  onRefresh?: () => void;
}

export default function Layout({ children, onRefresh }: Props) {
  return (
    <>
      <Header onRefresh={onRefresh} />

      <main className="content">
        {children}
      </main>
    </>
  );
}