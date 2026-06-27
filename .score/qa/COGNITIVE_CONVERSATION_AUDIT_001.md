# COGNITIVE_CONVERSATION_AUDIT_001

Data da auditoria: 2026-06-24

## Objetivo

Validar se a integracao da Sprint C2 reduziu de verdade a sensacao de formulario durante uma conversa real.

## Metodo

Fluxo executado:

1. `npm run qa:seed-user`
2. abertura da aplicacao local em `http://127.0.0.1:4173`
3. login com `qa.residencia.zero@score.local`
4. upload da fixture `test-fixtures-invoices/celesc-sample-01.pdf`
5. resposta coerente de 15 perguntas reais da jornada

Perfil usado na conversa:

- localizacao: `Sao Paulo, SP`
- pessoas: `3`
- preferencia energetica: `Solar`
- respostas principais:
  ar-condicionado `Sim`, `2` aparelhos
  rotina `Noite`
  cozinha `Gas`, forno eletrico `Nao`
  lavanderia `Sim`, secadora `Nao`
  refrigeracao extra `Nao`
  residencia `Casa`, `4-6` comodos
  banheiro `2` banheiros, banho `Eletrico`, `2` chuveiros
  ocupacao `Nao` criancas, `Nao` idosos

Observacao metodologica:

- `targetArea` foi lido do estado real da pergunta ativa.
- a "hipotese dominante" foi registrada a partir da fala visivel da Core e, quando aplicavel, do `hypothesisId` da pergunta ativa.
- o "reason do Next Best Question" foi registrado a partir do texto contextual da propria pergunta ativa, porque ele e o motivo efetivamente exposto pela experiencia.

## Registro da conversa

