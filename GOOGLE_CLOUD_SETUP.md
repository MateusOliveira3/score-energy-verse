# 🚀 Configuração Google Cloud - Score Energy Verse

Este guia irá te ajudar a configurar o Google Cloud para usar Google Sheets como banco de dados e Google Drive para armazenamento de arquivos.

## 📋 Pré-requisitos

- Conta Google
- Acesso ao Google Cloud Console
- Node.js instalado

## 🔧 Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Clique em "Selecionar projeto" → "Novo projeto"
3. Digite um nome para o projeto (ex: "score-energy-verse")
4. Clique em "Criar"

### 2. Habilitar APIs Necessárias

No Google Cloud Console, vá para "APIs e serviços" → "Biblioteca" e habilite:

- **Google Sheets API**
- **Google Drive API**

### 3. Criar Service Account

1. Vá para "APIs e serviços" → "Credenciais"
2. Clique em "Criar credenciais" → "Conta de serviço"
3. Preencha:
   - **Nome**: `score-energy-service`
   - **Descrição**: `Service account para Score Energy Verse`
4. Clique em "Criar e continuar"
5. Em "Conceder acesso", selecione:
   - **Função**: `Editor`
6. Clique em "Concluído"

### 4. Gerar Chave da Service Account

1. Na lista de contas de serviço, clique na que você criou
2. Vá para a aba "Chaves"
3. Clique em "Adicionar chave" → "Criar nova chave"
4. Selecione "JSON"
5. Clique em "Criar"
6. **IMPORTANTE**: Salve o arquivo JSON em local seguro

### 5. Criar Google Sheets

1. Acesse [Google Sheets](https://sheets.google.com)
2. Crie uma nova planilha
3. Dê um nome (ex: "Score Energy Verse - Database")
4. Copie o ID da planilha da URL:
   ```
   https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit
   ```

### 6. Compartilhar Planilha

1. Na planilha, clique em "Compartilhar"
2. Adicione o email da service account (encontrado no arquivo JSON)
3. Dê permissão de "Editor"

### 7. Criar Pasta no Google Drive

1. Acesse [Google Drive](https://drive.google.com)
2. Crie uma nova pasta (ex: "Score Energy - Invoices")
3. Clique com botão direito → "Compartilhar"
4. Adicione o email da service account
5. Dê permissão de "Editor"
6. Copie o ID da pasta da URL:
   ```
   https://drive.google.com/drive/folders/SEU_ID_AQUI
   ```

### 8. Configurar Variáveis de Ambiente

1. Copie o arquivo `env.example` para `.env`:
   ```bash
   cp env.example .env
   ```

2. Edite o arquivo `.env` com suas informações:

```env
# Google Cloud Configuration
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=seu-service-account@projeto.iam.gserviceaccount.com
VITE_GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSua Chave Privada Aqui\n-----END PRIVATE KEY-----\n"
VITE_GOOGLE_SPREADSHEET_ID=seu-spreadsheet-id-aqui
VITE_GOOGLE_DRIVE_FOLDER_ID=seu-folder-id-aqui

# App Configuration
VITE_APP_NAME=Score Energy Verse
VITE_APP_VERSION=1.0.0
```

**⚠️ IMPORTANTE**: 
- A chave privada deve estar entre aspas duplas
- Use `\n` para quebras de linha
- Não compartilhe este arquivo

### 9. Executar Script de Configuração

```bash
node scripts/setup-google-sheets.js
```

Este script irá:
- Criar as abas necessárias na planilha
- Configurar os cabeçalhos
- Formatar a planilha

### 10. Testar a Configuração

1. Inicie o projeto:
   ```bash
   npm run dev
   ```

2. Teste o cadastro de um usuário
3. Verifique se os dados aparecem na planilha

## 📊 Estrutura da Planilha

O script criará as seguintes abas:

### users
- id, email, password_hash, created_at, updated_at

### user_profiles
- id, user_id, email, consumer_type, location, property_size, people_count, energy_preference, created_at, updated_at

### user_scores
- id, user_id, score, level, created_at, updated_at

### user_mascots
- id, user_id, name, emoji, color_palette, border_effect, created_at, updated_at

### invoices
- id, user_id, consumption, total_value, tax_percentage, peak_hours, month, file_url, file_name, created_at, updated_at

### gamification
- id, user_id, coins, achievements, completed_missions, current_streak, total_points, created_at, updated_at

## 🔒 Segurança

- **NUNCA** commite o arquivo `.env` no Git
- Mantenha as chaves da service account seguras
- Use variáveis de ambiente em produção
- Configure CORS adequadamente se necessário

## 🚨 Troubleshooting

### Erro: "Invalid private key"
- Verifique se a chave privada está correta
- Certifique-se de que as quebras de linha estão como `\n`

### Erro: "Spreadsheet not found"
- Verifique se o ID da planilha está correto
- Certifique-se de que a service account tem acesso

### Erro: "Permission denied"
- Verifique se a service account tem permissão de Editor
- Tente compartilhar novamente a planilha/pasta

### Erro: "API not enabled"
- Verifique se as APIs estão habilitadas no Google Cloud Console

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no console do navegador
2. Verifique os logs do terminal
3. Confirme se todas as variáveis de ambiente estão configuradas
4. Teste a conexão com o Google Cloud Console 