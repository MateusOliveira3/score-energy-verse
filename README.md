# Score Energy

Um aplicativo web para gamificação do consumo de energia, ajudando usuários a entenderem e melhorarem seus hábitos de consumo de energia de forma divertida e interativa.

## 🚀 Tecnologias

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase (Autenticação e Banco de Dados)
- React Router
- React Query
- Shadcn/ui

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone [URL_DO_REPOSITÓRIO]
cd score-energy-verse-1
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:8080`

## 🏗️ Estrutura do Projeto

```
score-energy-verse-1/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   ├── contexts/       # Contextos React (Auth, etc)
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Configurações e utilitários
│   ├── pages/         # Páginas da aplicação
│   ├── styles/        # Estilos globais
│   └── ui/            # Componentes de UI base
├── public/            # Arquivos estáticos
└── ...config files
```

## 🔐 Autenticação

O sistema usa Supabase para autenticação, com as seguintes funcionalidades:
- Registro de usuário
- Login
- Recuperação de senha
- Proteção de rotas

## 🎮 Funcionalidades

- Sistema de pontuação baseado em consumo de energia
- Perfil personalizável
- Mascote virtual
- Ranking de usuários
- Dicas de economia de energia

## 📱 Rotas

- `/` - Página inicial
- `/login` - Login
- `/registro` - Registro de nova conta
- `/perfil` - Perfil do usuário (protegida)
- `/ranking` - Ranking de usuários
- `*` - Página 404

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ✨ Agradecimentos

- [Shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/)
- [Tailwind CSS](https://tailwindcss.com/)
