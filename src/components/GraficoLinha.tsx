import { useId } from "react";

import { formatarDataCurta, formatarNumero } from "../utils/tendenciaEvasao";

export interface PontoGrafico {
  data: string;
  valor: number;
}

interface Props {
  serie: PontoGrafico[];
  cor: string;
  sufixo?: string;
  rotulo: string;
}

// SVG na mao em vez de uma biblioteca de graficos: e uma linha so, e o projeto
// inteiro hoje carrega apenas jspdf. Puxar ~500kB de dependencia para desenhar
// um path nao se paga.
const LARGURA = 720;
const ALTURA = 240;

const MARGEM = {
  topo: 16,
  direita: 16,
  baixo: 28,
  esquerda: 44,
};

const AREA_LARGURA = LARGURA - MARGEM.esquerda - MARGEM.direita;
const AREA_ALTURA = ALTURA - MARGEM.topo - MARGEM.baixo;

// Uma escala colada nos extremos faz 2 p.p. de oscilacao parecerem um
// desabamento. A folga de 10% (com um minimo de 5 p.p. de janela) mantem a
// variacao legivel sem transformar ruido em manchete.
function calcularEscala(valores: number[]) {
  const menor = Math.min(...valores);
  const maior = Math.max(...valores);

  const amplitude = Math.max(maior - menor, 5);
  const folga = amplitude * 0.1;

  return {
    minimo: Math.max(0, menor - folga),
    maximo: Math.min(100, maior + folga),
  };
}

export default function GraficoLinha({
  serie,
  cor,
  sufixo = "%",
  rotulo,
}: Props) {
  // useId porque pode haver mais de um grafico na pagina: dois gradientes com
  // o mesmo id fazem o segundo herdar a cor do primeiro.
  const idGradiente = useId();

  const valores = serie.map((ponto) => ponto.valor);

  const { minimo, maximo } = calcularEscala(valores);

  const janela = maximo - minimo || 1;

  function posicaoX(indice: number) {
    if (serie.length === 1) {
      return MARGEM.esquerda + AREA_LARGURA / 2;
    }

    return (
      MARGEM.esquerda +
      (indice / (serie.length - 1)) * AREA_LARGURA
    );
  }

  function posicaoY(valor: number) {
    return (
      MARGEM.topo +
      AREA_ALTURA -
      ((valor - minimo) / janela) * AREA_ALTURA
    );
  }

  const pontos = serie.map((ponto, indice) => ({
    ...ponto,
    x: posicaoX(indice),
    y: posicaoY(ponto.valor),
  }));

  const linha = pontos
    .map((ponto, indice) =>
      `${indice === 0 ? "M" : "L"} ${ponto.x.toFixed(1)} ${ponto.y.toFixed(1)}`
    )
    .join(" ");

  const area = `${linha} L ${pontos[pontos.length - 1].x.toFixed(
    1
  )} ${(MARGEM.topo + AREA_ALTURA).toFixed(1)} L ${pontos[0].x.toFixed(1)} ${(
    MARGEM.topo + AREA_ALTURA
  ).toFixed(1)} Z`;

  const grades = [0, 0.5, 1].map((fracao) => ({
    valor: minimo + janela * (1 - fracao),
    y: MARGEM.topo + AREA_ALTURA * fracao,
  }));

  // Com muitos pontos os circulos viram uma faixa borrada; ai so as pontas
  // continuam marcadas.
  const mostrarPontos = serie.length <= 30;

  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];

  return (
    <svg
      className="grafico-linha"
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      role="img"
      aria-label={rotulo}
      preserveAspectRatio="xMidYMid meet"
    >
      <title>{rotulo}</title>

      <defs>
        <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.28" />
          <stop offset="100%" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {grades.map((grade) => (
        <g key={grade.y}>
          <line
            x1={MARGEM.esquerda}
            y1={grade.y}
            x2={LARGURA - MARGEM.direita}
            y2={grade.y}
            className="grafico-grade"
          />

          <text
            x={MARGEM.esquerda - 8}
            y={grade.y + 4}
            textAnchor="end"
            className="grafico-rotulo-eixo"
          >
            {formatarNumero(grade.valor, 0)}
            {sufixo}
          </text>
        </g>
      ))}

      <path d={area} fill={`url(#${idGradiente})`} />

      <path
        d={linha}
        fill="none"
        stroke={cor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {mostrarPontos &&
        pontos.map((ponto) => (
          <circle
            key={ponto.data}
            cx={ponto.x}
            cy={ponto.y}
            r="3.5"
            fill="#fff"
            stroke={cor}
            strokeWidth="2"
          />
        ))}

      {!mostrarPontos &&
        [primeiro, ultimo].map((ponto) => (
          <circle
            key={ponto.data}
            cx={ponto.x}
            cy={ponto.y}
            r="4"
            fill="#fff"
            stroke={cor}
            strokeWidth="2"
          />
        ))}

      <text
        x={primeiro.x}
        y={ALTURA - 8}
        textAnchor="start"
        className="grafico-rotulo-eixo"
      >
        {formatarDataCurta(primeiro.data)}
      </text>

      {serie.length > 1 && (
        <text
          x={ultimo.x}
          y={ALTURA - 8}
          textAnchor="end"
          className="grafico-rotulo-eixo"
        >
          {formatarDataCurta(ultimo.data)}
        </text>
      )}
    </svg>
  );
}
