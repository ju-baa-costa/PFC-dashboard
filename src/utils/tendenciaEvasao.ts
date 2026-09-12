// A metrica que a Home mostra e a retencao sobre vagas (ativos / vagas), o
// complemento da taxaEvasao que ja colore os cards de escola - escolhida
// justamente para os dois numeros nunca se contradizerem na mesma tela.
//
// A conta em si (regressao linear sobre a serie) vive no Apps Script e chega
// pronta no payload. Aqui so ha formatacao: duplicar a matematica no front foi
// exatamente o que fez o relatorio por email passar meses discordando do
// dashboard.

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

export type DirecaoTendencia = "melhora" | "piora" | "estavel";

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
  direcao: DirecaoTendencia | null;
}

export const MIN_PONTOS_TENDENCIA = 3;
export const MIN_DIAS_TENDENCIA = 14;

// Espelho de calcularNivelEvasao no Apps Script, escrito em termos de
// retencao: evasao > 40 vira retencao < 60, evasao > 20 vira retencao < 80.
// Nao reusa getCardColor de proposito - os limites batem por coincidencia
// numerica, mas frequencia de aula e retencao de vaga sao coisas diferentes e
// mudar um limite nao deveria mexer no outro.
export function nivelRetencao(
  retencao: number
): "verde" | "amarelo" | "vermelho" {
  if (retencao < 60) return "vermelho";
  if (retencao < 80) return "amarelo";
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

export interface ResumoTendencia {
  titulo: string;
  detalhe: string;
  direcao: DirecaoTendencia;
}

export function resumirTendencia(
  tendencia: Tendencia
): ResumoTendencia | null {
  if (!tendencia.suficiente || tendencia.inclinacaoMensal === null) {
    return null;
  }

  const ritmo = formatarComSinal(tendencia.inclinacaoMensal);

  const direcao: DirecaoTendencia = tendencia.direcao ?? "estavel";

  const titulo =
    direcao === "estavel"
      ? "Estável no período"
      : `${ritmo} p.p. por mês`;

  const periodo = `entre ${formatarDataLonga(
    tendencia.desde
  )} e ${formatarDataLonga(tendencia.ate)}`;

  const detalhe =
    direcao === "estavel"
      ? `A retenção oscilou ${formatarComSinal(
          tendencia.variacaoPontos
        )} p.p. ${periodo} — variação pequena demais para chamar de melhora ou piora.`
      : direcao === "melhora"
        ? `A retenção subiu ${formatarComSinal(
            tendencia.variacaoPontos
          )} p.p. ${periodo}: a cada 30 dias, cerca de ${ritmo} p.p. a mais dos alunos seguem no programa.`
        : `A retenção caiu ${formatarComSinal(
            tendencia.variacaoPontos
          )} p.p. ${periodo}: a cada 30 dias, cerca de ${ritmo} p.p. dos alunos deixam de seguir no programa.`;

  return { titulo, detalhe, direcao };
}

// Quanto falta para a tendencia poder ser calculada. Nos primeiros dias essa e
// a unica frase honesta que a tela tem a dizer.
export function faltaParaTendencia(
  tendencia: Tendencia
): string {
  const faltamPontos = Math.max(
    0,
    MIN_PONTOS_TENDENCIA - tendencia.pontos
  );

  const faltamDias = Math.max(
    0,
    MIN_DIAS_TENDENCIA - tendencia.diasCobertos
  );

  if (faltamDias > 0) {
    return `Faltam cerca de ${faltamDias} dia(s) de coleta para calcular o ritmo.`;
  }

  if (faltamPontos > 0) {
    return `Faltam ${faltamPontos} leitura(s) para calcular o ritmo.`;
  }

  return "Ainda não há leituras suficientes para calcular o ritmo.";
}
