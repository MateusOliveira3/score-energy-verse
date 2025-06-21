# Guia de Migração: Supabase → Google Sheets/LocalStorage

## Resumo da Migração

Esta migração substitui o Supabase por um sistema híbrido que usa:
- **Google Sheets** para armazenamento de dados (quando configurado)
- **LocalStorage** como fallback (padrão para desenvolvimento)

## Arquivos Criados/Modificados

### Novos Arquivos
- `src/lib/data-layer.ts` - Interface de abstração de dados
- `src/lib/local-auth.ts` - Sistema de autenticação local
- `src/lib/google-sheets-adapter.ts` - Adaptador para Google Sheets
- `src/lib/local-storage-adapter.ts` - Adaptador para localStorage
- `src/lib/data-service.ts` - Serviço principal que escolhe o adaptador

### Arquivos Modificados
- `src/contexts/AuthContext.tsx` - Usa novo sistema de autenticação
- `src/hooks/useInvoices.ts` - Usa novo sistema de dados
- `src/pages/ResetPassword.tsx` - Atualizado para novo sistema
- `src/lib/supabase.ts` - Mantém apenas tipos para compatibilidade

## Configuração

### Para usar Google Sheets (opcional)

1. Crie um projeto no Google Cloud Console
2. Ative a Google Sheets API
3. Crie uma chave de API
4. Crie uma planilha do Google com as seguintes abas:
   - `users`
   - `user_profiles`
   - `user_scores`
   - `user_mascots`
   - `invoices`
   - `gamification`

5. Configure as variáveis de ambiente:
```env
VITE_GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
VITE_GOOGLE_API_KEY=your-api-key
```

6. Em `src/lib/data-service.ts`, mude:
```typescript
return false; // Para localStorage
// Para:
return !!(hasSpreadsheetId && hasApiKey); // Para Google Sheets
```

### Para usar apenas localStorage (padrão)

Nenhuma configuração adicional é necessária. O sistema usa localStorage automaticamente.

## Estrutura das Planilhas (Google Sheets)

### users
| id | email | password_hash | created_at | updated_at |

### user_profiles
| id | user_id | email | consumer_type | location | property_size | people_count | energy_preference | created_at | updated_at |

### user_scores
| id | user_id | score | level | created_at | updated_at |

### user_mascots
| id | user_id | name | emoji | color_palette | border_effect | created_at | updated_at |

### invoices
| id | user_id | consumption | total_value | tax_percentage | peak_hours | month | file_url | file_name | created_at | updated_at |

### gamification
| id | user_id | coins | achievements | completed_missions | current_streak | total_points | created_at | updated_at |

## Funcionalidades

### ✅ Implementadas
- Autenticação local (login/registro/logout)
- Perfis de usuário
- Scores e níveis
- Mascotes personalizáveis
- Faturas (CRUD completo)
- Upload de arquivos (simulado)
- Gamificação
- Leaderboard

### ⚠️ Limitações
- Reset de senha simulado (não envia email real)
- Upload de arquivos simulado (não usa Google Drive real)
- Sem sincronização em tempo real
- Cache local por 5 minutos (Google Sheets)

## Vantagens da Migração

1. **Sem dependências externas** - Funciona offline
2. **Custo zero** - Não precisa de Supabase Pro
3. **Flexibilidade** - Pode alternar entre Google Sheets e localStorage
4. **Simplicidade** - Menos complexidade para MVP
5. **Controle total** - Dados ficam em suas planilhas

## Desvantagens

1. **Performance** - Google Sheets pode ser mais lento
2. **Limites da API** - Google Sheets tem limites de requisições
3. **Segurança** - Menos recursos de segurança que Supabase
4. **Escalabilidade** - Limitado para muitos usuários simultâneos

## Próximos Passos

1. **Testar funcionalidades** - Verificar se tudo funciona
2. **Configurar Google Sheets** (opcional)
3. **Implementar upload real** para Google Drive
4. **Melhorar segurança** da autenticação local
5. **Adicionar sincronização** em tempo real

## Rollback

Se precisar voltar ao Supabase:
1. Reverta os commits desta branch
2. Restaure as variáveis de ambiente do Supabase
3. Execute as migrações do Supabase

## Suporte

Para dúvidas sobre a migração, consulte:
- Documentação do Google Sheets API
- Código dos adaptadores em `src/lib/`
- Logs do console para debug 