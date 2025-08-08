const { google } = require('googleapis');
require('dotenv').config();

// Configuração
const SERVICE_ACCOUNT_EMAIL = process.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.VITE_GOOGLE_PRIVATE_KEY;

async function checkSharedDrives() {
    try {
        console.log('🔧 Verificando Shared Drives disponíveis...');
        
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

        // Listar Shared Drives
        console.log('📁 Listando Shared Drives...');
        try {
            const sharedDrives = await drive.drives.list({
                fields: 'drives(id, name, capabilities)',
                pageSize: 10
            });
            
            if (sharedDrives.data.drives && sharedDrives.data.drives.length > 0) {
                console.log('✅ Shared Drives encontrados:');
                sharedDrives.data.drives.forEach(drive => {
                    console.log(`   - ${drive.name} (ID: ${drive.id})`);
                    console.log(`     Capacidades: ${JSON.stringify(drive.capabilities)}`);
                });
            } else {
                console.log('❌ Nenhum Shared Drive encontrado.');
                console.log('💡 Você precisa criar um Shared Drive para resolver o problema.');
            }
        } catch (error) {
            console.error('❌ Erro ao listar Shared Drives:', error.message);
        }

        console.log('🎉 Verificação concluída!');
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

checkSharedDrives(); 