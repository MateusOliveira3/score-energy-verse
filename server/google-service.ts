import { google } from 'googleapis';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { Readable } from 'stream';

dotenv.config();

// Configuração
const SPREADSHEET_ID = process.env.VITE_GOOGLE_SPREADSHEET_ID;
const SERVICE_ACCOUNT_EMAIL = process.env.VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.VITE_GOOGLE_PRIVATE_KEY;
const DRIVE_FOLDER_ID = process.env.VITE_GOOGLE_DRIVE_FOLDER_ID;

// Abas da Planilha
const SHEETS = {
    USERS: 'users',
    USER_PROFILES: 'user_profiles',
    USER_SCORES: 'user_scores',
    USER_MASCOTS: 'user_mascots',
    INVOICES: 'invoices',
    GAMIFICATION: 'gamification'
};

let sheets: any;
let drive: any;

// Função de inicialização
async function initializeGoogleApis() {
    if (sheets && drive) return;

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: SERVICE_ACCOUNT_EMAIL,
                private_key: PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ],
        });

        sheets = google.sheets({ version: 'v4', auth });
        drive = google.drive({ version: 'v3', auth });

        console.log('✅ Google Sheets & Drive Services Conectados.');
    } catch (error) {
        console.error('❌ Erro ao inicializar Google Services:', error);
        throw new Error('Falha na conexão com APIs do Google');
    }
}

// Função de inicialização
async function getSheetsApi() {
    if (!sheets) await initializeGoogleApis();
    return sheets;
}

async function getDriveApi() {
    if (!drive) await initializeGoogleApis();
    return drive;
}

// Helpers
async function readSheet(sheetName: string) {
    const sheetsApi = await getSheetsApi();
    try {
        const response = await sheetsApi.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: sheetName,
        });
        return response.data.values || [];
    } catch (error) {
        console.error(`Erro ao ler a aba ${sheetName}:`, error);
        return [];
    }
}

async function appendToSheet(sheetName: string, rows: any[][]) {
    const sheetsApi = await getSheetsApi();
    try {
        await sheetsApi.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: sheetName,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: rows,
            },
        });
    } catch (error) {
        console.error(`Erro ao adicionar dados na aba ${sheetName}:`, error);
        throw new Error(`Falha ao escrever na aba ${sheetName}`);
    }
}

function rowToObject(row: any[], headers: string[]) {
    const obj: any = {};
    headers.forEach((header, index) => {
        obj[header] = row[index];
    });
    return obj;
}


// --- Funções do Serviço ---

export async function signInUser(email: string, password_plain: string) {
    console.log(`[Google Service] Tentando login para: ${email}`);
    const rows = await readSheet(SHEETS.USERS);
    if (rows.length === 0) {
        console.log(`[Google Service] A aba '${SHEETS.USERS}' está vazia.`);
        return null;
    }

    const headers = rows[0];
    const emailIndex = headers.indexOf('email');
    const passwordHashIndex = headers.indexOf('password_hash');

    if (emailIndex === -1 || passwordHashIndex === -1) {
        console.error("[Google Service] Cabeçalhos 'email' ou 'password_hash' não encontrados na planilha 'users'.");
        return null;
    }

    const userRow = rows.slice(1).find(row => row[emailIndex] === email);

    if (!userRow) {
        console.log(`[Google Service] Usuário ${email} não encontrado.`);
        return null;
    }

    const passwordHash = userRow[passwordHashIndex];
    const isMatch = await bcrypt.compare(password_plain, passwordHash);

    if (isMatch) {
        console.log(`[Google Service] Senha correta para ${email}.`);
        return rowToObject(userRow, headers);
    } else {
        console.log(`[Google Service] Senha incorreta para ${email}.`);
        return null;
    }
}

export async function getUserProfile(userId: string) {
    console.log(`[Google Service] Buscando perfil para user_id: ${userId}`);
    const rows = await readSheet(SHEETS.USER_PROFILES);
    if (rows.length === 0) {
        console.log(`[Google Service] A aba '${SHEETS.USER_PROFILES}' está vazia ou não foi encontrada.`);
        return null;
    }

    const headers = rows[0];
    const userProfileRow = rows.slice(1).find(row => row[headers.indexOf('user_id')] === userId);
    
    if (userProfileRow) {
        console.log(`[Google Service] Perfil encontrado para ${userId}.`);
        return rowToObject(userProfileRow, headers);
    }
    
    console.log(`[Google Service] Perfil NÃO encontrado para ${userId}.`);
    return null;
}

