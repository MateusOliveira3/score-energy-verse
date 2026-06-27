# Objetivo

Tornar a primeira presenca completa da Core perceptivel dentro do `/perfil` sem deslocar o protagonismo do Nucleo, sem criar novas regras de negocio e sem transformar a aplicacao em chatbot, widget ou dashboard paralelo.

# O que mudou

- O `/perfil` deixou de abrir como uma sequencia de passos e passou a abrir como uma leitura energetica viva.
- O Nucleo continua no centro, com resumo estatico do ciclo, metricas essenciais, fator em foco, memoria, conhecimento, lacuna principal e proxima decisao.
- A Core passou a existir como companhia lateral discreta, com copy curta, curiosidade controlada e CTA pequeno.
- O atalho secundario da Core agora respeita a intencao do feedback:
  - quando houver memoria incorporada, o link leva para memoria;
  - caso contrario, leva para detalhes da leitura.
- A representacao visual da Core deixou de reutilizar o mesmo organismo do Nucleo com nivel e pontos, reduzindo confusao conceitual entre centro cognitivo e companhia visivel.

# Onde Core apareceu

- No shell principal do `/perfil`, ao lado do resumo do ciclo, como bloco complementar de baixa dominancia visual.
- Na copy observacional inicial:
  - "Acho que encontrei uma mudanca interessante."
- No feedback imediato apos resposta contextual ou adaptativa.
- No estado de base da jornada, no primeiro upload e no processamento, como presenca coerente em vez de sumir da experiencia.

# Onde ainda parece software

- A secao "Detalhes da sessao" ainda tem linguagem mais funcional do que atmosferica.
- O bloco principal ainda depende de alguns containers informativos para sustentar clareza; ja ficou menos dashboard, mas ainda nao e inteiramente silencioso.
- Em mobile, a Core aparece abaixo da leitura principal, o que preserva hierarquia, mas reduz um pouco a sensacao de companhia imediata.

# Onde ja parece Score

- A abertura do ciclo agora transmite observacao antes de operacao.
- O usuario enxerga primeiro significado, depois detalhamento.
- A Core nao compete com o Nucleo: ela aponta, observa e convida.
- A memoria passou a parecer lembranca contextual, nao painel tecnico.
- O hero do `/perfil` ficou mais proximo da atmosfera da autenticacao: mais espaco, mais foco e menos fragmentacao.

# Que partes ainda precisam amadurecer

- Expandir a variedade de falas observacionais da Core sem transformar a experiencia em conversa excessiva.
- Refinar o comportamento expandido da Core em mobile para que a curiosidade apareca com menos rolagem.
- Reduzir ainda mais a sensacao de bloco tecnico na area de detalhes, possivelmente em uma futura sprint de UX, sem perder auditabilidade.

# Validacao

- `npm run test` passou com `80/80` testes verdes.
- `npm run build` passou.
- Avisos remanescentes:
  - `Browserslist` desatualizado.
  - chunks grandes no build do Vite, ja preexistentes.

# Evidencia visual

- Desktop: `C:\\Users\\Pichau\\AppData\\Local\\Temp\\core-reveal-desktop.png`
- Mobile: `C:\\Users\\Pichau\\AppData\\Local\\Temp\\core-reveal-mobile.png`
