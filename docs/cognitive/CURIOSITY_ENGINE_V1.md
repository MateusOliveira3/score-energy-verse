# Curiosity Engine V1

`CuriosityEngine` e a primeira institucionalizacao executavel da curiosidade como fenomeno cognitivo da Score.

## O que ele representa

Curiosidade aqui nao e:

- gerador de perguntas
- componente de interface
- lista arbitraria de proximos passos

Curiosidade e o mecanismo que percebe onde ainda existe incerteza relevante e decide se vale abrir, manter ou redirecionar a investigacao.

## Responsabilidades naturais desta V1

- observar lacunas ainda abertas no `HouseModel`
- comparar perguntas em aberto, misterios de ambiente, baseline incompleta e fronteiras de custo
- escolher um unico foco investigativo por vez
- devolver uma unica `nextInvestigation`
- preservar prudencia quando a casa ainda nao oferece base suficiente

## O que esta deliberadamente fora deste motor

- gerar UI
- ordenar cards visuais
- falar pela Core diretamente
- persistir sessao
- confirmar hipoteses como verdade final
- produzir teoria final da residencia

## Como ele se integra no runtime atual

Hoje o motor entra em dois pontos:

1. `buildHouseModelFromJourney`
   Usa o estado atual da jornada para construir a primeira curiosidade da casa.

2. `applyInvestigationAnswer`
   Recalibra a curiosidade depois que uma resposta vira evidencia.

Assim, a curiosidade deixa de ficar espalhada em regras locais e passa a ser um fenomeno nomeado, puro e testavel.

## Prioridades cognitivas atuais

Nesta V1, a curiosidade avalia:

1. perguntas abertas com melhor ganho informacional
2. comodos ainda realmente misteriosos
3. baseline ainda insuficiente para leitura sazonal
4. fronteiras de custo e tarifa quando o resto ja nao lidera

## Conservadorismo

- uma resposta nao vira certeza
- uma hipotese enfraquecida nao desaparece automaticamente
- sem historico suficiente, a curiosidade reconhece o limite e pede mais ciclo
- o motor escolhe um foco por vez para preservar a regra de uma pergunta, um foco, uma acao

## Limites desta V1

- nao existe persistencia de trilha investigativa
- nao existe memoria explicita de curiosidades resolvidas alem do que ja esta no `HouseModel`
- ainda nao existe fenomeno separado para tensao entre curiosidade, memoria e orientacao

## Proximo passo natural

O proximo passo mais coerente e criar uma camada de sessao investigativa que memorize:

- quais perguntas ja foram abertas
- quais curiosidades foram resolvidas
- quando a curiosidade deve insistir
- quando deve entregar a vez para observacao de ciclo ou aprendizado
