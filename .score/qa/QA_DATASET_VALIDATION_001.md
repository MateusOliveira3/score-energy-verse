# QA_DATASET_VALIDATION_001

## Ambiente

- data: `2026-06-17T02:19:19.843Z`
- branch: `feature/knowledge-persistence-boundary-v1`
- URL testada: `http://127.0.0.1:4173`
- navegador: `Chrome local`
- servidor local: `qa-artifacts\dataset-validation\vite-server.log`

## Fixture

### qa-journey-fixture.png

- origem observada: `test-fixtures-invoices\qa-journey-fixture.png`
- formato: `png`
- tamanho: `69109` bytes
- sha256: `046c1a4ff0eb174bca1f5a487b40e5ae0fe3fb51f0654e3353d54264793a61d1`
- representatividade: nao representativa; hash identico a `qa-artifacts\mobile.png`

### celesc-sample-01.pdf

- origem observada: `test-fixtures-invoices\celesc-sample-01.pdf`
- formato: `pdf`
- tamanho: `581632` bytes
- sha256: `02e910a6ae170a667ab5d996ec8e301508bcf668a7c5130acf81f876aaa48d1e`
- representatividade: PDF real anonimizdo ja usado nos testes de parser do repositorio

## Experimentos realizados

- `png-direct`: fixture=`test-fixtures-invoices\qa-journey-fixture.png`, modo=`input direto`, invoice=qa-journey-fixture.png (image/png, 69109 bytes), parser=unsupported rawText=false, status=ready stage=analysis-ready, readyReached=true, processingTitleVisible=false
- `png-filechooser`: fixture=`test-fixtures-invoices\qa-journey-fixture.png`, modo=`file chooser`, invoice=qa-journey-fixture.png (image/png, 69109 bytes), parser=unsupported rawText=false, status=ready stage=analysis-ready, readyReached=true, processingTitleVisible=false
- `pdf-direct`: fixture=`test-fixtures-invoices\celesc-sample-01.pdf`, modo=`input direto`, invoice=celesc-sample-01.pdf (application/pdf, 581632 bytes), parser=pdf-text rawText=true, status=ready stage=analysis-ready, readyReached=true, processingTitleVisible=false
- `pdf-filechooser`: fixture=`test-fixtures-invoices\celesc-sample-01.pdf`, modo=`file chooser`, invoice=celesc-sample-01.pdf (application/pdf, 581632 bytes), parser=pdf-text rawText=true, status=ready stage=analysis-ready, readyReached=true, processingTitleVisible=false

## Evidencias

- A fixture `qa-journey-fixture.png` nao representa uma conta de energia real: ela possui o mesmo hash SHA-256 de `qa-artifacts/mobile.png`, um screenshot previo do projeto.
- Nos dois experimentos com PNG, o parser registrou `textSource=unsupported` e `rawTextAvailable=false`.
- Nos dois experimentos com PDF real, o parser registrou `textSource=pdf-text` com campos canonicos preenchidos.
- A jornada atingiu `analysis.status=ready` tanto com PNG quanto com PDF, portanto o travamento observado na Missao 038 nao foi um bloqueio persistente do estado de produto.
- Nao houve diferenca material entre `input direto` e `file chooser`: nome, tipo, tamanho, `fingerprint`, `analysis.status` e saida do parser ficaram equivalentes por fixture.

### png-direct

- fixture: `test-fixtures-invoices\qa-journey-fixture.png`
- modo: `input direto`
- storage key: `score-energy:mvp-journey:v1:d1ad88b0-8965-4a61-aeec-4c09e82758d0`
- elapsedMs: `10996`
- processing apareceu: `true`
- readyReached: `true`
- analysis.status: `ready`
- journeyStage: `analysis-ready`
- upload success visivel: `false`
- upload error visivel: `false`
- titulo processing visivel ao final: `false`
- titulo ready visivel ao final: `false`
- parser: `unsupported`
- rawTextAvailable: `false`
- campos: referencia=n/d, vencimento=n/d, total=n/d, consumo=n/d
- screenshot: `qa-artifacts\dataset-validation\png-direct\final.png`
- runtime:
  - nenhum erro de runtime capturado
