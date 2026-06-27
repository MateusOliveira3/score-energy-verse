# Temporal Authority V1

`TemporalAuthority` e a primeira representacao executavel da autoridade temporal inicial de um conhecimento persistivel.

## O que ele representa

Ele nao representa expiracao.

Ele nao representa validade juridica.

Ele nao representa revalidacao automatica.

Ele representa a pergunta:

- com que forca temporal este conhecimento nasce?

## Pergunta central

Se um conhecimento ja merece permanecer:

- ele nasce apenas provisoriamente
- nasce contextual
- ou ja nasce com estabilidade temporal inicial

## Responsabilidades naturais desta V1

- receber um `CandidateKnowledge`
- derivar nivel inicial de autoridade temporal
- registrar prioridade de futura revalidacao
- registrar gatilhos de perda ou revisita de autoridade
- acompanhar o nascimento do conhecimento persistivel

## O que permanece fora dele

- agendar revisita
- detectar contradicao futura automaticamente
- atualizar memoria
- decidir obsolescencia final

## Niveis atuais

- `provisional`
- `contextual`
- `stable`

## Como a prudencia e preservada

Toda autoridade temporal nasce:

- junto com os limites explicitos
- antes da memoria
- sem prometer permanencia eterna

## Limites desta V1

- nao existe politica formal de envelhecimento em runtime
- nao existe monitor automatico de mudancas
- nao existe downgrade temporal automatico
