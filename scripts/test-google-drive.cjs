const { google } = require('googleapis');
require('dotenv').config();

// Configuração
const SERVICE_ACCOUNT_EMAIL = process.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.VITE_GOOGLE_PRIVATE_KEY;
const DRIVE_FOLDER_ID = process.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

async function testGoogleDrive() {
    try {
        console.log('🔧 Testando conexão com Google Drive...');
        
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: SERVICE_ACCOUNT_EMAIL,
                private_key: PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: [
                'https://www.googleapis.com/auth/drive'
            ],
        });

        const drive = google.drive({ version: 'v3', auth });

        // Teste 1: Verificar se consegue acessar a pasta
        console.log('📁 Testando acesso à pasta...');
        try {
            const folder = await drive.files.get({
                fileId: DRIVE_FOLDER_ID,
                fields: 'id, name, permissions'
            });
            console.log('✅ Pasta acessada com sucesso:', folder.data.name);
        } catch (error) {
            console.error('❌ Erro ao acessar pasta:', error.message);
            return;
        }

        // Teste 2: Listar arquivos na pasta
        console.log('📋 Listando arquivos na pasta...');
        try {
            const files = await drive.files.list({
                q: `'${DRIVE_FOLDER_ID}' in parents and trashed=false`,
                fields: 'files(id, name, mimeType)',
                pageSize: 10
            });
            console.log('✅ Arquivos encontrados:', files.data.files.length);
            files.data.files.forEach(file => {
                console.log(`   - ${file.name} (${file.mimeType})`);
            });
        } catch (error) {
            console.error('❌ Erro ao listar arquivos:', error.message);
        }

        // Teste 3: Tentar criar uma pasta de teste
        console.log('📁 Testando criação de pasta...');
        try {
            const testFolder = await drive.files.create({
                requestBody: {
                    name: `test-${Date.now()}`,
                    mimeType: 'application/vnd.google-apps.folder',
                    parents: [DRIVE_FOLDER_ID],
                },
                fields: 'id, name',
            });
            console.log('✅ Pasta de teste criada:', testFolder.data.name);
            
            // Deletar a pasta de teste
            await drive.files.delete({
                fileId: testFolder.data.id
            });
            console.log('🗑️ Pasta de teste removida');
        } catch (error) {
            console.error('❌ Erro ao criar pasta:', error.message);
            console.error('Detalhes do erro:', error);
        }

        console.log('🎉 Teste do Google Drive concluído!');
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

testGoogleDrive(); 