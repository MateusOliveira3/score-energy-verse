# Configuração do Supabase para ScoreEnergy

Este guia explica como configurar o Supabase para o projeto ScoreEnergy, incluindo a criação da tabela de faturas e configuração do storage.

## 1. Configuração do Banco de Dados

### 1.1 Executar a Migração SQL

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Execute o script `supabase_migration.sql` que está na raiz do projeto

### 1.2 Verificar a Tabela

Após executar o script, você deve ver:
- Tabela `invoices` criada
- Índices criados para performance
- RLS (Row Level Security) habilitado
- Políticas de segurança configuradas

## 2. Configuração do Storage (Opcional)

### 2.1 Criar Bucket para Faturas

1. No Dashboard do Supabase, vá em **Storage**
2. Clique em **Create a new bucket**
3. Nome: `invoices`
4. Marque **Public bucket** se quiser que os arquivos sejam acessíveis publicamente
5. Clique em **Create bucket**

### 2.2 Configurar Políticas do Storage

Execute o seguinte SQL no **SQL Editor**:

```sql
-- Política para permitir upload de arquivos
CREATE POLICY "Users can upload own invoices" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'invoices' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para permitir visualização de arquivos
CREATE POLICY "Users can view own invoices" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'invoices' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Política para permitir exclusão de arquivos
CREATE POLICY "Users can delete own invoices" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'invoices' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );
```

## 3. Estrutura da Tabela

A tabela `invoices` possui os seguintes campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `user_id` | UUID | ID do usuário (foreign key) |
| `consumption` | DECIMAL(10,2) | Consumo em kWh |
| `total_value` | DECIMAL(10,2) | Valor total da fatura |
| `tax_percentage` | DECIMAL(5,2) | Percentual de impostos |
| `peak_hours` | TEXT | Horário de pico |
| `month` | TEXT | Mês/ano da fatura |
| `file_url` | TEXT | URL do arquivo (opcional) |
| `file_name` | TEXT | Nome do arquivo (opcional) |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data de atualização |

## 4. Segurança

### 4.1 Row Level Security (RLS)

- ✅ Habilitado na tabela `invoices`
- ✅ Usuários só podem ver suas próprias faturas
- ✅ Usuários só podem inserir faturas para si mesmos
- ✅ Usuários só podem atualizar suas próprias faturas
- ✅ Usuários só podem deletar suas próprias faturas

### 4.2 Storage Security

- ✅ Arquivos organizados por usuário (`user_id/filename`)
- ✅ Usuários só podem acessar seus próprios arquivos
- ✅ Políticas de upload, visualização e exclusão configuradas

## 5. Testando a Configuração

### 5.1 Teste de Inserção

```sql
-- Insira um usuário de teste (se necessário)
INSERT INTO auth.users (id, email) VALUES ('test-user-id', 'test@example.com');

-- Insira uma fatura de teste
INSERT INTO invoices (user_id, consumption, total_value, tax_percentage, peak_hours, month)
VALUES ('test-user-id', 250.5, 180.75, 25.5, '18:00-22:00', 'Janeiro 2024');
```

### 5.2 Verificar Políticas

```sql
-- Verificar se as políticas estão ativas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'invoices';
```

## 6. Monitoramento

### 6.1 Logs

- Monitore os logs em **Logs** > **Database**
- Verifique erros de RLS em **Logs** > **Auth**

### 6.2 Métricas

- Acompanhe o uso em **Dashboard** > **Usage**
- Monitore performance em **Dashboard** > **Performance**

## 7. Backup e Recuperação

### 7.1 Backup Automático

- Supabase faz backup automático diário
- Configurado em **Settings** > **Database**

### 7.2 Backup Manual

```sql
-- Exportar dados (se necessário)
COPY invoices TO '/tmp/invoices_backup.csv' CSV HEADER;
```

## 8. Troubleshooting

### 8.1 Erro de RLS

Se receber erro de "new row violates row-level security policy":

1. Verifique se o usuário está autenticado
2. Confirme se as políticas estão corretas
3. Teste com `auth.uid()` no SQL Editor

### 8.2 Erro de Storage

Se o upload de arquivo falhar:

1. Verifique se o bucket `invoices` existe
2. Confirme as políticas do storage
3. Teste o upload manualmente no Dashboard

## 9. Próximos Passos

Após a configuração:

1. ✅ Teste o upload de faturas no frontend
2. ✅ Verifique se os dados aparecem no histórico
3. ✅ Teste a exclusão de faturas
4. ✅ Confirme que usuários só veem suas próprias faturas

## 10. Suporte

Para dúvidas ou problemas:

- [Documentação do Supabase](https://supabase.com/docs)
- [Comunidade do Supabase](https://github.com/supabase/supabase/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase) 