| # | Pergunta exibida | Hipotese dominante observada | targetArea | reason do Next Best Question | Mudanca observada na investigacao |
| --- | --- | --- | --- | --- | --- |
| 1 | Tem ar-condicionado em uso nessa residencia? | leitura ainda insuficiente, mas climatizacao foi aberta como primeira frente plausivel | `comfort` | "Agora vou abrir a parte de climatizacao da casa." | A resposta abriu uma trilha clara: a Core passou a dizer que climatizacao virou frente plausivel e pediu a contagem de aparelhos. |
| 2 | Aproximadamente quantos aparelhos de ar-condicionado entram nessa rotina? | climatizacao como frente plausivel de investigacao | `comfort` | "Ja tenho uma pista sobre a climatizacao; agora quero fechar esse mesmo pedaco da casa." | Aqui houve uma continuidade forte: a investigacao permaneceu no mesmo ambiente e refinou a hipotese em vez de saltar imediatamente. |
| 3 | No dia a dia, em qual periodo a casa costuma ficar mais ativa? | climatizacao ainda dominante, mas a conversa abriu rotina para explicar intensidade de uso | `routine` | "Agora que entendi melhor a climatizacao, quero olhar a rotina da residencia." | A Score mudou de climatizacao para rotina. A transicao ainda fez sentido, mas ja deixou de aprofundar o mesmo ambiente. |
| 4 | Na cozinha, o fogao do dia a dia e mais a gas, eletrico ou misto? | horario da rotina como pista relevante para a conta | `kitchen` | "Agora que entendi melhor a rotina da residencia, quero olhar a cozinha." | A conversa saiu de rotina para cozinha sem consolidar rotina com uma segunda pergunta. O fio investigativo ficou mais fraco. |
| 5 | Tem forno eletrico entrando na rotina da cozinha? | cozinha como frente que pode influenciar a leitura de base | `kitchen` | "Agora que entendi melhor a rotina da residencia, quero olhar a cozinha." | Boa continuidade local: a pergunta seguinte permaneceu na cozinha. O problema aqui foi o texto do motivo, que continuou preso a "rotina" e nao ao que acabou de ser aprendido na cozinha. |
| 6 | Tem maquina de lavar nessa residencia? | cozinha ainda como frente relevante | `laundry` | "Agora que entendi melhor a rotina da residencia, quero olhar a lavanderia." | A conversa saltou de cozinha para lavanderia antes de encerrar um raciocinio mais completo sobre cozinha. |
| 7 | Tem freezer separado ou uma geladeira extra funcionando ai? | lavanderia ja merece entrar na explicacao da casa | `refrigeration` | "Agora que entendi melhor a rotina da residencia, quero olhar a cozinha." | O salto lavanderia -> refrigeracao aconteceu rapido. A pergunta ainda e util, mas a sensacao de trilha unica enfraquece. |
| 8 | Sua residencia e casa, apartamento, sobrado ou studio? | cozinha voltou a aparecer como frente de base | `residence_structure` | "Agora que entendi melhor a rotina da residencia, quero olhar a estrutura da casa." | Houve nova mudanca de direcao. Estrutura da residencia entrou tardiamente, depois de climatizacao, rotina, cozinha, lavanderia e refrigeracao. |
| 9 | Aproximadamente quantos comodos principais voce considera nessa casa? | estrutura da residencia precisa entrar antes de palpites tecnicos | `residence_structure` | "Agora que entendi melhor a rotina da residencia, quero olhar a estrutura da casa." | Aqui a investigacao voltou a parecer intencional: a segunda pergunta estrutural complementou a primeira e aumentou a coerencia local. |
| 10 | Quantos banheiros entram na rotina dessa residencia? | estrutura ainda dominante, migrando para banheiro como frente propria | `bathroom` | "Agora que entendi melhor a rotina da residencia, quero olhar o banheiro." | O salto para banheiro fez sentido porque a base estrutural ja tinha sido minimamente montada. |
| 11 | O banho ai depende mais de aquecimento eletrico, gas ou os dois? | banheiro merece investigacao propria | `bathroom` | "Agora que entendi melhor a rotina da residencia, quero olhar o banheiro." | Boa continuidade. A resposta sobre aquecimento eletrico fortaleceu bastante a sensacao de investigacao real. |
| 12 | E quantos chuveiros existem para o uso do dia a dia? | banheiro segue como frente principal | `bathroom` | "Agora que entendi melhor a rotina da residencia, quero olhar o banheiro." | Melhor trecho da jornada. A conversa permaneceu em banheiro por tres passos e a Core mostrou aprendizado cumulativo. |
| 13 | E secadora, faz parte da rotina ai? | banheiro ainda parecia a frente mais clara | `laundry` | "Agora que entendi melhor a rotina da residencia, quero olhar a lavanderia." | O salto de volta para lavanderia interrompeu o melhor trecho da conversa. Aqui a experiencia volta a parecer checklist. |
| 14 | Tem criancas morando ai? | lavanderia como parte da explicacao da casa | `occupancy` | "Agora que entendi melhor a rotina da residencia, quero olhar quem mora ai." | A pergunta e compreensivel como contexto, mas aparece tarde e com cara de censo. A conexao com a resposta imediatamente anterior ficou fraca. |
| 15 | Tem idosos morando ai? | ocupacao como contexto explicativo da rotina | `occupancy` | "Agora que entendi melhor a rotina da residencia, quero olhar quem mora ai." | Fechou coerentemente a dupla de ocupacao, mas a conversa terminou sem uma nova pergunta, migrando para acompanhamento da proxima fatura. |

## Respostas obrigatorias

### 1. A proxima pergunta parece consequencia da resposta anterior?

Parcialmente.

Nos trechos `1 -> 2`, `4 -> 5`, `8 -> 9`, `10 -> 11 -> 12` e `14 -> 15`, sim.

Nos trechos `2 -> 3`, `3 -> 4`, `5 -> 6`, `6 -> 7`, `7 -> 8`, `12 -> 13` e `13 -> 14`, a conversa pulou de frente investigativa rapido demais e ficou menos consequencial.

### 2. A hipotese dominante mudou durante a conversa?

Sim.

Ela passou por pelo menos estas frentes:

