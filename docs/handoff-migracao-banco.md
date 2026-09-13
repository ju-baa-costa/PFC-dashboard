# Handoff — migração do PFC Dashboard para banco de dados

Documento de entrada para um novo chat de trabalho. Descreve o domínio ("mini
mundo"), o modelo de dados atual em Google Sheets, as regras de cálculo que
precisam sobreviver à migração, as armadilhas já descobertas na prática e as
decisões que ainda estão em aberto.

**Estado em 13/09/2026.** Repositório: `PFC-dashboard` (React + Vite + TS no
front, Google Apps Script como backend). Arquivo do backend:
`apps-script/Codigo.gs` (~2700 linhas, arquivo único).

---

## 1. O que é o sistema

Painel de acompanhamento do **Programa Futuro Cientista (PFC)**, programa de
extensão da UFSCar que acompanha estudantes de escola pública do 6º ano até o
ensino superior. O painel serve à coordenação e a parceiros: mostra, por cidade,
escola, turma e supervisor, quantos estudantes seguem no programa e onde a
evasão está alta.

Fluxo atual de ponta a ponta:

```
supervisores preenchem planilhas
   → abas "API_*" numa planilha central (algumas via IMPORTRANGE de outras planilhas)
      → Apps Script (doGet) lê tudo ao vivo e devolve um JSON
         → front React no GitHub Pages
      → Apps Script (gatilho diário) grava um snapshot em API_Historico
      → Apps Script (gatilho quinzenal) envia relatório por email
```

Não há banco de dados. A planilha **é** o banco.

---

## 2. Por que migrar — problemas reais, não hipotéticos

Em ordem de gravidade observada:

### 2.1 Leitura de dados a meio caminho do recálculo (causa da migração)

A `API_Alunos` depende de fórmulas/`IMPORTRANGE`. Quando o Apps Script lê a aba
enquanto ela ainda está recalculando, colunas voltam vazias ou com `#N/A` —
**sem nenhum erro**, apenas com valores errados.

Isso aconteceu de verdade em 12/09/2026, no primeiro snapshot: a coluna `nome`
já havia carregado, mas `situacao` não. O filtro de linhas inválidas só checa o
nome, então as linhas entraram; como nenhuma situação era `"desligado"`, os
desligados contaram **zero**, os ativos ficaram inflados e a evasão global foi
gravada como **0%** — "todas as vagas preenchidas". Os cards de escola, lidos
mais tarde com a planilha já carregada, mostravam valores normais.

Duas propriedades tornam isso perigoso:

- **Falha silenciosa.** Nenhuma exceção, nenhum log. Só um número plausível e
  errado.
- **Fica gravado.** O número da Home vem do último snapshot da `API_Historico`,
  não de um cálculo ao vivo. Uma leitura ruim vira um ponto permanente da série
  histórica.

O canário que detecta isso hoje é a coluna `outrasSituacoes` (ver §4.4): ela
deveria ser sempre 0 e só sai de zero quando a situação chega ilegível.

### 2.2 Não existe histórico nativo

A planilha guarda só o estado atual. Não há data de desligamento, então **não é
possível reconstruir o passado**. Foi preciso construir uma coleta por snapshot
diário (§4.4) que começou em **12/09/2026** — antes disso não existe série
temporal, e não existe forma de recuperá-la.

### 2.3 Identidade por string, sem chaves

Cidade, escola, supervisor e turma são identificados pelo texto digitado. Não há
IDs. Consequências já vistas no código: uma função `chaveComparacao()` que
normaliza caixa e acentos para que "São Roque" e "SAO ROQUE" não virem duas
cidades, e um mapa de capacidades indexado por nome de escola que falha
silenciosamente quando o nome não bate exatamente (§6.3).

### 2.4 Schema mutável por acidente

Inserir uma coluna no meio da planilha quebrava a leitura inteira. Aconteceu com
a coluna `Serie`, que entrou depois de `Supervisor` e deslocou `situacao`,
`presencas` e `faltas`. O relatório por email passou **meses** informando que
nenhuma escola estava em alerta. Corrigido lendo tudo por cabeçalho, mas a
fragilidade é estrutural: não existe schema declarado nem validação.

### 2.5 Limites operacionais do Apps Script

Execução de 6 minutos, cotas diárias, sem ambiente de teste separado, sem
controle de versão real (o código vive colado no editor do Google), e a
distinção confusa entre "código salvo" (o que os gatilhos executam) e "versão
implantada" (o que a API serve).

### 2.6 Sem validação de domínio

`situacao` é texto livre. Nada impede "Ativo ", "ATIVO", "ativo." ou um valor
novo inventado por quem preenche.

---

## 3. O mini mundo — entidades e regras de domínio

### Entidades

| entidade | descrição | identidade hoje |
|---|---|---|
| **Cidade** | município onde o programa atua | nome (texto) |
| **Escola** | unidade escolar; pertence a uma cidade | nome (texto) |
| **Turma** | grupo dentro de uma escola; hoje no máximo duas por escola (sufixo `-A`/`-B`) | código (texto) |
| **Supervisor** | responsável por acompanhar turmas/escolas | nome (texto) |
| **Aluno** | estudante do programa | nome (texto) |
| **Usuário** | quem faz login no painel | usuário (texto) |

### Relações

- Cidade 1—N Escola
- Escola 1—N Turma
- Turma 1—N Aluno
- Supervisor N—N Escola/Turma (hoje derivado: o supervisor é um campo do aluno)

### Atributos de aluno hoje

`nome`, `cidade`, `escola`, `turma`, `supervisor`, `serie` (ano escolar),
`situacao`, `presencas`, `faltas`, `aulasTotais`, `aulasPlanejadas`,
`dataEntrada`.

### Vocabulário controlado

- **`situacao`** — a coordenação afirma que só existem **`ativo`** e
  **`desligado`**. ⚠️ Mas o código do cursinho trata também `desistente`,
  `inativo`, `cancelado` e as flexões femininas (`desligada`, `cancelada`), o
  que sugere que **a aba do cursinho usa um vocabulário diferente** da
  `API_Alunos`. Isso precisa ser confirmado antes de virar um `ENUM`.
- **Nível de alerta** — `verde` / `amarelo` / `vermelho`, derivado, nunca
  digitado.

---

## 4. Fonte de dados atual

Quatro abas numa mesma planilha. Todas lidas **por nome de cabeçalho**, nunca
por posição (ver §6.1). Os nomes aceitos incluem sinônimos.

### 4.1 `API_Alunos` — a principal

| coluna | sinônimos aceitos | tipo |
|---|---|---|
| nome | aluno, nome do aluno | texto |
| cidade | municipio | texto |
| escola | unidade escolar | texto |
| turma | codigo da turma, cod turma | texto |
| supervisor | supervisora | texto |
| serie | ano, ano escolar, ano/serie, serie/ano | texto (ver §6.2) |
| situacao | status | texto |
| presencas | presenca | número |
| faltas | falta | número |
| aulas totais | aulas dadas, total de aulas | número |
| aulas planejadas | aulas previstas | número |
| data de entrada | data entrada, entrada | data |

Linhas cujo **nome** está vazio, `#N/A` ou `#ERROR!` são descartadas. **Nenhuma
outra coluna é validada** — é exatamente a brecha de §2.1.

### 4.2 `API_Cursinho` — importada de outra planilha

`nome`, `cidade`, `escola`, `serie`, `turma ifsp`, `turma etec`, `situacao`.
As colunas de turma são marcações booleanas em texto livre: valem como
verdadeiro `true`, `verdadeiro`, `sim`, `s`, `x`, `1`, `ok`.

Se a aba não existir, a API devolve `cursinho: null` — o front distingue "dado
indisponível" de "zero".

### 4.3 `API_Usuarios` — autenticação

`nome`, `usuario`, `senhaHash`, `papel` (`admin` ou `professor`), `turmas`.

O hash é gerado rodando `gerarHash("senha")` **à mão no editor** e colando o
resultado na planilha. Não existe tela de cadastro. O login devolve um token
HMAC assinado com validade de 30 dias; não há sessão no servidor. O papel
`professor` e a lista de turmas existem para uma funcionalidade de chamada
ainda não construída — hoje **qualquer login** libera os nomes dos alunos.

### 4.4 `API_Historico` — criada em 12/09/2026

Uma linha por dia, gravada por gatilho às ~3h. Colunas, nesta ordem:

`data` (texto `aaaa-mm-dd`), `alunos`, `ativos`, `ativosDeclarados`,
`desligados`, `outrasSituacoes`, `vagas`, `retencao`, `taxaEvasao`,
`escolasVermelhas`, `escolasAmarelas`, `escolasVerdes`.

Três observações que importam para a migração:

- `ativos` = `alunos − desligados` (base dos cards). `ativosDeclarados` =
  contagem de `situacao === "ativo"`. **Deveriam ser sempre iguais**;
  `outrasSituacoes` é a diferença e serve de canário.
- A escrita é **idempotente por dia**: reexecutar sobrescreve a linha em vez de
  duplicar, porque dia repetido entorta a regressão.
- **Esses dados não podem ser perdidos na migração** — não há backfill possível.

---

## 5. Regras de cálculo que precisam sobreviver

Todas em `apps-script/Codigo.gs`. Os números do painel, do email e do histórico
vêm das *mesmas* funções — ver §6.4.

### 5.1 Vagas ofertadas

```
vagas da escola = (nº de turmas distintas) × (capacidade da escola)
```

- **Turmas distintas**: `formatarNomeTurma()` — se o código termina em `-A` ou
  `-B`, conta como turma separada; **caso contrário todas colapsam em uma só**
  (§6.3).
- **Capacidade**: mapa `CAPACIDADE_ESCOLA` com **35 escolas** *hardcoded no
  código-fonte*, valores entre 10 e 20. Escola fora do mapa usa **15**. Isto é
  dado de negócio vivendo em código e deve virar tabela.

### 5.2 Evasão e retenção

```
ativos      = alunos cadastrados − desligados
taxaEvasao  = máx(0, (vagas − ativos) ÷ vagas × 100)     // 0 se vagas ≤ 0
retencao    = 100 − taxaEvasao
```

O piso em 0 significa que turma acima da capacidade aparece como 0% de evasão,
nunca negativa. **A evasão é medida contra a capacidade planejada, não contra os
matriculados** — uma vaga nunca preenchida pesa igual a um aluno que saiu.

### 5.3 Níveis de alerta

```
taxaEvasao > 40  → vermelho
taxaEvasao > 20  → amarelo
caso contrário   → verde
```

Aplicado a escolas, cidades e turmas. O resumo global usa outra base
(`desligados ÷ alunos`) com os mesmos limites — **inconsistência existente**,
vale unificar na migração.

### 5.4 Frequência

```
frequencia = presencas ÷ (presencas + faltas) × 100     // 0 se o total for 0
```
A frequência média da escola é a média simples das frequências dos alunos.

### 5.5 Comparativo quinzenal (o segundo número da Home)

```
melhora = (evasão média dos 15 dias anteriores − evasão média dos últimos 15 dias)
          ÷ evasão média dos 15 dias anteriores × 100
```

**Variação relativa, não pontos percentuais.** Positivo = evasão caiu. Exige ≥3
leituras em cada janela; evasão anterior igual a 0 não produz número (divisão
por zero) e a tela diz isso com palavras. Variação abaixo de 1% é "estável".

### 5.6 Cursinho

Elegíveis: alunos de **8º e 9º ano** que não estejam numa situação de saída.
Particiona em: só IFSP, só ETEC, ambos, sem turma — a soma bate com o total.

---

## 6. Armadilhas conhecidas — leia antes de escrever qualquer código

Estas custaram caro. Preserve as lições mesmo mudando a tecnologia.

### 6.1 Nunca ler coluna por posição
Custou meses de relatório errado (§2.4). No banco isso vira schema declarado —
mas o **ETL que importar da planilha** continua sujeito ao mesmo risco.

### 6.2 O ano escolar vem escrito de todo jeito
`"8"`, `"8o"`, `"8º ano"`, `"9ª serie"` e principalmente **junto do código da
turma** (`"6b"`, `"8a"`). A extração procura o número dentro do texto, com o
cuidado de não casar com o ano do calendário em `"2024 - 8A"`. Qualquer
normalização nova precisa passar por esses casos.

### 6.3 Duas fontes silenciosas de vagas subestimadas
- `formatarNomeTurma()` só reconhece o sufixo `-A`/`-B`. Outro padrão de código
  (`6A`, `Turma 1`) faz todas as turmas da escola virarem **uma**.
- `getCapacidadeTurma()` compara o nome da escola com `normalizarTexto()` (só
  `trim` e remoção de pontos finais), **não** com `chaveComparacao()` (que
  ignora caixa e acentos). Diferença de maiúscula, acento ou um typo — o mapa
  tem `"E.M. Franciso Mariano"`, provavelmente faltando o "c" de Francisco — cai
  no padrão 15 sem avisar.

Ambas reduzem o denominador e **baixam artificialmente a evasão**. No modelo
novo, turma e capacidade devem ser dados com identidade própria, não derivados
de parsing de string.

### 6.4 Um número, uma fonte
Regra estabelecida depois do bug de §2.4: **cada número é calculado por uma
única função**, consumida pelo painel, pelo email e pelo histórico. O front
**não** refaz contas — recebe pronto. Foi por isso que a matemática da tendência
ficou no backend mesmo sendo mais difícil de testar lá. **Manter essa regra.**

### 6.5 Datas como texto ISO
No histórico a data é gravada como texto `aaaa-mm-dd` de propósito: como data
"de verdade", o Sheets reinterpreta conforme a locale de quem abre. Cuidado
equivalente no banco: fuso horário é `America/Sao_Paulo`, e converter
`"2026-09-12"` com `new Date()` em JS resulta em meia-noite UTC, que no Brasil
volta um dia no calendário.

---

## 7. Contrato da API que o front consome

`GET` único, resposta JSON. Quebrar isso quebra o painel publicado.

```
{
  ultimaAtualizacao: ISO string,
  resumo:   { alunos, ativos, desligados, percentualDesligados, nivelAlerta,
              cidades, escolas, turmas, supervisores },
  cidades:  [ { nome, alunos, desligados, alunosAtivos, vagas, vagasDisponiveis,
                taxaEvasao, nivelAlerta, escolas[], frequenciaMedia, ... } ],
  escolas:  [ { nome, cidade, alunos, desligados, alunosAtivos, vagas,
                vagasDisponiveis, taxaEvasao, nivelAlerta, turmas[],
                supervisores[], frequenciaMedia } ],
  turmas:   [ ... ],   // inclui alunosLista SOMENTE com token válido
  supervisores: [ ... ],
  cursinho: { ... } | null,
  historico: [ ...pontos ] | null,          // null = coleta não ligada
  tendencia: { ... } | null,
  comparativoQuinzenal: { ... } | null
}
```

Também existe `GET ?action=login&usuario=&senha=` → `{ token, nome, papel,
turmas }`. É `GET` e não `POST` por um motivo específico: respostas de `doPost`
do Apps Script não trazem cabeçalho CORS em chamada cross-origin, e o navegador
bloqueia antes de ler a resposta. **Num backend próprio isso deixa de ser
necessário — login deve virar `POST`.**

Convenção importante: `null` significa "dado indisponível" e `0` significa
"zero de verdade". O front depende disso para não mostrar zero como se fosse
medição.

---

## 8. Requisitos para o sistema novo

### Obrigatórios

1. **Leitura consistente.** Nunca calcular sobre um estado parcial. É a razão
   de existir desta migração.
2. **Preservar a `API_Historico`.** Migrar as linhas existentes; não há backfill
   possível.
3. **Manter o contrato da §7** ou versionar a API e atualizar o front junto.
4. **Uma fonte por número** (§6.4).
5. **Capacidade como dado**, não constante em código.
6. **`situacao` como enum validado**, resolvendo antes a dúvida da §3.
7. **IDs estáveis** para cidade, escola, turma, supervisor e aluno.
8. **Idempotência do snapshot diário** (um por dia, reexecutar corrige).

### Desejáveis

9. Histórico com granularidade de aluno (data de desligamento!), o que tornaria
   a série reconstruível em vez de dependente de snapshot.
10. Auditoria: quem mudou o quê e quando.
11. Autenticação de verdade (hash gerado pelo sistema, não colado à mão).
12. Ambiente de teste separado da produção.

---

## 9. Esboço de modelo relacional

Ponto de partida para discussão, não decisão fechada:

```
cidades(id, nome, criado_em)
escolas(id, cidade_id, nome, capacidade_turma, ativa, criado_em)
turmas(id, escola_id, codigo, rotulo, capacidade, ano_letivo)
supervisores(id, nome, email)
supervisores_turmas(supervisor_id, turma_id)          -- N—N explícito

alunos(id, nome, data_nascimento?, criado_em)
matriculas(id, aluno_id, turma_id, serie, data_entrada,
           situacao ENUM('ativo','desligado'),
           data_desligamento, motivo_desligamento)     -- resolve §2.2 e §8.9

frequencias(id, matricula_id, presencas, faltas, aulas_totais,
            aulas_planejadas, referencia)

cursinho(matricula_id, ifsp BOOL, etec BOOL)

snapshots(data PK, alunos, ativos, desligados, vagas, retencao, taxa_evasao,
          escolas_vermelhas, escolas_amarelas, escolas_verdes, gerado_em)

usuarios(id, nome, usuario UNIQUE, senha_hash, papel, criado_em)
```

A ideia central é **`matriculas`**: separar o aluno (pessoa) do seu vínculo com
uma turma (com início, fim e motivo). Só isso já resolve a falta de histórico —
a evasão de qualquer data passada vira uma consulta, não um snapshot.

---

## 10. Decisões em aberto — precisam da coordenação

1. **De onde vêm os dados depois da migração?** Os supervisores continuam
   preenchendo planilhas (e o sistema importa), ou passa a existir uma interface
   de entrada? Esta é a decisão que mais muda o escopo.
2. **Onde hospedar?** Hoje o front é estático no GitHub Pages e o backend é
   grátis no Apps Script. Um banco implica servidor e custo — quem paga e quem
   mantém, considerando que é um programa de extensão universitária?
3. **Confirmar o vocabulário de `situacao`** (§3) antes de fechar o enum.
4. **Unificar a base do alerta global** (§5.3) ou manter a inconsistência?
5. **Capacidade por turma ou por escola?** O modelo atual assume que todas as
   turmas de uma escola têm a mesma capacidade.
6. **O que fazer com as turmas fora do padrão `-A`/`-B`** (§6.3) ao migrar.
7. **Ano letivo.** Nada hoje é versionado por ano. Como tratar a virada de 2026
   para 2027 — os mesmos alunos, turmas novas?

---

## 11. Primeiros passos sugeridos para o novo chat

1. Rodar `diagnosticarVagas()` no Apps Script (função já existe) e ler o
   resultado: confirma se há turmas colapsando ou capacidades caindo no padrão,
   antes de modelar qualquer coisa.
2. Exportar as quatro abas como CSV — é o dataset real de partida.
3. Resolver as decisões 1 e 2 da §10 com a coordenação. Sem elas, qualquer
   modelagem é especulação.
4. Só então modelar, migrar e reescrever a API mantendo o contrato da §7.
