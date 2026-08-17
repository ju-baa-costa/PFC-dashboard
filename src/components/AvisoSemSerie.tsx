import SummaryCard from "./SummaryCard";

// TEMPORARIO - enquanto a coluna de série não estiver toda preenchida.
//
// Alunos ativos sem série ficam de fora da conta de "ainda podem entrar" sem
// aparecer em lugar nenhum. Este card existe só para dar visibilidade a isso
// e some sozinho quando o contador chega a zero.
//
// Para remover quando a planilha estiver completa: apague este arquivo, o
// import e a linha <AvisoSemSerie /> na página do Cursinho, e a função
// montarDiagnosticoCursinho do Apps Script.

interface Props {
  diagnostico?: { alunosSemSerie: number } | null;
}

export default function AvisoSemSerie({ diagnostico }: Props) {
  if (!diagnostico || diagnostico.alunosSemSerie === 0) {
    return null;
  }

  return (
    <SummaryCard
      title="Sem série informada"
      value={diagnostico.alunosSemSerie}
    />
  );
}
