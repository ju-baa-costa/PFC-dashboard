export function ordenarPorFrequencia(
  itens: any[]
) {
  return [...itens].sort(
    (a, b) =>
      a.frequenciaMedia -
      b.frequenciaMedia
  );
}