- logs debug relevantes:
  - debug: [invoice-flow] journey-save-requested {providerUserId: d1ad88b0-8965-4a61-aeec-4c09e82758d0, journeyStage: onboarding, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] persist-local-journey-state {userId: d1ad88b0-8965-4a61-aeec-4c09e82758d0, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] journey-save-requested {providerUserId: d1ad88b0-8965-4a61-aeec-4c09e82758d0, journeyStage: before-upload, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] persist-local-journey-state {userId: d1ad88b0-8965-4a61-aeec-4c09e82758d0, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] journey-save-requested {providerUserId: d1ad88b0-8965-4a61-aeec-4c09e82758d0, journeyStage: invoice-uploaded, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] persist-local-journey-state {userId: d1ad88b0-8965-4a61-aeec-4c09e82758d0, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] after-parse {fingerprint: qa-journey-fixture.png-69109-1777254444144-image/png, fileName: qa-journey-fixture.png, referenceMonth: undefined, dueDate: undefined, totalValue: undefined}
  - debug: [invoice-flow] interpret-invoice-file {fingerprint: qa-journey-fixture.png-69109-1777254444144-image/png, fileName: qa-journey-fixture.png, month: Referencia nao identificada, totalValue: undefined, consumption: undefined}
  - debug: [invoice-flow] final-invoice-before-save {completedAt: 2026-06-17T02:19:33.389Z, latestInvoice: Object}
  - debug: [invoice-flow] journey-save-requested {providerUserId: d1ad88b0-8965-4a61-aeec-4c09e82758d0, journeyStage: analysis-ready, invoiceHistoryLength: 1, latestInvoice: Object}
  - debug: [invoice-flow] persist-local-journey-state {userId: d1ad88b0-8965-4a61-aeec-4c09e82758d0, invoiceHistoryLength: 1, latestInvoice: Object}

### png-filechooser

- fixture: `test-fixtures-invoices\qa-journey-fixture.png`
- modo: `file chooser`
- storage key: `score-energy:mvp-journey:v1:b339e5a9-b121-4308-8b01-5e01ed7e8519`
- elapsedMs: `8252`
- processing apareceu: `true`
- readyReached: `true`
- analysis.status: `ready`
- journeyStage: `analysis-ready`
- upload success visivel: `false`
- upload error visivel: `false`
- titulo processing visivel ao final: `false`
- titulo ready visivel ao final: `false`
- parser: `unsupported`
- rawTextAvailable: `false`
- campos: referencia=n/d, vencimento=n/d, total=n/d, consumo=n/d
- screenshot: `qa-artifacts\dataset-validation\png-filechooser\final.png`
- runtime:
  - nenhum erro de runtime capturado
- logs debug relevantes:
  - debug: [invoice-flow] journey-save-requested {providerUserId: b339e5a9-b121-4308-8b01-5e01ed7e8519, journeyStage: onboarding, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] persist-local-journey-state {userId: b339e5a9-b121-4308-8b01-5e01ed7e8519, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] journey-save-requested {providerUserId: b339e5a9-b121-4308-8b01-5e01ed7e8519, journeyStage: before-upload, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] persist-local-journey-state {userId: b339e5a9-b121-4308-8b01-5e01ed7e8519, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] journey-save-requested {providerUserId: b339e5a9-b121-4308-8b01-5e01ed7e8519, journeyStage: invoice-uploaded, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] persist-local-journey-state {userId: b339e5a9-b121-4308-8b01-5e01ed7e8519, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] after-parse {fingerprint: qa-journey-fixture.png-69109-1777254444144-image/png, fileName: qa-journey-fixture.png, referenceMonth: undefined, dueDate: undefined, totalValue: undefined}
  - debug: [invoice-flow] interpret-invoice-file {fingerprint: qa-journey-fixture.png-69109-1777254444144-image/png, fileName: qa-journey-fixture.png, month: Referencia nao identificada, totalValue: undefined, consumption: undefined}
  - debug: [invoice-flow] final-invoice-before-save {completedAt: 2026-06-17T02:19:41.811Z, latestInvoice: Object}
  - debug: [invoice-flow] journey-save-requested {providerUserId: b339e5a9-b121-4308-8b01-5e01ed7e8519, journeyStage: analysis-ready, invoiceHistoryLength: 1, latestInvoice: Object}
  - debug: [invoice-flow] persist-local-journey-state {userId: b339e5a9-b121-4308-8b01-5e01ed7e8519, invoiceHistoryLength: 1, latestInvoice: Object}

### pdf-direct

- fixture: `test-fixtures-invoices\celesc-sample-01.pdf`
- modo: `input direto`
- storage key: `score-energy:mvp-journey:v1:f1dc1b99-e5eb-4b64-b93d-32774f72b58c`
- elapsedMs: `14915`
- processing apareceu: `true`
- readyReached: `true`
- analysis.status: `ready`
- journeyStage: `analysis-ready`
- upload success visivel: `false`
- upload error visivel: `false`
- titulo processing visivel ao final: `false`
- titulo ready visivel ao final: `false`
- parser: `pdf-text`
- rawTextAvailable: `true`
- campos: referencia=02/2026, vencimento=28/02/2026, total=472.3, consumo=528
- screenshot: `qa-artifacts\dataset-validation\pdf-direct\final.png`
- runtime:
  - nenhum erro de runtime capturado
