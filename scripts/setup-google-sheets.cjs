const { google } = require('googleapis');
require('dotenv').config();

// Configuração
const SPREADSHEET_ID = process.env.VITE_GOOGLE_SPREADSHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.VITE_GOOGLE_PRIVATE_KEY;

// Estrutura das abas
const SHEETS_CONFIG = {
  users: [
    ['id', 'email', 'password_hash', 'created_at', 'updated_at']
  ],
  user_profiles: [
    ['id', 'user_id', 'email', 'consumer_type', 'location', 'property_size', 'people_count', 'energy_preference', 'created_at', 'updated_at']
  ],
  user_scores: [
    ['id', 'user_id', 'score', 'level', 'created_at', 'updated_at']
  ],
  user_mascots: [
    ['id', 'user_id', 'name', 'emoji', 'color_palette', 'border_effect', 'created_at', 'updated_at']
  ],
  invoices: [
    ['id', 'user_id', 'consumption', 'total_value', 'tax_percentage', 'peak_hours', 'month', 'file_url', 'file_name', 'created_at', 'updated_at']
  ],
  gamification: [
    ['id', 'user_id', 'coins', 'achievements', 'completed_missions', 'current_streak', 'total_points', 'created_at', 'updated_at']
  ]
};

async function setupGoogleSheets() {
  try {
    // Configurar autenticação
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: SERVICE_ACCOUNT_EMAIL,
        private_key: PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('🔧 Verificando acesso à planilha...');
    try {
      await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
        fields: 'spreadsheetId', // Apenas para verificar a existência
      });
      console.log('✅ Acesso à planilha confirmado.');
    } catch (e) {
      console.error('\n❌ ERRO FATAL: Não foi possível encontrar a planilha com o ID fornecido.');
      console.error(`👉 ID da planilha que falhou: ${SPREADSHEET_ID}`);
      console.error('\n   Por favor, verifique estes dois pontos com atenção:');
      console.error('   1. O valor de "VITE_GOOGLE_SPREADSHEET_ID" no seu arquivo .env está 100% correto?');
      console.error('   2. A planilha foi compartilhada com o e-mail da Service Account como "Editor"?');
      console.error(`      E-mail da Service Account: ${SERVICE_ACCOUNT_EMAIL}\n`);
      // console.error('Detalhes do erro técnico:', e.message);
      process.exit(1);
    }

    console.log('🚀 Iniciando configuração das abas...');

    // Criar ou limpar abas existentes
    for (const [sheetName, headers] of Object.entries(SHEETS_CONFIG)) {
      console.log(`📋 Configurando aba: ${sheetName}`);
      
      try {
        // Tentar criar a aba
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: sheetName,
                    gridProperties: {
                      rowCount: 1000,
                      columnCount: headers[0].length
                    }
                  }
                }
              }
            ]
          }
        });
        console.log(`✅ Aba ${sheetName} criada`);
      } catch (error) {
        if (error.code === 400 && error.message && error.message.includes('already exists')) {
          console.log(`ℹ️ Aba ${sheetName} já existe, pulando criação...`);
        } else {
          console.error(`❌ Erro ao processar aba ${sheetName}:`, error.message);
          continue;
        }
      }

      // Adicionar cabeçalhos
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:${String.fromCharCode(65 + headers[0].length - 1)}1`,
        valueInputOption: 'RAW',
        resource: { values: [headers[0]] }
      });

      // Formatar cabeçalhos
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [
            {
              repeatCell: {
                range: {
                  sheetId: await getSheetId(sheets, SPREADSHEET_ID, sheetName),
                  startRowIndex: 0,
                  endRowIndex: 1,
                  startColumnIndex: 0,
                  endColumnIndex: headers[0].length
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                    textFormat: {
                      bold: true,
                      foregroundColor: { red: 1, green: 1, blue: 1 }
                    }
                  }
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)'
              }
            }
          ]
        }
      });

      console.log(`✅ Cabeçalhos da aba ${sheetName} configurados`);
    }

    console.log('🎉 Google Sheets configurado com sucesso!');
    console.log(`📊 URL da planilha: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`);

  } catch (error) {
    console.error('❌ Erro inesperado durante a configuração:', error);
    process.exit(1);
  }
}

async function getSheetId(sheets, spreadsheetId, sheetName) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId: spreadsheetId,
  });
  
  const sheet = response.data.sheets.find(s => s.properties.title === sheetName);
  return sheet ? sheet.properties.sheetId : null;
}

// Executar se chamado diretamente
if (require.main === module) {
  if (!SPREADSHEET_ID || !SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || SPREADSHEET_ID === 'your-spreadsheet-id-here') {
    console.error('❌ Variáveis de ambiente não configuradas corretamente!');
    console.log('📝 Verifique se as seguintes variáveis no arquivo .env estão com valores válidos:');
    console.log('- VITE_GOOGLE_SPREADSHEET_ID');
    console.log('- VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL');
    console.log('- VITE_GOOGLE_PRIVATE_KEY');
    process.exit(1);
  }

  setupGoogleSheets();
}

module.exports = { setupGoogleSheets }; 