# SILENCE_AUDIT_001

## Escopo

Auditoria completa da superficie visivel da Score com base exclusiva em:

- OPERATION_SILENCE.md
- DESIGN_PRINCIPLES.md
- PRODUCT_PHILOSOPHY.md
- VOICE.md

Estados e artefatos auditados:

- Hero ready
- estados pre-ready
- estados pos-resposta
- detalhamento
- cards
- labels
- CTAs
- toast
- header
- footer
- mobile
- desktop
- screenshots em `.score/reviews/latest/screenshots/*`
- screenshots em `qa-artifacts/journey-qa/*`

Arquivos inspecionados para localizar a origem das violacoes:

- `src/pages/Index.tsx`
- `src/pages/LandingPage.tsx`
- `src/pages/Login.tsx`
- `src/components/nucleo/CorePresence.tsx`
- `src/components/nucleo/GuidedConversationSession.tsx`
- `src/components/InvoiceUpload.tsx`
- `src/components/Header.tsx`
- `src/components/Footer.tsx`
- `src/components/DynamicContextPanel.tsx`
- `src/components/dynamic-context/DynamicContextSummaryView.tsx`
- `src/components/dynamic-context/DynamicContextActionsView.tsx`
- `src/components/dynamic-context/DynamicContextProfileView.tsx`
- `src/components/dynamic-context/DynamicContextHistoryView.tsx`
- `src/components/auth/AuthShell.tsx`

## Resumo executivo

Total de violacoes encontradas: **24**

- Severidade alta: **15**
- Severidade media: **9**
- Severidade baixa: **0**

Diagnostico geral:

A Score ja tem uma leitura central mais forte do que antes, mas a superficie ainda carrega ruido metodologico, linguagem de sistema e estrutura de painel. A maior parte das violacoes nao esta no calculo nem na arquitetura cognitiva. Ela esta na camada visivel que ainda tenta mostrar bastidores, lacunas e taxonomias internas ao mesmo tempo em que tenta revelar a conta.

---

## Categoria 1 — Ruido visual na Hero

### 1. Bloco "Ainda nao explicado" ainda ocupa a Hero

Arquivo: `src/components/nucleo/CorePresence.tsx`  
Componente: `CorePresence`  
Trecho: `"Ainda nao explicado"` com percentual residual na area principal  
Principio violado: Operacao Silencio item 5; a Score nao deve mostrar lacuna nem percentual de falta  
Severidade: Alta  
Correcao sugerida: remover completamente o bloco residual da Hero; se a lacuna precisar existir, esconder em detalhe sob demanda sem percentual dominante  
Impacto esperado: a Hero deixa de abrir com inseguranca e volta a parecer leitura, nao contabilidade de incerteza

### 2. Valores monetarios e percentuais por categoria continuam na visao principal

Arquivo: `src/components/nucleo/CorePresence.tsx`  
Componente: `CorePresence`  
Trecho: sinais como `"≈ 1.6%"`, `"≈ R$ 7.79"` e similares na Hero  
Principio violado: Operacao Silencio item 5; remover simbolos aproximativos e valores por categoria da visao principal  
Severidade: Alta  
Correcao sugerida: manter na Hero apenas descoberta, significado e acao; empurrar numeros secundarios para detalhe opcional  
Impacto esperado: a leitura fica mais intuitiva e menos parecida com mini-relatorio tecnico

### 3. "Outros sinais desta conta" compete com a descoberta principal

Arquivo: `src/components/nucleo/CorePresence.tsx`  
Componente: `CorePresence`  
Trecho: secao `"Outros sinais desta conta"` abaixo da descoberta principal  
Principio violado: uma descoberta por vez; a tela principal nao deve virar lista de sinais  
Severidade: Alta  
Correcao sugerida: transformar esses sinais em aprofundamento opcional ou eliminar os redundantes  
Impacto esperado: a Hero volta a ter protagonista unico e reduz a sensacao de painel

### 4. Badges, pills e labels em caps lock ainda poluem o foco principal