- logs debug relevantes:
  - debug: [invoice-flow] journey-save-requested {providerUserId: f1dc1b99-e5eb-4b64-b93d-32774f72b58c, journeyStage: onboarding, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] persist-local-journey-state {userId: f1dc1b99-e5eb-4b64-b93d-32774f72b58c, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] journey-save-requested {providerUserId: f1dc1b99-e5eb-4b64-b93d-32774f72b58c, journeyStage: before-upload, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] persist-local-journey-state {userId: f1dc1b99-e5eb-4b64-b93d-32774f72b58c, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] journey-save-requested {providerUserId: f1dc1b99-e5eb-4b64-b93d-32774f72b58c, journeyStage: invoice-uploaded, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] persist-local-journey-state {userId: f1dc1b99-e5eb-4b64-b93d-32774f72b58c, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-parser] file-read {fileName: celesc-sample-01.pdf, fileType: application/pdf, fileSize: 581632, hasArrayBuffer: true, byteLength: 581632}
  - debug: [invoice-parser] pdf-structure {streamCount: 18, flateStreamCount: 14, multiFilterStreamCount: 0, decodedStreamCount: 6, failedStreamCount: 12}
  - debug: [invoice-parser] pdfjs-fallback-started {initialRawTextLength: 2625, initialKeywordPresence: Object, diagnostics: Object}
  - debug: [invoice-parser] pdfjs-fallback-succeeded {pdfJsPageCount: 2, pdfJsTextLength: 2455, keywordPresence: Object}
  - debug: [invoice-parser] raw-text {rawTextLength: 2455, rawTextSample: RESIDENCIAL - RESIDENCIAL - B1 Residencial - MONOF…
 
123
 
12,00
 
14,76
ICMS
 
328,68
 
17,00
 
55, keywordPresence: Object}
  - debug: [invoice-parser] normalized-text {normalizedTextLength: 2455, normalizedTextSample: RESIDENCIAL - RESIDENCIAL - B1 RESIDENCIAL - MONOF…
 
123
 
12,00
 
14,76
ICMS
 
328,68
 
17,00
 
55, keywordPresence: Object}
  - debug: [invoice-parser] audit {fileName: celesc-sample-01.pdf, fileType: application/pdf, fileSize: 581632, source: pdf-text, hasArrayBuffer: true}
  - debug: [invoice-flow] after-parse {fingerprint: celesc-sample-01.pdf-581632-1776963151106-application/pdf, fileName: celesc-sample-01.pdf, referenceMonth: 02/2026, dueDate: 28/02/2026, totalValue: 472.3}
  - debug: [invoice-flow] interpret-invoice-file {fingerprint: celesc-sample-01.pdf-581632-1776963151106-application/pdf, fileName: celesc-sample-01.pdf, month: 02/2026, totalValue: 472.3, consumption: 528}
  - debug: [invoice-flow] final-invoice-before-save {completedAt: 2026-06-17T02:19:50.572Z, latestInvoice: Object}
  - debug: [invoice-flow] journey-save-requested {providerUserId: f1dc1b99-e5eb-4b64-b93d-32774f72b58c, journeyStage: analysis-ready, invoiceHistoryLength: 1, latestInvoice: Object}
  - debug: [invoice-flow] persist-local-journey-state {userId: f1dc1b99-e5eb-4b64-b93d-32774f72b58c, invoiceHistoryLength: 1, latestInvoice: Object}

### pdf-filechooser

- fixture: `test-fixtures-invoices\celesc-sample-01.pdf`
- modo: `file chooser`
- storage key: `score-energy:mvp-journey:v1:dee8d7f5-a82a-4221-aa11-2114ffc5d7d1`
- elapsedMs: `12178`
- processing apareceu: `true`
- readyReached: `true`
- analysis.status: `ready`
- journeyStage: `analysis-ready`
- upload success visivel: `false`
- upload error visivel: `false`
- titulo processing visivel ao final: `false`
- titulo ready visivel ao final: `false`
- parser: `pdf-text`
- rawTextAvailable: `true`
- campos: referencia=02/2026, vencimento=28/02/2026, total=472.3, consumo=528
- screenshot: `qa-artifacts\dataset-validation\pdf-filechooser\final.png`
- runtime:
  - nenhum erro de runtime capturado
