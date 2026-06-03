import Header from "./Header";

interface Props {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  onRefresh?: () => void;
}

export default function Layout({ children, sidebar, onRefresh }: Props) {
  return (
    <>
      <Header onRefresh={onRefresh} />

      <div className="page-layout">
        <main className="content">{children}</main>

        <aside className="sidebar">{sidebar}</aside>
      </div>
    </>
  );
}