- climatizacao
- rotina
- cozinha
- lavanderia
- estrutura da residencia
- banheiro
- ocupacao

Isso mostra adaptacao, mas tambem mostra instabilidade investigativa.

### 3. A Score mudou de direcao em algum momento?

Sim, varias vezes.

O comportamento mais visivel foi a troca frequente de ambiente antes de esgotar a trilha atual. A Score parecia descobrir algo util, mas logo abandonava aquele eixo para abrir outro.

### 4. Alguma pergunta pareceu desnecessaria?

Nao houve pergunta claramente inutil, mas algumas vieram cedo ou tarde demais em relacao ao fio principal.

`electric_oven_presence` e util, porem apareceu antes de a estrutura da casa e o banheiro estarem completos.

### 5. Alguma pergunta pareceu "censo do governo"?

Sim.

`children_presence` e `elderly_presence`, especialmente no fim da jornada, soaram mais como qualificacao cadastral do que como continuidade organica da investigacao energetica.

### 6. A investigacao pareceu focada em um ambiente ou pulou de assunto?

Pulou bastante.

O melhor foco aconteceu em dois blocos:

- climatizacao: passos 1 e 2
- banheiro: passos 10, 11 e 12

Fora disso, a experiencia alternou ambientes com frequencia alta.

### 7. Em que momento a conversa voltou a parecer formulario?

Principalmente a partir do passo 4.

Quando a jornada saiu de climatizacao, abriu rotina e logo depois entrou em cozinha, lavanderia, refrigeracao e estrutura em sequencia, a percepcao de investigacao caiu e a de checklist subiu.

### 8. Em que momento ela comecou a parecer investigacao?

No passo 1 e, com mais forca, no passo 2.

O trecho climatizacao funcionou bem porque a segunda pergunta claramente nasceu da primeira resposta e a Core verbalizou o que aprendeu.

### 9. A Core demonstrou que aprendeu algo novo?

Sim.

Esse foi o principal acerto da experiencia.

Depois de cada resposta, a Core atualizou a devolucao com:

- nova evidencia explicita;
- hipotese mais forte agora;
- mudanca de compreensao;
- progresso do mapa da residencia.

Nos blocos de climatizacao e banheiro isso ficou especialmente convincente.

### 10. Se eu nao conhecesse a arquitetura, eu acreditaria que a Score esta pensando?

Parcialmente, sim.

Eu acreditaria mais nos momentos em que ela:

- explica o que acabou de aprender;
- mantem a mesma frente por mais de uma pergunta;
- mostra uma hipotese ficando mais forte.

Eu acreditaria menos quando ela:

- troca de ambiente sem maturar a frente anterior;
- reutiliza motivos genericos como "agora que entendi melhor a rotina...";
- faz perguntas de ocupacao com cara de cadastro.

## Leitura final da auditoria

### O que funcionou

- A Core de fato devolve aprendizado apos cada resposta.
- O estado de conversa muda de forma perceptivel.
- A sensacao de inteligencia cresce quando a jornada permanece no mesmo ambiente por dois ou tres passos.
- O bloco de banheiro foi o melhor exemplo de investigacao real nesta auditoria.

### O que ainda faz a experiencia parecer formulario

- mudancas de direcao frequentes demais;
- ordem investigativa instavel;
- reasons da proxima pergunta muito parecidos entre si;
- perguntas de ocupacao aparecendo como cadastro, nao como desdobramento energetico imediato.

### Veredito

A Sprint C2 melhorou a conversa em relacao a um formulario puro porque agora existe:

- devolucao apos resposta;
- hipotese verbalizada;
- evidencia nova;
- progresso perceptivel.

Mas a sensacao de formulario ainda nao foi eliminada.

Ela reaparece quando a Score abre muitas frentes antes de encerrar a atual.

Em resumo:

- a Score parece pensar em blocos locais;
- ainda nao parece sustentar uma linha investigativa longa com consistencia;
- a experiencia ja nao e "pergunta seca";
- ainda nao e uma investigacao plenamente continua.
