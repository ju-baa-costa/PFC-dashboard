export function ordenarPorTaxaEvasao(itens: any[]) {
  return [...itens].sort(
    (a, b) => (b.taxaEvasao ?? 0) - (a.taxaEvasao ?? 0)
  );
}
