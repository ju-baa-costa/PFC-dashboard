// TEMPORARIO - enquanto a coluna de série não estiver toda preenchida.
//
// Alunos ativos sem série ficam de fora da conta de "ainda podem entrar" sem
// aparecer em lugar nenhum. Este aviso existe só para dar visibilidade a isso
// e some sozinho quando o contador chega a zero.
//
// Para remover quando a planilha estiver completa: apague este arquivo, o
// import e a linha <AvisoSemSerie /> na página do Cursinho, e a função
// montarDiagnosticoCursinho do Apps Script.

interface Diagnostico {
  alunosSemSerie: number;
  cidades: { nome: string; alunos: number }[];
}

interface Props {
  diagnostico?: Diagnostico | null;
}

export default function AvisoSemSerie({ diagnostico }: Props) {
  if (!diagnostico || diagnostico.alunosSemSerie === 0) {
    return null;
  }

  const { alunosSemSerie, cidades } = diagnostico;

  return (
    <div className="section-card">
      <h3>Alunos sem série informada</h3>

      <p className="section-card-legenda">
        {alunosSemSerie}{" "}
        {alunosSemSerie === 1 ? "aluno ativo está" : "alunos ativos estão"}{" "}
        sem série na planilha, então {alunosSemSerie === 1 ? "ele" : "eles"}{" "}
        {alunosSemSerie === 1 ? "não é contado" : "não são contados"} em
        "ainda podem entrar".
      </p>

      {cidades.length > 0 && (
        <ul className="ranking-list">
          {cidades.map((cidade) => (
            <li className="ranking-row" key={cidade.nome}>
              <span className="ranking-nome">{cidade.nome}</span>

              <span className="ranking-valor">
                {cidade.alunos}{" "}
                {cidade.alunos === 1 ? "aluno" : "alunos"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
