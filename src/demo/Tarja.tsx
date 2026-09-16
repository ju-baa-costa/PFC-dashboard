import { MODO_DEMO } from "./modo";

// A tarja nao e enfeite: sem ela um print da tela de demonstracao passa por
// numero real numa reuniao. Ela fica no topo de toda pagina enquanto o modo
// estiver ligado, e some sozinha quando ele esta desligado.
const DESCRICAO: Record<string, string> = {
  completo: "dados completos",
  "sem-serie": "planilha sem a coluna de série",
  "api-antiga": "API publicada sem o Projeto de Vida",
};

export default function Tarja() {
  if (!MODO_DEMO) return null;

  return (
    <div className="demo-tarja">
      <strong>Dados de demonstração</strong> — nada nesta tela é real
      ({DESCRICAO[MODO_DEMO]}).
    </div>
  );
}
