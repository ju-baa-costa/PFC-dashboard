// A Home mostra dois numeros sobre a evasao do programa:
//
//   1. a evasao global de hoje - quanto das vagas abertas esta vazio;
//   2. quanto por cento essa evasao caiu (ou subiu) em relacao a quinzena
//      anterior, chamado na tela de "melhora de retencao", porque evasao menor
//      e retencao maior.
//
// As duas contas vivem no Apps Script e chegam prontas no payload. Aqui so ha
// formatacao: duplicar a matematica no front foi exatamente o que fez o
// relatorio por email passar meses discordando do dashboard.

export interface PontoHistorico {
  data: string;
  alunos: number;
  ativos: number;
  ativosDeclarados: number;
  desligados: number;
  outrasSituacoes: number;
  vagas: number;
  retencao: number;
  taxaEvasao: number;
  escolasVermelhas: number;
  escolasAmarelas: number;
  escolasVerdes: number;
}

export type Direcao = "melhora" | "piora" | "estavel";

// Usada so para os metadados do periodo coletado (desde/ate/quantas leituras).
export interface Tendencia {
  pontos: number;
  diasCobertos: number;
  desde: string;
  ate: string;
  retencaoInicial: number;
  retencaoAtual: number;
  variacaoPontos: number;
  suficiente: boolean;
  inclinacaoMensal: number | null;
  r2: number | null;
  direcao: Direcao | null;
}

export interface ComparativoQuinzenal {
  diasPorJanela: number;
  leiturasAtual: number;
  leiturasAnterior: number;
  semBase: boolean;
  suficiente: boolean;
  evasaoAtual: number | null;
  evasaoAnterior: number | null;
  variacaoRelativa: number | null;
  direcao: Direcao | null;
}

export const MIN_LEITURAS_QUINZENA = 3;

// Espelho de calcularNivelEvasao no Apps Script, para a cor daqui nunca
// discordar da cor dos cards de escola.
export function nivelEvasao(
  evasao: number
): "verde" | "amarelo" | "vermelho" {
  if (evasao > 40) return "vermelho";
  if (evasao > 20) return "amarelo";
  return "verde";
}

export function formatarNumero(
  valor: number,
  casas = 1
): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export function formatarComSinal(
  valor: number,
  casas = 1
): string {
  const sinal = valor > 0 ? "+" : "";

  return `${sinal}${formatarNumero(valor, casas)}`;
}

// "2026-09-12" -> "12/09". Sem new Date() de proposito: a string ISO parseada
// como data vira meia-noite UTC e, em Sao Paulo, volta um dia no calendario.
export function formatarDataCurta(iso: string): string {
  const [, mes, dia] = iso.split("-");

  return `${dia}/${mes}`;
}

export function formatarDataLonga(iso: string): string {
  const [ano, mes, dia] = iso.split("-");

  return `${dia}/${mes}/${ano}`;
}

// Frase do tooltip do segundo numero, com os valores reais das duas janelas -
// o leitor consegue refazer a conta de cabeca em vez de confiar no rotulo.
export function explicarComparativo(
  comparativo: ComparativoQuinzenal
): string {
  const regra =
    `Compara a evasão média dos últimos ${comparativo.diasPorJanela} dias ` +
    `com a dos ${comparativo.diasPorJanela} dias anteriores: ` +
    `(anterior − atual) ÷ anterior.`;

  const escala =
    "É variação relativa, não pontos percentuais. " +
    "Evasão menor significa retenção maior, então número positivo é bom.";

  if (comparativo.semBase) {
    return `${regra} Na quinzena anterior a evasão foi de 0%, e não existe “caiu quantos por cento” a partir de zero.`;
  }

  if (
    !comparativo.suficiente ||
    comparativo.variacaoRelativa === null ||
    comparativo.evasaoAnterior === null ||
    comparativo.evasaoAtual === null
  ) {
    return `${regra} Ainda não há duas quinzenas completas de leituras para comparar. ${escala}`;
  }

  const verbo =
    comparativo.variacaoRelativa > 0 ? "queda" : "aumento";

  return (
    `${regra} Aqui: ${formatarNumero(comparativo.evasaoAnterior)}% na quinzena ` +
    `anterior contra ${formatarNumero(comparativo.evasaoAtual)}% nesta, ` +
    `${verbo} de ${formatarNumero(
      Math.abs(comparativo.variacaoRelativa)
    )}%. ${escala}`
  );
}

// Quanto falta para os dois numeros existirem. Nas primeiras semanas essa e a
// unica frase honesta que a tela tem a dizer.
export function faltaParaComparativo(
  comparativo: ComparativoQuinzenal
): string {
  if (comparativo.leiturasAnterior < MIN_LEITURAS_QUINZENA) {
    return `Ainda não há uma quinzena anterior para comparar (${comparativo.leiturasAnterior} de ${MIN_LEITURAS_QUINZENA} leituras).`;
  }

  return `Faltam leituras nesta quinzena (${comparativo.leiturasAtual} de ${MIN_LEITURAS_QUINZENA}).`;
}
