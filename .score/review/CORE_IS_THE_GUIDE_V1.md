# Core Is The Guide V1

## Objetivo

Reduzir a primeira dobra do `/perfil` para que exista apenas uma voz principal: a Core.

## O que mudou

- a Core deixou de competir com um hero textual separado
- os cards tecnicos de fator, memoria, conhecimento, lacuna e decisao sairam da primeira dobra
- as metricas da fatura permaneceram apenas como contexto silencioso
- os detalhes continuam recolhidos fora do fluxo principal

## Ajustes realizados

- `GuidedConversationSession` foi simplificado para priorizar um unico bloco principal da Core
- `CorePresence` ganhou o modo `hero`, no qual a Core aparece como guia e nao como widget lateral
- a pergunta ou pista aparece antes da explicacao longa
- os botoes de acao ficaram dentro da propria voz da Core

## Antes

- hero principal falava
- card lateral da Core falava
- cards tecnicos tambem narravam a leitura

## Depois

- a Core fala
- os dados apenas apoiam
- os detalhes esperam

## Resultado percebido

O `/perfil` fica menos proximo de um dashboard e mais proximo de uma leitura guiada com uma unica presenca principal.

## Limites restantes

- a pergunta cognitiva ainda depende da camada de jornada atual para opcoes de resposta
- a explicacao detalhada ainda existe dentro do mesmo componente, apenas recolhida
- a consolidacao completa da voz da Core no restante da aplicacao ainda depende de sprints futuras