Arquivo: `src/components/nucleo/CorePresence.tsx`; `src/components/nucleo/GuidedConversationSession.tsx`  
Componente: `CorePresence`; `GuidedConversationSession`  
Trecho: `"Core"`, `"Conta em foco: ..."`, `"VALOR DA CONTA"`, `"CONSUMO"`, `"O QUE FAZER AGORA"`  
Principio violado: visual silence; labels em caps lock e badges nao podem disputar atencao com a leitura  
Severidade: Media  
Correcao sugerida: remover badge de identidade interna e suavizar ou eliminar labels de secao na Hero  
Impacto esperado: a abertura fica mais silenciosa e mais proxima de produto de consumo diario

---

## Categoria 2 — Linguagem de sistema

### 5. Header ainda apresenta "Nucleo energetico" e navega por termos internos

Arquivo: `src/components/Header.tsx`  
Componente: `Header`  
Trecho: `"Nucleo energetico"`, `"Nucleo"`, `"Ranking"`, `"Assistente"`  
Principio violado: o app nao deve expor arquitetura nem parecer suite de modulos internos  
Severidade: Media  
Correcao sugerida: simplificar a taxonomia visivel e substituir linguagem interna por nomes de valor ao usuario  
Impacto esperado: reduz imediatamente a sensacao de sistema e melhora compreensao da navegacao

### 6. Footer ainda fala como manifesto de subsistemas

Arquivo: `src/components/Footer.tsx`  
Componente: `Footer`  
Trecho: `"Score mede evolucao. Diagnostico entende consumo. Memoria lembra quem voce e. Mascote ensina."`  
Principio violado: Voice; evitar frase inflada, termos abstratos e exposicao da maquina  
Severidade: Alta  
Correcao sugerida: reduzir para uma linha curta de valor real ou remover completamente esse bloco  
Impacto esperado: elimina um dos vazamentos mais claros de linguagem institucional e de sistema

### 7. Login e shell de autenticacao ainda falam em "Nucleo", "Memoria" e "Conhecimento"

Arquivo: `src/pages/Login.tsx`; `src/components/auth/AuthShell.tsx`  
Componente: `Login`; `AuthShell`  
Trecho: `"Entre no Nucleo da sua jornada."`, `"Memoria"`, `"Conhecimento"`, `"jornada energetica guiada"`  
Principio violado: valor antes da arquitetura; autenticacao nao deve exigir alfabetizacao interna  
Severidade: Media  
Correcao sugerida: usar linguagem de entrada mais simples e centrada em conta, leitura e continuidade  
Impacto esperado: reduz atrito antes mesmo do primeiro acesso

### 8. Upload ainda comunica processo interno em vez de revelacao

Arquivo: `src/components/InvoiceUpload.tsx`  
Componente: `InvoiceUpload`  
Trecho: `"Adicionar fatura ao historico"`, `"atualiza a analise, o score e os proximos passos"`, `"Dados vinculados ao estado da jornada MVP"`  
Principio violado: a Score nao deve explicar pipeline nem estado interno  
Severidade: Alta  
Correcao sugerida: reescrever a superficie de upload para falar de leitura da conta, nao de historico, score ou MVP  
Impacto esperado: o envio da fatura passa a parecer inicio de descoberta, nao operacao de sistema

### 9. Toasts ainda soam como sistema operacional

Arquivo: `src/components/InvoiceUpload.tsx`; `src/components/Header.tsx`  
Componente: `InvoiceUpload`; `Header`  
Trecho: `"Fatura adicionada ao historico!"`, `"Sessao encerrada"`, `"Agora voce pode entrar com outra conta."`  
Principio violado: Voice; evitar mensagens de sucesso burocraticas  
Severidade: Media  
Correcao sugerida: reduzir toasts, trocar por linguagem de continuidade ou remover quando nao forem essenciais  
Impacto esperado: menos ruido operacional e menos interrupcao da leitura

---

## Categoria 3 — Arquitetura vazando no detalhamento

### 10. O aprofundamento ainda nasce como painel, nao como detalhe opcional