- logs debug relevantes:
  - debug: [invoice-flow] journey-save-requested {providerUserId: dee8d7f5-a82a-4221-aa11-2114ffc5d7d1, journeyStage: onboarding, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] persist-local-journey-state {userId: dee8d7f5-a82a-4221-aa11-2114ffc5d7d1, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] journey-save-requested {providerUserId: dee8d7f5-a82a-4221-aa11-2114ffc5d7d1, journeyStage: before-upload, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] persist-local-journey-state {userId: dee8d7f5-a82a-4221-aa11-2114ffc5d7d1, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] journey-save-requested {providerUserId: dee8d7f5-a82a-4221-aa11-2114ffc5d7d1, journeyStage: invoice-uploaded, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-flow] persist-local-journey-state {userId: dee8d7f5-a82a-4221-aa11-2114ffc5d7d1, invoiceHistoryLength: 0, latestInvoice: null}
  - debug: [invoice-parser] file-read {fileName: celesc-sample-01.pdf, fileType: application/pdf, fileSize: 581632, hasArrayBuffer: true, byteLength: 581632}
  - debug: [invoice-parser] pdf-structure {streamCount: 18, flateStreamCount: 14, multiFilterStreamCount: 0, decodedStreamCount: 6, failedStreamCount: 12}
  - debug: [invoice-parser] pdfjs-fallback-started {initialRawTextLength: 2625, initialKeywordPresence: Object, diagnostics: Object}
  - debug: [invoice-parser] pdfjs-fallback-succeeded {pdfJsPageCount: 2, pdfJsTextLength: 2455, keywordPresence: Object}
  - debug: [invoice-parser] raw-text {rawTextLength: 2455, rawTextSample: RESIDENCIAL - RESIDENCIAL - B1 Residencial - MONOF…
 
123
 
12,00
 
14,76
ICMS
 
328,68
 
17,00
 
55, keywordPresence: Object}
  - debug: [invoice-parser] normalized-text {normalizedTextLength: 2455, normalizedTextSample: RESIDENCIAL - RESIDENCIAL - B1 RESIDENCIAL - MONOF…
 
123
 
12,00
 
14,76
ICMS
 
328,68
 
17,00
 
55, keywordPresence: Object}
  - debug: [invoice-parser] audit {fileName: celesc-sample-01.pdf, fileType: application/pdf, fileSize: 581632, source: pdf-text, hasArrayBuffer: true}
  - debug: [invoice-flow] after-parse {fingerprint: celesc-sample-01.pdf-581632-1776963151106-application/pdf, fileName: celesc-sample-01.pdf, referenceMonth: 02/2026, dueDate: 28/02/2026, totalValue: 472.3}
  - debug: [invoice-flow] interpret-invoice-file {fingerprint: celesc-sample-01.pdf-581632-1776963151106-application/pdf, fileName: celesc-sample-01.pdf, month: 02/2026, totalValue: 472.3, consumption: 528}
  - debug: [invoice-flow] final-invoice-before-save {completedAt: 2026-06-17T02:20:05.580Z, latestInvoice: Object}
  - debug: [invoice-flow] journey-save-requested {providerUserId: dee8d7f5-a82a-4221-aa11-2114ffc5d7d1, journeyStage: analysis-ready, invoiceHistoryLength: 1, latestInvoice: Object}
  - debug: [invoice-flow] persist-local-journey-state {userId: dee8d7f5-a82a-4221-aa11-2114ffc5d7d1, invoiceHistoryLength: 1, latestInvoice: Object}

## Conclusao

`fixture incorreta`

Base objetiva da conclusao:

- A fixture PNG atual nao representa uma conta real; ela e identica ao screenshot `qa-artifacts/mobile.png`.
- O parser aceita PDF real e extrai campos canonicos; com PNG ele registra `unsupported`.
- O fluxo automatizado atingiu `analysis.status=ready` nos casos observados, inclusive com `file chooser`, entao nao houve evidencia de diferenca material entre upload automatizado e upload manual-like.
- O problema principal da Missao 038 foi o experimento de QA ter usado uma fixture inadequada como evidencia de produto.

## Recomendacoes

- Atualizar a infraestrutura de QA principal para usar uma fixture representativa de conta real anonimizda em PDF, em vez do PNG derivado de screenshot.
- Institucionalizar uma fixture oficial de energia anonimizda para QA, com validacao explicita da equipe e reutilizacao em testes automatizados.
