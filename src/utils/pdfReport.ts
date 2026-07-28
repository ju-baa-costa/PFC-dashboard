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

export interface SecaoRelatorio {
  titulo: string;
  itens: ItemRelatorio[];
}

const MARGEM_INFERIOR = 280;

export function gerarRelatorioDetalhadoPDF(
  titulo: string,
  secoes: SecaoRelatorio[],
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

  secoes.forEach((secao) => {
    if (y > MARGEM_INFERIOR) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(14);
    doc.text(secao.titulo, 14, y);
    y += 8;

    doc.setFontSize(11);
    secao.itens.forEach((item) => {
      if (y > MARGEM_INFERIOR) {
        doc.addPage();
        y = 20;
      }

      doc.text(`${item.label}:`, 20, y);
      doc.text(String(item.valor), 120, y);
      y += 7;
    });

    y += 8;
  });

  doc.save(nomeArquivo);
}

interface EntidadeComMetricas {
  nome?: string;
  cidade?: string;
  escola?: string;
  alunos?: number;
  alunosAtivos?: number;
  desligados?: number;
  vagas?: number;
  vagasDisponiveis?: number;
  taxaEvasao?: number;
  nivelAlerta?: string;
}

export interface OpcoesSecoesEntidades {
  mostrarDesligados?: boolean;
}

export function formatarVagasDisponiveis(vagasDisponiveis: number): string {
  if (vagasDisponiveis >= 0) return String(vagasDisponiveis);

  const excedente = Math.abs(vagasDisponiveis);

  return `0 (lotado: ${excedente} aluno${
    excedente > 1 ? "s" : ""
  } acima das vagas)`;
}

export function montarSecoesEntidades(
  itens: EntidadeComMetricas[],
  { mostrarDesligados = true }: OpcoesSecoesEntidades = {}
): SecaoRelatorio[] {
  return [...itens]
    .sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR"))
    .map((item) => {
      const linhas: ItemRelatorio[] = [];

      if (item.cidade) linhas.push({ label: "Cidade", valor: item.cidade });
      if (item.escola) linhas.push({ label: "Escola", valor: item.escola });

      if (item.alunosAtivos !== undefined) {
        linhas.push({ label: "Alunos ativos", valor: item.alunosAtivos });
      }

      if (mostrarDesligados && item.desligados !== undefined) {
        linhas.push({ label: "Alunos desligados", valor: item.desligados });
      }

      if (item.vagas !== undefined) {
        linhas.push({ label: "Vagas ofertadas", valor: item.vagas });
      }

      if (item.vagasDisponiveis !== undefined) {
        linhas.push({
          label: "Vagas disponíveis",
          valor: formatarVagasDisponiveis(item.vagasDisponiveis),
        });
      }

      if (item.taxaEvasao !== undefined) {
        linhas.push({
          label: "Taxa de evasão",
          valor: `${item.taxaEvasao}%`,
        });
      }

      if (item.nivelAlerta) {
        linhas.push({ label: "Nível de alerta", valor: item.nivelAlerta });
      }

      return { titulo: item.nome ?? "Sem nome", itens: linhas };
    });
}

export interface AgregadoEntidades {
  total: number;
  totalAlunos: number;
  totalAlunosAtivos: number;
  totalDesligados: number;
  totalVagas: number;
  totalVagasDisponiveis: number | null;
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
  let totalVagasDisponiveis = 0;
  let countVagasDisponiveis = 0;
  let somaTaxaEvasao = 0;
  let countTaxaEvasao = 0;

  for (const item of itens) {
    totalAlunos += item.alunos ?? 0;
    totalAlunosAtivos += item.alunosAtivos ?? item.alunos ?? 0;
    totalDesligados += item.desligados ?? 0;
    totalVagas += item.vagas ?? 0;

    if (item.vagasDisponiveis !== undefined) {
      // Entidades lotadas entram como zero para nao mascarar as vagas que
      // realmente sobram nas outras.
      totalVagasDisponiveis += Math.max(0, item.vagasDisponiveis);
      countVagasDisponiveis += 1;
    }

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
    totalVagasDisponiveis:
      countVagasDisponiveis > 0 ? totalVagasDisponiveis : null,
    taxaEvasaoMedia:
      countTaxaEvasao > 0 ? somaTaxaEvasao / countTaxaEvasao : null,
    porAlerta,
  };
}

interface SupervisorComMetricas {
  nome?: string;
  alunos?: number;
  cidades?: string[];
  escolas?: string[];
  turmas?: string[];
  frequenciaMedia?: number;
}

export function montarSecoesSupervisores(
  itens: SupervisorComMetricas[]
): SecaoRelatorio[] {
  return [...itens]
    .sort((a, b) => (a.nome ?? "").localeCompare(b.nome ?? "", "pt-BR"))
    .map((item) => {
      const linhas: ItemRelatorio[] = [
        { label: "Alunos", valor: item.alunos ?? 0 },
      ];

      if (item.cidades?.length) {
        linhas.push({ label: "Cidade(s)", valor: item.cidades.join(", ") });
      }

      if (item.escolas?.length) {
        linhas.push({ label: "Escolas", valor: item.escolas.join(", ") });
      }

      if (item.turmas?.length) {
        linhas.push({ label: "Turmas", valor: item.turmas.join(", ") });
      }

      if (item.frequenciaMedia !== undefined) {
        linhas.push({
          label: "Frequência média",
          valor: `${item.frequenciaMedia.toFixed(1)}%`,
        });
      }

      return { titulo: item.nome ?? "Sem nome", itens: linhas };
    });
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