Arquivo: `src/pages/Index.tsx`  
Componente: `Index`  
Trecho: `"Detalhes da leitura"`, `"Ver mais sobre esta conta"` com estrutura longa de secoes e titulos  
Principio violado: detalhes devem existir sob demanda, mas nao com linguagem e estrutura de dashboard  
Severidade: Alta  
Correcao sugerida: manter o aprofundamento, mas condensar em uma narrativa curta ou em poucas secoes humanas  
Impacto esperado: o app deixa de parecer duas experiencias concorrentes na mesma tela

### 11. Chips taxonomicos do detalhe expõem mapa interno da jornada

Arquivo: `src/pages/Index.tsx`  
Componente: `Index`  
Trecho: `"Base da jornada"`, `"Leitura do ciclo"`, `"Continuidade do ciclo"`, `"Evolucao entre contas"`, `"O que permanece com a Score"`  
Principio violado: mostrar antes de explicar; o usuario nao precisa ver a taxonomia do produto  
Severidade: Alta  
Correcao sugerida: reduzir drasticamente o numero de secoes e traduzir para linguagem de utilidade real  
Impacto esperado: o aprofundamento fica menos institucional e mais util

### 12. Cards de categoria ainda mostram "0 referencias"

Arquivo: `src/components/nucleo/GuidedConversationSession.tsx`; `src/pages/Index.tsx`  
Componente: `GuidedConversationSession`; `Index`  
Trecho: badge `"0 referencia(s)"` nos cards de entendimento  
Principio violado: Operacao Silencio item 5; badges tecnicos devem desaparecer  
Severidade: Alta  
Correcao sugerida: remover a contagem da superficie; se necessario, usar isso apenas internamente  
Impacto esperado: reduz o tom de auditoria e elimina um marcador frio de "vazio"

### 13. Cards ainda anunciam explicitamente o que falta entender

Arquivo: `src/components/nucleo/GuidedConversationSession.tsx`; `src/pages/Index.tsx`  
Componente: `GuidedConversationSession`; `Index`  
Trecho: `"Ainda falta entender: ..."`  
Principio violado: a Score nao deve abrir a conversa pela propria insuficiencia  
Severidade: Alta  
Correcao sugerida: substituir por detalhe opcional orientado a proximo olhar humano ou remover quando redundante  
Impacto esperado: a leitura deixa de parecer lista de pendencias

### 14. Painel de resumo dinamico ainda usa linguagem de relatorio

Arquivo: `src/components/dynamic-context/DynamicContextSummaryView.tsx`  
Componente: `DynamicContextSummaryView`  
Trecho: `"LEITURA SINTETIZADA"`, `"CONTINUIDADE SUGERIDA"`, `"CTA: ..."`, `"PERFIL: ..."`, `"CONTEXTO LOCAL INFORMADO: ..."`  
Principio violado: a Score ensina por contexto e consequencia, nao por console de resumo  
Severidade: Alta  
Correcao sugerida: reescrever ou ocultar esse painel ate que ele consiga falar como produto, nao como sumario de runtime  
Impacto esperado: elimina o principal foco de tom tecnico no aprofundamento

### 15. Painel de acoes dinamicas ainda expõe memoria, base e CTA tecnico

Arquivo: `src/components/dynamic-context/DynamicContextActionsView.tsx`  
Componente: `DynamicContextActionsView`  
Trecho: `"Impacto na memoria"`, `"CTA: ..."`, `"Base da recomendacao"`, `"Dados usados"`, `"Ver painel de memoria"`  
Principio violado: complexidade escondida; o usuario nao deve ver racional interno da recomendacao  
Severidade: Alta  
Correcao sugerida: esconder esse bloco da superficie atual ou reescreve-lo como uma unica orientacao humana  
Impacto esperado: corta vazamento forte de bastidores do produto

### 16. Perfil no detalhe ainda fala de fluxo e persistencia

Arquivo: `src/components/dynamic-context/DynamicContextProfileView.tsx`  
Componente: `DynamicContextProfileView`  
Trecho: `"A edicao continua usando o fluxo existente da jornada, sem criar persistencia nova."`  
Principio violado: o usuario nunca deve receber explicacao de implementacao  
Severidade: Media  
Correcao sugerida: remover totalmente esse tipo de justificativa da interface  
Impacto esperado: o detalhe deixa de parecer nota tecnica para time interno

