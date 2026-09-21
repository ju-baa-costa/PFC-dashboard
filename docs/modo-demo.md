# Modo de demonstração

Serve para ver a interface de uma funcionalidade nova sem depender do Apps
Script publicado, sem copiar a planilha e sem nome de aluno de verdade na tela
de quem está desenvolvendo.

A branch `staging` existe para isso: funcionalidade nova entra nela, roda com
dados artificiais e só depois vai para `main`.

## Como rodar

```bash
VITE_MODO_DEMO=1 npm run dev
```

Não precisa de `VITE_API_URL`: nada é buscado na rede.

| valor | o que simula |
|---|---|
| `1` | dados completos |
| `sem-serie` | planilha sem a coluna de série (`projetoDeVida` volta `null`) |
| `api-antiga` | Apps Script publicado antes do Projeto de Vida existir |
| `sem-oitavo` | Apps Script publicado antes do 8º ano entrar na tela (a página mostra só o 9º) |

## Login

Qualquer senha entra. O usuário escolhe o papel:

- `professor` — conta sem acesso à lista nominal
- qualquer outro — entra como **admin**

É o jeito de ver as duas versões da tela sem manter dois cadastros de mentira.

## O que os dados cobrem

- alerta verde, amarelo e vermelho nos cards de cidade, escola e turma
- turma lotada (mais alunos ativos do que vagas)
- escolas homônimas em cidades diferentes
- supervisores nas três faixas de frequência
- cidade com um único aluno no 9º ano, para conferir o singular na tela
- cidade que só existe numa das séries (Votorantim não tem 8º ano), para
  conferir que os chips trocam junto com o card de série
- nomes acentuados, para conferir a ordem alfabética
- alunos ativos sem série, que ficam de fora das contas das duas séries

Os números fecham entre si: as turmas somam as escolas, que somam as cidades,
que somam o resumo. Dado de mentira que não fecha vira caça a bug inexistente
na primeira vez que alguém conferir a conta na tela.

## Por que a tarja

Enquanto o modo está ligado, toda página mostra uma tarja dizendo que nada ali
é real. Sem ela, um print da tela de demonstração passa por número de verdade
numa reunião — o mesmo tipo de erro silencioso que o resto do projeto já pagou
caro para evitar.

## Produção

Fica desligado a menos que alguém peça. O `deploy.yml` não define
`VITE_MODO_DEMO`, então o site publicado nunca cai nesse caminho.
