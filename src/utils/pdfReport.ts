import { jsPDF } from "jspdf";

export interface ItemRelatorio {
  label: string;
  valor: string | number;
}

export function gerarRelatorioPDF(
  titulo: string,
  itens: ItemRelatorio[],
  nomeArquivo: string
) {
  const doc = new jsPDF();
  const dataGeracao = new Date().toLocaleString("pt-BR");

  let y = 20;

  doc.setFontSize(18);
  doc.text(titulo, 14, y);

  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(`Gerado em ${dataGeracao}`, 14, y);
  doc.setTextColor(0);

  y += 14;
  doc.setFontSize(12);

  itens.forEach((item) => {
    doc.text(`${item.label}:`, 14, y);
    doc.text(String(item.valor), 120, y);
    y += 10;
  });

  doc.save(nomeArquivo);
}

interface EntidadeComMetricas {
  alunos?: number;
  alunosAtivos?: number;
  desligados?: number;
  vagas?: number;
  taxaEvasao?: number;
  nivelAlerta?: string;
}

export interface AgregadoEntidades {
  total: number;
  totalAlunos: number;
  totalAlunosAtivos: number;
  totalDesligados: number;
  totalVagas: number;
  taxaEvasaoMedia: number | null;
  porAlerta: { verde: number; amarelo: number; vermelho: number };
}

export function calcularAgregadoEntidades(
  itens: EntidadeComMetricas[]
): AgregadoEntidades {
  const porAlerta = { verde: 0, amarelo: 0, vermelho: 0 };
  let totalAlunos = 0;
  let totalAlunosAtivos = 0;
  let totalDesligados = 0;
  let totalVagas = 0;
  let somaTaxaEvasao = 0;
  let countTaxaEvasao = 0;

  for (const item of itens) {
    totalAlunos += item.alunos ?? 0;
    totalAlunosAtivos += item.alunosAtivos ?? item.alunos ?? 0;
    totalDesligados += item.desligados ?? 0;
    totalVagas += item.vagas ?? 0;

    if (item.taxaEvasao !== undefined) {
      somaTaxaEvasao += item.taxaEvasao;
      countTaxaEvasao += 1;
    }

    if (item.nivelAlerta === "verde") porAlerta.verde += 1;
    else if (item.nivelAlerta === "amarelo") porAlerta.amarelo += 1;
    else if (item.nivelAlerta === "vermelho") porAlerta.vermelho += 1;
  }

  return {
    total: itens.length,
    totalAlunos,
    totalAlunosAtivos,
    totalDesligados,
    totalVagas,
    taxaEvasaoMedia:
      countTaxaEvasao > 0 ? somaTaxaEvasao / countTaxaEvasao : null,
    porAlerta,
  };
}

interface SupervisorComMetricas {
  alunos?: number;
  cidades?: string[];
  escolas?: string[];
  turmas?: string[];
  frequenciaMedia?: number;
}

export interface AgregadoSupervisores {
  total: number;
  totalAlunos: number;
  frequenciaMedia: number | null;
  cidadesAtendidas: number;
  escolasAtendidas: number;
  turmasAtendidas: number;
}

export function calcularAgregadoSupervisores(
  itens: SupervisorComMetricas[]
): AgregadoSupervisores {
  const cidades = new Set<string>();
  const escolas = new Set<string>();
  const turmas = new Set<string>();

  let totalAlunos = 0;
  let somaFrequencia = 0;
  let countFrequencia = 0;

  for (const item of itens) {
    totalAlunos += item.alunos ?? 0;

    item.cidades?.forEach((c) => cidades.add(c));
    item.escolas?.forEach((e) => escolas.add(e));
    item.turmas?.forEach((t) => turmas.add(t));

    if (item.frequenciaMedia !== undefined) {
      somaFrequencia += item.frequenciaMedia;
      countFrequencia += 1;
    }
  }

  return {
    total: itens.length,
    totalAlunos,
    frequenciaMedia:
      countFrequencia > 0 ? somaFrequencia / countFrequencia : null,
    cidadesAtendidas: cidades.size,
    escolasAtendidas: escolas.size,
    turmasAtendidas: turmas.size,
  };
}
