const { google } = require('googleapis');
require('dotenv').config();

const SPREADSHEET_ID = process.env.VITE_GOOGLE_SPREADSHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.VITE_GOOGLE_PRIVATE_KEY;

async function testInvoiceSave() {
    try {
        console.log('🧪 Testando salvamento de dados de fatura...');
        
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: SERVICE_ACCOUNT_EMAIL,
                private_key: PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Dados de teste baseados nos dados reais extraídos
        const testData = {
            userId: 'test_user_123',
            fileName: 'test_invoice.pdf',
            customerNumber: '0021062553',
            month: '05',
            year: '2025',
            eletricityKWhTE: '345.000',
            eletricityKWhTotal: '345.000',
            teUnitWithTax: '0.362600',
            teUnitNoTax: '0.302240',
            tusdUnitWithTax: '0.378667',
            tusdUnitNoTax: '0.315670',
            bandeiraUnitWithTax: '0.008267',
            bandeiraUnitNoTax: '0.006841',
            bandeiraTarifaria: 'Amarela',
            eletricityPrice: '0.85',
            sceeeKWh: '0.000',
            sceeePrice: '0.00',
            gdiKWh: '0.000',
            gdiPrice: '0.00',
            publicLightingContribution: '25.50',
            totalConsumptionKwh: '345.000',
            totalValueBrl: '285.20',
            dueDate: '28/05/2025',
            historicoConsumo: [
                { mes: 'ABR/25', consumo: 338, dias: 25 },
                { mes: 'MAR/25', consumo: 494, dias: 25 }
            ],
            economy: '25.00',
            points: 100,
            diagnostico: [
                { tipo: 'sugestao', mensagem: 'Sem GD detectada. Avalie energia solar.' }
            ]
        };

        // Definir cabeçalhos em português baseados nos nomes reais da fatura
        const expectedHeaders = [
            'id',
            'user_id',
            'file_name',
            'unidade_consumidora',
            'mes',
            'ano',
            'consumo_te_kwh',
            'consumo_total_kwh',
            'tarifa_te_com_impostos',
            'tarifa_te_sem_impostos',
            'tarifa_tusd_com_impostos',
            'tarifa_tusd_sem_impostos',
            'tarifa_bandeira_com_impostos',
            'tarifa_bandeira_sem_impostos',
            'bandeira_tarifaria',
            'preco_energia_eletrica',
            'energia_scee_kwh',
            'preco_energia_scee',
            'energia_compensada_gdi_kwh',
            'preco_energia_compensada_gdi',
            'contribuicao_iluminacao_publica',
            'consumo_total_kwh_calculado',
            'valor_total_brl',
            'data_vencimento',
            'historico_consumo',
            'economia_calculada',
            'pontos_ganhos',
            'diagnostico_energetico',
            'status',
            'data_criacao',
            'data_atualizacao'
        ];

        // 1. Verificar se a aba invoices existe
        console.log('📋 Verificando aba invoices...');
        
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        const invoicesSheet = spreadsheet.data.sheets.find(s => s.properties.title === 'invoices');
        
        if (!invoicesSheet) {
            console.log('❌ Aba "invoices" não encontrada. Criando...');
            
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
                                        columnCount: expectedHeaders.length
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

        // 2. Verificar e atualizar cabeçalhos
        console.log('📊 Verificando cabeçalhos...');
        
        const headersData = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'invoices!A1:Z1',
        });

        const currentHeaders = headersData.data.values?.[0] || [];
        console.log('📋 Cabeçalhos atuais:', currentHeaders);

        if (currentHeaders.length === 0 || currentHeaders.join(',') !== expectedHeaders.join(',')) {
            console.log('🔄 Atualizando cabeçalhos...');
            
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: 'invoices!A1:AE1',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [expectedHeaders]
                }
            });
            
            console.log('✅ Cabeçalhos atualizados com sucesso!');
        } else {
            console.log('✅ Cabeçalhos já estão corretos');
        }

        // 3. Preparar dados de teste
        const now = new Date().toISOString();
        const invoiceId = `test_invoice_${Date.now()}`;
        
        const testRow = [
            invoiceId,
            testData.userId,
            testData.fileName,
            testData.customerNumber,
            testData.month,
            testData.year,
            testData.eletricityKWhTE,
            testData.eletricityKWhTotal,
            testData.teUnitWithTax,
            testData.teUnitNoTax,
            testData.tusdUnitWithTax,
            testData.tusdUnitNoTax,
            testData.bandeiraUnitWithTax,
            testData.bandeiraUnitNoTax,
            testData.bandeiraTarifaria,
            testData.eletricityPrice,
            testData.sceeeKWh,
            testData.sceeePrice,
            testData.gdiKWh,
            testData.gdiPrice,
            testData.publicLightingContribution,
            testData.totalConsumptionKwh,
            testData.totalValueBrl,
            testData.dueDate,
            JSON.stringify(testData.historicoConsumo),
            testData.economy,
            testData.points,
            JSON.stringify(testData.diagnostico),
            'TEST',
            now,
            now
        ];

        console.log('📝 Dados de teste preparados:', testRow);

        // 4. Tentar salvar os dados
        console.log('💾 Salvando dados de teste...');
        
        const response = await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'invoices',
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: [testRow],
            },
        });

        console.log('✅ Dados salvos com sucesso!');
        console.log('📊 Resposta da API:', response.data);

        // 5. Verificar se os dados foram salvos
        console.log('🔍 Verificando dados salvos...');
        
        const savedData = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'invoices!A2:Z',
        });

        const rows = savedData.data.values || [];
        console.log(`📊 Total de registros na aba invoices: ${rows.length}`);

        if (rows.length > 0) {
            const lastRow = rows[rows.length - 1];
            console.log('📋 Último registro salvo:', lastRow);
        }

        console.log('🎉 Teste concluído com sucesso!');

    } catch (error) {
        console.error('❌ Erro no teste:', error);
        console.error('Detalhes:', error.response?.data || error.message);
    }
}

testInvoiceSave();