export async function createUser(email: string, passwordHash: string) {
    const userId = `user_${Date.now()}`;
    const now = new Date().toISOString();

    // 1. Adicionar ao 'users'
    const userRow = [userId, email, passwordHash, now, now];
    await appendToSheet(SHEETS.USERS, [userRow]);
    console.log(`[Google Service] Usuário ${email} criado na aba 'users'.`);

    // 2. Adicionar ao 'user_profiles'
    const profileRow = [
        `profile_${Date.now()}`, userId, email,
        'Residencial', '', 0, 1, 'Convencional', now, now
    ];
    await appendToSheet(SHEETS.USER_PROFILES, [profileRow]);
    console.log(`[Google Service] Perfil para ${email} criado.`);

    // 3. Adicionar ao 'user_scores'
    const scoreRow = [`score_${Date.now()}`, userId, 0, 1, now, now];
    await appendToSheet(SHEETS.USER_SCORES, [scoreRow]);
    console.log(`[Google Service] Score inicial para ${email} criado.`);
    
    // 4. Adicionar ao 'user_mascots'
    const mascotRow = [
        `mascot_${Date.now()}`, userId, 'EcoFriend', '🌱',
        'emerald', 'none', now, now
    ];
    await appendToSheet(SHEETS.USER_MASCOTS, [mascotRow]);
    console.log(`[Google Service] Mascote para ${email} criado.`);

    // 5. Adicionar ao 'gamification'
    const gamificationRow = [
        `game_${Date.now()}`, userId, 0, '[]', '[]', 0, 0, now, now
    ];
    await appendToSheet(SHEETS.GAMIFICATION, [gamificationRow]);
    console.log(`[Google Service] Dados de gamificação para ${email} criados.`);

    return { id: userId, email };
}

export async function getInvoices(userId: string) {
    console.log(`[Google Service] Buscando faturas para user_id: ${userId}`);
    const rows = await readSheet(SHEETS.INVOICES);

    if (rows.length <= 1) { // Menor ou igual a 1 para contar o cabeçalho
        console.log(`[Google Service] A aba '${SHEETS.INVOICES}' não tem dados.`);
        return [];
    }

    const headers = rows[0];
    const userIdIndex = headers.indexOf('user_id');

    const userInvoices = rows
        .slice(1) // Pular o cabeçalho
        .filter(row => row[userIdIndex] === userId)
        .map(row => rowToObject(row, headers));
    
    console.log(`[Google Service] Encontradas ${userInvoices.length} faturas para ${userId}.`);
    return userInvoices;
}

export async function uploadFileToDrive(file: Express.Multer.File, userId: string) {
    if (!DRIVE_FOLDER_ID) {
        const errorMessage = "Configuração do servidor incompleta: VITE_GOOGLE_DRIVE_FOLDER_ID não foi definido no arquivo .env";
        console.error(`[Google Service] ${errorMessage}`);
        throw new Error(errorMessage);
    }

    const driveApi = await getDriveApi();
    console.log(`[Google Service] Fazendo upload do arquivo ${file.originalname} para o usuário ${userId}`);
    
    try {
        const fileMetadata = {
            name: `${userId}_${Date.now()}_${file.originalname}`,
            parents: [DRIVE_FOLDER_ID]
        };
        const media = {
            mimeType: file.mimetype,
            body: Readable.from(file.buffer),
        };

        const response = await driveApi.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink'
        });
        
        console.log(`[Google Service] Upload concluído. File ID: ${response.data.id}`);
        return {
            id: response.data.id,
            url: response.data.webViewLink
        };
    } catch (error) {
        console.error(`[Google Service] Erro no upload para o Drive:`, error);
        throw new Error('Falha ao enviar arquivo para o Google Drive');
    }
}

export async function createInvoiceRecord(invoiceData: any) {
    console.log('[Google Service] Registrando nova fatura na planilha:', invoiceData);
    try {
        const {
            user_id,
            month,
            consumption,
            total_value,
            tax_percentage,
            peak_hours,
            file_url,
            file_name,
        } = invoiceData;

        // Cabeçalhos: user_id, month, consumption, total_value, tax_percentage, peak_hours, file_url, file_name, created_at, points_earned
        const newRow = [
            user_id,
            month,
            consumption,
            total_value,
            tax_percentage,
            peak_hours,
            file_url,
            file_name,
            new Date().toISOString(),
            100 // Pontos ganhos (exemplo fixo)
        ];

        await appendToSheet(SHEETS.INVOICES, [newRow]);
        console.log('[Google Service] Fatura registrada com sucesso.');
    } catch (error) {
        console.error(`[Google Service] Erro ao registrar fatura na planilha:`, error);
        throw new Error('Falha ao registrar fatura na planilha');
    }
}

async function findRowByValue(sheetName: string, columnIndex: number, value: string) {
    const rows = await readSheet(sheetName);
    if (rows.length === 0) {
        console.log(`[Google Service] A aba '${sheetName}' está vazia.`);
        return null;
    }

    const headers = rows[0];
    const row = rows.slice(1).find(row => row[columnIndex] === value);
    
    if (row) {
        console.log(`[Google Service] Linha encontrada para ${value} na aba '${sheetName}'.`);
        return rowToObject(row, headers);
    }
    
    console.log(`[Google Service] Linha NÃO encontrada para ${value} na aba '${sheetName}'.`);
    return null;
}

// Adicione outras funções aqui (getInvoices, updateUser, etc.) conforme necessário 