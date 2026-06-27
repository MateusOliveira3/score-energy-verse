# Known Limitations

- O aprofundamento ainda depende parcialmente de composicao local em Index.tsx e pode ficar ainda mais governado por runtime.
- O feedback de upload ainda nao fica claramente visivel para toda leitura automatizada, o que reduz a percepcao de progresso em um ponto sensivel da jornada.
- A continuidade entre perguntas ainda nao parece tao inevitavel quanto a filosofia do produto pede; existe espaco para parecer menos troca mecanica.
- Os QA logs ainda registram erros de rede bloqueada em recursos secundarios, mesmo com a jornada principal concluindo com sucesso.
- O canal externo de Hermes ainda esta representado apenas filosoficamente; a conversa continua simulada dentro do app, nao em um canal dedicado como WhatsApp.
- O pacote nao inclui `flow.mp4`: Playwright video requer ffmpeg local; execute "npx playwright install ffmpeg" para habilitar flow.mp4.

## Observacao visual

- Video mp4 nao gerado: Playwright video requer ffmpeg local; execute "npx playwright install ffmpeg" para habilitar flow.mp4.
