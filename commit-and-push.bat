@echo off
echo 🚀 Fazendo commit e push da branch Final1.2_Eletrobras...

echo.
echo 📊 Status atual do git:
git status

echo.
echo 📦 Adicionando todos os arquivos...
git add .

echo.
echo 💾 Fazendo commit das mudanças...
git commit -m "Final1.2: Sistema completo de correção automática de tarifas implementado

- ✅ Funções utilitárias num.ts para parsing robusto de números
- ✅ Parser de faturas integrado com funções utilitárias  
- ✅ Rota /api/admin/fix-tariffs-once para correção automática
- ✅ Função detectAndFixTariffsOnce para Google Sheets
- ✅ Helpers locais para extração de tarifas e preços
- ✅ Integração completa com sistema existente
- ✅ Documentação e exemplos de uso incluídos"

echo.
echo 🚀 Fazendo push para o GitHub...
git push origin Final1.2_Eletrobras

echo.
echo ✅ Commit e push concluídos com sucesso!
echo 🎯 Branch Final1.2_Eletrobras atualizada no GitHub
echo.
echo 💡 Para continuar trabalhando, você pode:
echo    - Fazer mais commits nesta branch
echo    - Fazer push novamente quando necessário
echo    - Criar uma nova branch quando quiser
echo.
pause