---

## Categoria 4 — Estados pre-ready e pos-resposta ainda falam demais

### 17. Estado de perfil ainda aparece como preparacao de sistema

Arquivo: `src/components/nucleo/GuidedConversationSession.tsx`; `qa-artifacts/journey-qa/03-profile-ready.png`  
Componente: `GuidedConversationSession`  
Trecho: `"Base da jornada"` e bloco lateral explicando contexto antes da leitura  
Principio violado: o app deve parecer pronto para revelar, nao pedir licenca para comecar  
Severidade: Media  
Correcao sugerida: simplificar o pre-ready para uma orientacao unica e silenciosa, sem mockup paralelo e sem linguagem de base  
Impacto esperado: diminui sensacao de onboarding operacional

### 18. Estado de upload ainda parece etapa de pipeline

Arquivo: `src/components/nucleo/GuidedConversationSession.tsx`; `src/components/InvoiceUpload.tsx`; `qa-artifacts/journey-qa/04-upload-ready.png`  
Componente: `GuidedConversationSession`; `InvoiceUpload`  
Trecho: `"Primeira conta"`, `"Adicionar fatura ao historico"`, bloco lateral e texto sobre analise/score/proximos passos  
Principio violado: mostrar antes de explicar; upload deve prometer leitura, nao enumerar mecanismos  
Severidade: Alta  
Correcao sugerida: reduzir o estado a uma chamada simples de envio e ao valor que surgira depois  
Impacto esperado: o usuario entende por que enviar a conta sem entrar no backstage

### 19. Estado de processamento ainda dramatiza o motor em vez da descoberta

Arquivo: `src/components/nucleo/GuidedConversationSession.tsx`; `src/components/InvoiceUpload.tsx`  
Componente: `GuidedConversationSession`; `InvoiceUpload`  
Trecho: `"Leitura em andamento"`, `"Lendo a fatura e montando o resumo..."`, `"A proxima etapa sera uma analise simples..."`  
Principio violado: a Score nao deve narrar o proprio processamento  
Severidade: Media  
Correcao sugerida: usar uma espera curta e silenciosa, centrada no que o usuario vai receber  
Impacto esperado: menos ansiedade e menos sensacao de software processando dados

### 20. Pos-resposta ainda cai em linguagem de jornada e memoria

Arquivo: `src/components/dynamic-context/DynamicContextActionsView.tsx`  
Componente: `DynamicContextActionsView`  
Trecho: `"Sua resposta melhora a leitura da jornada..."`, `"Ajude a refinar sua Memoria Energetica em 1 toque."`  
Principio violado: Hermes pode reconhecer continuidade, mas a superficie nao deve explicar mecanismo nem memoria como subsistema  
Severidade: Media  
Correcao sugerida: resumir o pos-resposta a reconhecimento curto + nova leitura + uma acao  
Impacto esperado: a transicao apos resposta fica mais humana e menos orientada a sistema

---

## Categoria 5 — Estrutura geral ainda parece painel

### 21. Landing page ainda funciona como vitrine da arquitetura

Arquivo: `src/pages/LandingPage.tsx`; `qa-artifacts/journey-qa/01-landing.png`  
Componente: `LandingPage`  
Trecho: `"cultura energetica visivel"`, `"Nucleo oficial da jornada"`, cards `"Problema"`, `"Proposta"`, `"Resultado"`, metricas e secoes longas  
Principio violado: o produto nao deve parecer manifesto, framework ou dashboard institucional  
Severidade: Alta  
Correcao sugerida: reduzir a landing a promessa, leitura e proximo passo; esconder a maior parte da arquitetura e taxonomia  
Impacto esperado: melhora imediata da percepcao externa de maturidade do produto

### 22. O detalhamento oferece multiplos CTAs e dispersa o foco

