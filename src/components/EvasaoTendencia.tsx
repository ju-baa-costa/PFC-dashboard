import GraficoLinha from "./GraficoLinha";

import {
  explicarComparativo,
  faltaParaComparativo,
  formatarComSinal,
  formatarDataLonga,
  formatarNumero,
  nivelEvasao,
  type ComparativoQuinzenal,
  type PontoHistorico,
  type Tendencia,
} from "../utils/tendenciaEvasao";

interface Props {
  historico: PontoHistorico[] | null;
  tendencia: Tendencia | null;
  comparativo: ComparativoQuinzenal | null;
}

const COR_POR_NIVEL: Record<string, string> = {
  verde: "#22c55e",
  amarelo: "#eab308",
  vermelho: "#ef4444",
};

function Ajuda({ texto }: { texto: string }) {
  return (
    <span className="tooltip-container">
      ℹ️
      <span className="tooltip-text evasao-tooltip">{texto}</span>
    </span>
  );
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <section className="section-card evasao-card">
      <h3 className="evasao-titulo">Evasão do programa</h3>

      <p className="section-card-legenda">
        Quanto das vagas abertas está vazio hoje e como isso mudou em relação à
        quinzena anterior. Passe o mouse no ℹ️ para ver a conta de cada número.
      </p>

      {children}
    </section>
  );
}

const AJUDA_EVASAO =
  "Quantas das vagas abertas pelo programa estão vazias hoje. " +
  "Vagas abertas = turmas × capacidade cadastrada de cada escola. " +
  "Uma vaga fica vazia quando o aluno é desligado ou quando ela nunca chegou " +
  "a ser preenchida — as duas coisas pesam igual aqui. " +
  "Até 20% verde, de 21% a 40% amarelo, acima de 40% vermelho.";

export default function EvasaoTendencia({
  historico,
  tendencia,
  comparativo,
}: Props) {
  // null e diferente de vazio: a aba de historico ainda nao existe na planilha,
  // entao nao ha nem o que comecar a desenhar.
  if (historico === null) {
    return (
      <Moldura>
        <p className="evasao-vazio">
          A coleta de histórico ainda não foi ligada na planilha.
        </p>
      </Moldura>
    );
  }

  if (historico.length === 0 || tendencia === null) {
    return (
      <Moldura>
        <p className="evasao-vazio">
          Nenhuma leitura registrada ainda. A primeira aparece aqui no dia
          seguinte ao início da coleta.
        </p>
      </Moldura>
    );
  }

  const atual = historico[historico.length - 1];

  const nivel = nivelEvasao(atual.taxaEvasao);

  // O teto de 100% na evasao ja impede ativos > vagas virar vaga negativa, mas
  // a subtracao aqui e crua e precisa do mesmo piso.
  const vagasVazias = Math.max(0, atual.vagas - atual.ativos);

  const temComparativo =
    comparativo !== null &&
    comparativo.suficiente &&
    comparativo.variacaoRelativa !== null;

  const direcao = temComparativo
    ? (comparativo as ComparativoQuinzenal).direcao ?? "estavel"
    : "coletando";

  const serie = historico.map((ponto) => ({
    data: ponto.data,
    valor: ponto.taxaEvasao,
  }));

  return (
    <Moldura>
      <div className="evasao-conteudo">
        <div className="evasao-destaque">
          <div className={`evasao-numero card-${nivel}`}>
            <span className="evasao-rotulo">
              Evasão global hoje
              <Ajuda texto={AJUDA_EVASAO} />
            </span>

            <span className="evasao-valor">
              {formatarNumero(atual.taxaEvasao)}%
            </span>

            <span className="evasao-legenda">
              {vagasVazias} vagas vazias de {atual.vagas} abertas
            </span>
          </div>

          <div className={`evasao-numero evasao-variacao-${direcao}`}>
            <span className="evasao-rotulo">
              Melhora de retenção
              {comparativo && (
                <Ajuda texto={explicarComparativo(comparativo)} />
              )}
            </span>

            <span className="evasao-valor">
              {temComparativo
                ? `${formatarComSinal(
                    (comparativo as ComparativoQuinzenal)
                      .variacaoRelativa as number
                  )}%`
                : "—"}
            </span>

            <span className="evasao-legenda">
              {temComparativo
                ? "vs. a quinzena anterior"
                : comparativo === null
                  ? "sem leituras suficientes"
                  : comparativo.semBase
                    ? "não houve evasão na quinzena anterior"
                    : faltaParaComparativo(comparativo)}
            </span>
          </div>
        </div>

        <div className="evasao-grafico">
          {historico.length === 1 ? (
            <p className="evasao-vazio">
              Só há uma leitura ({formatarDataLonga(atual.data)}). O gráfico
              aparece a partir da segunda.
            </p>
          ) : (
            <GraficoLinha
              serie={serie}
              cor={COR_POR_NIVEL[nivel]}
              rotulo={`Evasão do programa de ${formatarDataLonga(
                tendencia.desde
              )} a ${formatarDataLonga(tendencia.ate)}`}
            />
          )}
        </div>
      </div>

      <p className="evasao-rodape">
        {tendencia.pontos} leitura(s) entre{" "}
        {formatarDataLonga(tendencia.desde)} e{" "}
        {formatarDataLonga(tendencia.ate)}
      </p>
    </Moldura>
  );
}
