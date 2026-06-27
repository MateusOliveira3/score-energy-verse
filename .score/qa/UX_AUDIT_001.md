# UX_AUDIT_001

## Resumo

Executada com achados de UX relevantes.

Documento institucional ausente durante a leitura obrigatoria:

- `MEMORANDO_INTERNO_001_2026.md` nao existe no repositorio no momento desta execucao.

## Ambiente

- data: `2026-06-26T04:34:32.252Z`
- branch: `feature/knowledge-persistence-boundary-v1`
- comando executado: `npm run qa:journey`
- URL testada: `http://127.0.0.1:4173`
- navegador: `Chrome local`
- fixture principal: `test-fixtures-invoices\celesc-sample-01.pdf`
- auth usada: `local fallback`
- provider da jornada: `local`

## Fluxo executado

- Aplicacao local iniciada em modo QA com provider local e auth local fallback.
- Landing carregada e primeira tela util confirmada.
- Fluxo entrou em criacao de conta a partir da landing.
- Usuario QA local criado com sucesso.
- Login concluido e jornada protegida aberta em /perfil.
- Perfil minimo preenchido e upload disponibilizado.
- Fixture de fatura enviada e processamento concluido.
- Painel de detalhes aberto para auditoria complementar.

## Achados positivos

- Tela inicial carregou sem erro e com CTA principal visivel.
- A criacao de conta local para QA ficou automatizavel sem dependencia externa.
- A Core aparece logo no inicio da jornada protegida.
- Upload ficou disponivel logo apos o contexto minimo ser preenchido.
- A experiencia explica o que aconteceu depois do processamento.
- A Hero devolve um entendimento inicial antes de abrir a primeira pergunta.
- Cada resposta foi seguida de devolucao de valor antes da pergunta seguinte.
- O painel tornou visivel o que a Score ja conseguiu compreender sobre a conta.
- As categorias do painel evoluiram de forma coerente ao longo da investigacao.
- A auditoria encontrou uma pergunta ativa explicita no Hero.
- A pergunta ativa aparece com contexto suficiente antes das opcoes.
- A pergunta observada na Hero corresponde ao estado cognitivo persistido.
- A residencia ficou mais conhecida durante a propria execucao do QA.
- A investigacao passou a soar mais como conversa interpretativa do que como formulario.
- A Hero apresenta uma autoridade soberana sem CTA principal concorrente.
- Existe um proximo passo identificavel na jornada auditada.

## Problemas encontrados

- Upload terminou sem feedback claramente observavel pela automacao.
- A transicao entre perguntas ainda nao pareceu suficientemente continua para o QA.
- A jornada gerou erros de runtime no navegador durante a auditoria.

## Metricas observadas

- Browser: Chrome local
- Time To First Useful Screen Ms: 10073
- Time Core Silent Ms: 9
- Time To Upload Available Ms: 280
- Time To Processing Feedback Ms: nao observado
- Invoice Processing Ms: 20033
- Time To First Value Ms: 20901
- Upload Feedback Visible: nao
- Explains What Happened: sim
- Active Question Visible: sim
- Question Context Visible: sim
- Question Belongs To Cognitive State: sim
- Initial Value Before Question: sim
- Account Understanding Visible: sim
- Account Categories Evolve: sim
- Account Changes Follow Answers: sim
- Account Confidence Without Finality: sim
- Account Open Unknowns Visible: sim
- Residence Feels Known: sim
- Residence Knowledge Delta: 7
- Question Continuity: nao
- Investigation Tone: nao
- Value Before Next Question: sim
- Understanding Compounds: sim
- Conversation Not Form: sim
- Score Works Between Questions: sim
- Duplicate Active Questions: nao
- Clear Response Area: sim
- Hero Sovereign Primary Action: Responder pergunta ativa
- Hero Has Single Primary Action: sim
- Hero Competing Ctas: nao
- Hero Detail Trigger Count: 0
- Clear Next Step Without Details: sim
- Clear Next Step After Details: sim
- Details Primary Action: Ver continuidade do ciclo
- Journey Completed: sim
- Url: http://127.0.0.1:4173

## Screenshots ou traces

- `qa-artifacts\journey-qa\01-landing.png`
- `qa-artifacts\journey-qa\02-register.png`
- `qa-artifacts\journey-qa\03-profile-ready.png`
- `qa-artifacts\journey-qa\04-upload-ready.png`
- `qa-artifacts\journey-qa\06-after-upload.png`
- `qa-artifacts\journey-qa\07-details-open.png`
- `qa-artifacts\journey-qa\journey-trace.zip`
- `qa-artifacts\journey-qa\vite-server.log`

## Recomendacoes

- Tornar o feedback de upload persistente e menos dependente de toast temporario.
- Reforcar o contexto que liga uma pergunta a proxima antes de expandir novas trilhas.
- Revisar erros de runtime capturados no QA antes de ampliar a cobertura da jornada.

## Limitacoes observadas

- console.error: Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED
- console.error: Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED
