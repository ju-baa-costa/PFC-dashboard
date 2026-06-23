export function ordenarPorAlerta(
  itens: any[]
) {
  const ordem = {
    vermelho: 3,
    amarelo: 2,
    verde: 1,
  } as const;

  return [...itens].sort(
    (a, b) =>
      ordem[
        b.nivelAlerta as keyof typeof ordem
      ] -
      ordem[
        a.nivelAlerta as keyof typeof ordem
      ]
  );
}