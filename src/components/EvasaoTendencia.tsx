import GraficoLinha from "./GraficoLinha";

import {
  faltaParaTendencia,
  formatarComSinal,
  formatarDataLonga,
  formatarNumero,
  nivelRetencao,
  resumirTendencia,
  type PontoHistorico,
  type Tendencia,
} from "../utils/tendenciaEvasao";

interface Props {
  historico: PontoHistorico[] | null;
  tendencia: Tendencia | null;
}

const COR_POR_NIVEL: Record<string, string> = {
  verde: "#22c55e",
  amarelo: "#eab308",
  vermelho: "#ef4444",
};

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <section className="section-card evasao-card">
      <h3 className="evasao-titulo">Retenção de alunos</h3>

      <p className="section-card-legenda">
        Quanto das vagas ofertadas segue ocupada por aluno ativo — a mesma conta
        que define a cor dos cards de escola.
      </p>

      {children}
    </section>
  );
}

export default function EvasaoTendencia({ historico, tendencia }: Props) {
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

  const nivel = nivelRetencao(tendencia.retencaoAtual);

  const resumo = resumirTendencia(tendencia);

  const serie = historico.map((ponto) => ({
    data: ponto.data,
    valor: ponto.retencao,
  }));

  return (
    <Moldura>
      <div className="evasao-conteudo">
        <div className="evasao-destaque">
          <div className={`evasao-numero card-${nivel}`}>
            <span className="evasao-valor">
              {formatarNumero(tendencia.retencaoAtual)}%
            </span>

            <span className="evasao-legenda">
              {atual.ativos} alunos ativos em {atual.vagas} vagas
            </span>
          </div>

          {resumo ? (
            <div className={`evasao-chip evasao-chip-${resumo.direcao}`}>
              <strong>{resumo.titulo}</strong>
            </div>
          ) : (
            <div className="evasao-chip evasao-chip-coletando">
              <strong>Coletando dados</strong>
            </div>
          )}
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
              rotulo={`Retenção de alunos de ${formatarDataLonga(
                tendencia.desde
              )} a ${formatarDataLonga(tendencia.ate)}`}
            />
          )}
        </div>
      </div>

      <p className="evasao-detalhe">
        {resumo
          ? resumo.detalhe
          : `Coleta iniciada em ${formatarDataLonga(tendencia.desde)}: ${
              tendencia.pontos
            } leitura(s) em ${tendencia.diasCobertos} dia(s). ${faltaParaTendencia(
              tendencia
            )}`}
      </p>

      {resumo && tendencia.r2 !== null && tendencia.r2 < 0.3 && (
        <p className="evasao-aviso">
          Os números oscilam bastante em torno dessa tendência — leia o ritmo
          como direção geral, não como previsão.
        </p>
      )}

      {/* A planilha so conhece "ativo" e "desligado". Qualquer outra situacao
          hoje entra na conta como aluno ativo e infla a retencao, entao a tela
          precisa dizer isso em vez de exibir um numero limpo demais. */}
      {atual.outrasSituacoes > 0 && (
        <p className="evasao-aviso">
          {atual.outrasSituacoes} aluno(s) estão numa situação fora de
          “ativo”/“desligado” e hoje contam como ativos neste número.
        </p>
      )}

      <p className="evasao-rodape">
        {tendencia.pontos} leitura(s) entre{" "}
        {formatarDataLonga(tendencia.desde)} e{" "}
        {formatarDataLonga(tendencia.ate)} · variação total{" "}
        {formatarComSinal(tendencia.variacaoPontos)} p.p.
      </p>
    </Moldura>
  );
}
