export function ordenarPorNome(itens: any[]) {
  return [...itens].sort((a, b) =>
    (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR")
  );
}
