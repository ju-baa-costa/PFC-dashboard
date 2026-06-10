export function getCardColor(
  frequencia: number
) {
  if (frequencia >= 80) {
    return "card-verde";
  }

  if (frequencia >= 60) {
    return "card-amarelo";
  }

  return "card-vermelho";
}