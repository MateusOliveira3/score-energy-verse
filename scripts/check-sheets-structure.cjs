const { google } = require('googleapis');
require('dotenv').config();

const SPREADSHEET_ID = process.env.VITE_GOOGLE_SPREADSHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.VITE_GOOGLE_PRIVATE_KEY;

async function checkAndSetupSheets() {
    try {
        console.log('🔍 Verificando estrutura da planilha...');
        
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: SERVICE_ACCOUNT_EMAIL,
                private_key: PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Verificar se a planilha existe
        console.log('📋 Verificando planilha:', SPREADSHEET_ID);
        
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        console.log('✅ Planilha encontrada:', spreadsheet.data.properties.title);
        console.log('📄 Abas existentes:', spreadsheet.data.sheets.map(s => s.properties.title));

        // 2. Verificar se a aba 'invoices' existe
        const invoicesSheet = spreadsheet.data.sheets.find(s => s.properties.title === 'invoices');
        
        if (!invoicesSheet) {
            console.log('❌ Aba "invoices" não encontrada. Criando...');
            
            // Criar a aba invoices
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: {
                                    title: 'invoices',
                                    gridProperties: {
                                        rowCount: 1000,
                                        columnCount: 20
                                    }
                                }
                            }
                        }
                    ]
                }
            });
            
            console.log('✅ Aba "invoices" criada com sucesso!');
        } else {
            console.log('✅ Aba "invoices" já existe');
        }

        // 3. Verificar cabeçalhos da aba invoices
        console.log('📊 Verificando cabeçalhos da aba invoices...');
        
        const invoicesData = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'invoices!A1:Z1',
        });

        const headers = invoicesData.data.values?.[0] || [];
        console.log('📋 Cabeçalhos atuais:', headers);

        // 4. Definir cabeçalhos esperados
        const expectedHeaders = [
            'id',
            'user_id',
            'file_name',
            'month',
            'year',
            'eletricityKWh',
            'eletricityPrice',
            'sceeeKWh',
            'sceeePrice',
            'gdiKWh',
            'gdiPrice',
            'publicLightingContribution',
            'totalValue',
            'economy',
            'points',
            'diagnostico',
            'status',
            'created_at',
            'updated_at'
        ];

        // 5. Se não há cabeçalhos ou estão diferentes, criar/atualizar
        if (headers.length === 0 || headers.join(',') !== expectedHeaders.join(',')) {
            console.log('🔄 Atualizando cabeçalhos da aba invoices...');
            
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: 'invoices!A1:S1',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [expectedHeaders]
                }
            });
            
            console.log('✅ Cabeçalhos atualizados com sucesso!');
        } else {
            console.log('✅ Cabeçalhos já estão corretos');
        }

        // 6. Verificar dados existentes
        const allData = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'invoices!A2:Z',
        });

        const rows = allData.data.values || [];
        console.log(`📊 Total de registros na aba invoices: ${rows.length}`);

        if (rows.length > 0) {
            console.log('📋 Últimos 3 registros:');
            rows.slice(-3).forEach((row, index) => {
                console.log(`  ${index + 1}:`, row.slice(0, 5).join(' | '));
            });
        }

        console.log('🎉 Verificação concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao verificar planilha:', error);
        console.error('Detalhes:', error.response?.data || error.message);
    }
}

checkAndSetupSheets();
