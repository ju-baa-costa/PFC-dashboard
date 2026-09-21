interface Props {
    title: string;
    value: number | string;
    hint?: string;
    onClick?: () => void;
    // Definido (true ou false) so nos cards que sao botao de escolha, como os
    // de serie do Projeto de Vida: e o que faz o card virar um controle
    // acessivel em vez de um numero que por acaso responde ao clique.
    selecionado?: boolean;
  }

  export default function SummaryCard({
    title,
    value,
    hint,
    onClick,
    selecionado
  }: Props) {
    const ehEscolha = selecionado !== undefined;

    const classes = [
      "summary-card",
      onClick ? "" : "summary-card-static",
      selecionado ? "summary-card-selecionado" : ""
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        className={classes}
        onClick={onClick}
        role={ehEscolha ? "button" : undefined}
        // O conteudo e um h3 com o rotulo e um h2 com o numero; sem rotular o
        // botao, o leitor de tela anuncia so "botao" e a escolha de serie
        // fica sem nome.
        aria-label={ehEscolha ? `${title}: ${value}` : undefined}
        aria-pressed={ehEscolha ? selecionado : undefined}
        tabIndex={ehEscolha ? 0 : undefined}
        // Sem isto o card so responde ao mouse. Enquanto era um atalho para
        // outra pagina dava para viver com isso; como seletor do que a tabela
        // mostra, nao da.
        onKeyDown={
          ehEscolha && onClick
            ? evento => {
                if (evento.key === "Enter" || evento.key === " ") {
                  evento.preventDefault();
                  onClick();
                }
              }
            : undefined
        }
      >
        <h3>{title}</h3>
        <h2>{value}</h2>

        {hint && (
          <p className="summary-card-hint">
            {hint}
          </p>
        )}
      </div>
    );
  }