Arquivo: `src/pages/Index.tsx`; `src/components/dynamic-context/DynamicContextSummaryView.tsx`; `src/components/dynamic-context/DynamicContextHistoryView.tsx`  
Componente: `Index`; `DynamicContextSummaryView`; `DynamicContextHistoryView`  
Trecho: `"Refinar leitura"`, `"Ver mais sobre esta conta"`, `"Ver continuidade do ciclo"`, `"Rever evolucao"`, `"Adicionar fatura"`  
Principio violado: um CTA por tela ou por momento principal  
Severidade: Alta  
Correcao sugerida: definir qual e a unica acao dominante e rebaixar as demais para segundo plano real  
Impacto esperado: reduz indecisao e fortalece a leitura principal

### 23. Mobile acima da dobra ainda acumula ruido demais

Arquivo: `src/components/nucleo/CorePresence.tsx`; `src/components/nucleo/GuidedConversationSession.tsx`; `.score/reviews/latest/screenshots/mobile-home.png`  
Componente: `CorePresence`; `GuidedConversationSession`  
Trecho: badges, labels, bloco residual, secondary signals e CTA competindo antes da dobra  
Principio violado: mobile-first; antes da dobra deve caber valor, consumo, descoberta, significado e CTA  
Severidade: Alta  
Correcao sugerida: amputar elementos secundarios da Hero mobile e empurrar tudo que nao for essencial para detalhe  
Impacto esperado: a Score finalmente cabe em 5 segundos de atencao no celular

### 24. Toast cobre a leitura em vez de apoiar a leitura

Arquivo: `src/components/InvoiceUpload.tsx`; `.score/reviews/latest/screenshots/mobile-home.png`; `.score/reviews/latest/screenshots/desktop-home.png`  
Componente: `InvoiceUpload`  
Trecho: toast de sucesso sobreposto ao topo da tela apos upload  
Principio violado: visual silence; feedback nao pode roubar o lugar da revelacao  
Severidade: Media  
Correcao sugerida: reduzir duracao, reposicionar ou substituir por feedback embutido na propria Hero  
Impacto esperado: o primeiro contato com a leitura deixa de ser interrompido

---

## TOP 10 — Ordenado por impacto

1. Remover da Hero o bloco `"Ainda nao explicado"` e qualquer percentual residual.
2. Tirar da visao principal os valores monetarios e percentuais por categoria.
3. Remover `"Outros sinais desta conta"` da Hero e devolver protagonismo unico a descoberta.
4. Silenciar o detalhamento que hoje vira painel taxonomico com varias secoes internas.
5. Eliminar badges `"0 referencias"` e frases `"Ainda falta entender"` dos cards.
6. Ocultar ou reescrever o painel `"LEITURA SINTETIZADA"` com `"CTA:"`, `"PERFIL:"` e `"CONTEXTO LOCAL INFORMADO:"`.
7. Rebaixar ou remover o painel de acoes dinamicas que expõe memoria, base e dados usados.
8. Limpar upload e pre-ready de linguagem como historico, score, jornada, analise e MVP.
9. Reescrever footer e header para acabar com `"Nucleo"`, `"Diagnostico"`, `"Memoria"` e outras categorias internas.
10. Reduzir a landing page, que ainda funciona como vitrine de arquitetura em vez de entrada silenciosa no produto.

---

## Recomendacao da primeira cirurgia

Primeira cirurgia recomendada: **silenciar completamente a Hero**.

Escopo minimo dessa cirurgia:

- remover `"Ainda nao explicado"`;
- remover percentuais e valores por categoria na visao principal;
- remover `"Outros sinais desta conta"`;
- remover badge `"Core"` e excesso de labels;
- manter apenas valor, consumo, descoberta, significado e CTA unico.

Motivo:

Essa unica cirurgia ataca o maior ponto de friccao percebido hoje. Se a Hero ficar silenciosa, a Score volta a parecer leitura energetica imediatamente, mesmo antes de limpar o restante do detalhamento.

---

## Validacao final

Nenhum arquivo de codigo foi alterado nesta missao.

Arquivo criado:

- `.score/operations/SILENCE_AUDIT_001.md`
