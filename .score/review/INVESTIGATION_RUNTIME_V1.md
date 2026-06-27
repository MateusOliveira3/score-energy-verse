# Investigation Runtime V1

## O que esta sprint destrava?

Esta sprint destrava a primeira leitura cognitiva pos-resposta do usuario.

A Score agora consegue:

1. receber uma resposta
2. gerar evidencia `user_answer`
3. atualizar uma copia do `HouseModel`
4. ajustar hipotese com cautela
5. escolher uma proxima direcao unica
6. devolver uma fala curta para a Core

## O que ainda nao esta persistido?

- a evidencia nova
- o `HouseModel` atualizado
- o historico de investigacao
- o encadeamento completo de perguntas e respostas

Tudo ainda acontece em memoria, de forma pura e deterministica.

## Quais riscos existem se integrarmos isso cedo demais na UI?

- a UI pode tratar fortalecimento como confirmacao final
- respostas repetidas podem parecer persistidas sem realmente estarem
- fluxos visuais podem assumir historico que ainda nao existe no backend
- a fala curta da Core pode ser mostrada como conclusao definitiva se o produto nao respeitar o tom prudente

## Qual deve ser a proxima sprint?

A proxima sprint deveria conectar este runtime a uma camada de sessao de investigacao ainda sem acoplar banco completo.

O passo ideal e criar:

- sequenciamento de perguntas respondidas
- prevençao de repeticao da mesma pergunta
- consolidacao de evidencias por trilha
- contrato claro para futura persistencia
