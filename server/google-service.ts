import { google } from 'googleapis';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { Readable } from 'stream';
import fs from 'fs';

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
export async function initializeGoogleApis() {
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
    if (rows.length === 0) {
        console.log(`[Google Service] A aba '${SHEETS.INVOICES}' está vazia ou não foi encontrada.`);
        return [];
    }
    const headers = rows[0];
    const userInvoices = rows.slice(1).filter(row => row[headers.indexOf('user_id')] === userId);
    
    console.log(`[Google Service] Encontradas ${userInvoices.length} faturas para ${userId}`);
    return userInvoices.map(row => rowToObject(row, headers));
}

export async function uploadInvoice(userId: string, filePath: string, originalName: string) {
    const driveApi = await getDriveApi();
    const fileMetadata = {
        name: originalName,
        parents: [DRIVE_FOLDER_ID]
    };
    const media = {
        mimeType: 'application/pdf',
        body: fs.createReadStream(filePath)
    };

    try {
        const file = await driveApi.files.create({
            resource: fileMetadata,
            media: media,
            fields: 'id, name, webViewLink'
        });
        console.log(`[Google Service] Upload para o Drive concluído. File ID: ${file.data.id}`);
        return file.data;
    } catch (error) {
        console.error('[Google Service] Erro no upload para o Drive:', error);
        throw new Error('Falha ao fazer upload do arquivo.');
    }
}

export async function saveInvoiceData(userId: string, data: any) {
    const now = new Date().toISOString();
    const invoiceId = `invoice_${Date.now()}`;

    const {
        fileId,
        fileName,
        month,
        year,
        eletricityKWh,
        eletricityPrice,
        sceeeKWh,
        sceeePrice,
        gdiKWh,
        gdiPrice,
        publicLightingContribution,
        totalValue,
        economy
    } = data;

    const row = [
        invoiceId,
        userId,
        fileId,
        fileName,
        month,
        year,
        eletricityKWh,
        eletricityPrice,
        sceeeKWh,
        sceeePrice,
        gdiKWh,
        gdiPrice,
        publicLightingContribution,
        totalValue,
        economy,
        'PENDING', // Status inicial
        now,
        now
    ];

    try {
        await appendToSheet(SHEETS.INVOICES, [row]);
        console.log(`[Google Service] Dados da fatura para ${userId} salvos na planilha.`);
    } catch (error) {
        console.error('[Google Service] Erro ao salvar dados da fatura:', error);
        throw new Error('Falha ao salvar dados da fatura na planilha.');
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

export async function getAllUsersForAdmin() {
    console.log('[Google Service] Buscando todos os usuários para o painel de admin.');
    try {
        const usersPromise = readSheet(SHEETS.USERS);
        const scoresPromise = readSheet(SHEETS.USER_SCORES);

        const [usersRows, scoresRows] = await Promise.all([usersPromise, scoresPromise]);

        if (usersRows.length < 2) return []; // Sem usuários (além do cabeçalho)

        // Mapeia scores para fácil acesso: { user_id: score, ... }
        const scoresMap = scoresRows.slice(1).reduce((acc, row) => {
            const scoreData = rowToObject(row, scoresRows[0]);
            acc[scoreData.user_id] = scoreData.score;
            return acc;
        }, {} as Record<string, number>);

        // Combina dados do usuário com seu score
        const adminUserList = usersRows.slice(1).map(row => {
            const userData = rowToObject(row, usersRows[0]);
            return {
                id: userData.id,
                email: userData.email,
                created_at: userData.created_at,
                score: scoresMap[userData.id] || 0 // Pega o score do mapa ou 0 se não encontrar
            };
        });

        console.log(`[Google Service] Encontrados ${adminUserList.length} usuários.`);
        return adminUserList;

    } catch (error) {
        console.error(`[Google Service] Erro ao buscar dados para o admin:`, error);
        throw new Error('Falha ao buscar dados de administrador');
    }
}

export async function getGamificationData(userId: string) {
    console.log(`[Google Service] Buscando dados de gamificação para user_id: ${userId}`);
    const rows = await readSheet(SHEETS.GAMIFICATION);
    if (rows.length === 0) {
        console.log(`[Google Service] A aba '${SHEETS.GAMIFICATION}' está vazia ou não foi encontrada.`);
        return null;
    }
    const headers = rows[0];
    const gamificationRow = rows.slice(1).find(row => row[headers.indexOf('user_id')] === userId);
    
    if (gamificationRow) {
        console.log(`[Google Service] Dados de gamificação encontrados para ${userId}.`);
        const data = rowToObject(gamificationRow, headers);
        // Parse JSON strings back to arrays
        data.achievements = JSON.parse(data.achievements || '[]');
        data.completed_missions = JSON.parse(data.completed_missions || '[]');
        return data;
    }
    
    console.log(`[Google Service] Dados de gamificação NÃO encontrados para ${userId}.`);
    return null;
}

export async function updateGamificationData(userId: string, updateData: any) {
    console.log(`[Google Service] Atualizando dados de gamificação para user_id: ${userId}`);
    const rows = await readSheet(SHEETS.GAMIFICATION);
    if (rows.length === 0) {
        console.log(`[Google Service] A aba '${SHEETS.GAMIFICATION}' está vazia.`);
        return;
    }

    const headers = rows[0];
    const userIndex = rows.slice(1).findIndex(row => row[headers.indexOf('user_id')] === userId);
    
    if (userIndex === -1) {
        console.log(`[Google Service] Usuário ${userId} não encontrado na aba de gamificação.`);
        return;
    }

    const rowIndex = userIndex + 1; // +1 porque userIndex é baseado em rows.slice(1)
    const updatedRow = [...rows[rowIndex]];
    const now = new Date().toISOString();

    // Atualizar campos específicos
    if (updateData.coins !== undefined) {
        updatedRow[headers.indexOf('coins')] = updateData.coins;
    }
    if (updateData.achievements !== undefined) {
        updatedRow[headers.indexOf('achievements')] = JSON.stringify(updateData.achievements);
    }
    if (updateData.completed_missions !== undefined) {
        updatedRow[headers.indexOf('completed_missions')] = JSON.stringify(updateData.completed_missions);
    }
    if (updateData.current_streak !== undefined) {
        updatedRow[headers.indexOf('current_streak')] = updateData.current_streak;
    }
    if (updateData.total_points !== undefined) {
        updatedRow[headers.indexOf('total_points')] = updateData.total_points;
    }
    
    updatedRow[headers.indexOf('updated_at')] = now;
    rows[rowIndex] = updatedRow;

    try {
        const sheetsApi = await getSheetsApi();
        await sheetsApi.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEETS.GAMIFICATION}!A${rowIndex + 1}:Z${rowIndex + 1}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [updatedRow],
            },
        });
        console.log(`[Google Service] Dados de gamificação atualizados para ${userId}.`);
    } catch (error) {
        console.error('[Google Service] Erro ao atualizar dados de gamificação:', error);
        throw new Error('Falha ao atualizar dados de gamificação na planilha.');
    }
}

export async function getLeaderboard() {
    console.log('[Google Service] Buscando leaderboard.');
    try {
        const scoresPromise = readSheet(SHEETS.USER_SCORES);
        const profilesPromise = readSheet(SHEETS.USER_PROFILES);

        const [scoresRows, profilesRows] = await Promise.all([scoresPromise, profilesPromise]);

        if (scoresRows.length < 2) return []; // Sem scores (além do cabeçalho)

        const scoreHeaders = scoresRows[0];
        const scoreData = scoresRows.slice(1);
        const profileHeaders = profilesRows[0];
        const profileData = profilesRows.slice(1);

        // Mapeia perfis para fácil acesso: { user_id: profile, ... }
        const profilesMap = profileData.reduce((acc, row) => {
            const profileData = rowToObject(row, profileHeaders);
            acc[profileData.user_id] = profileData;
            return acc;
        }, {} as Record<string, any>);

        // Combina dados do score com perfil
        const leaderboard = scoreData.map(scoreRow => {
            const scoreData = rowToObject(scoreRow, scoreHeaders);
            const profile = profilesMap[scoreData.user_id];
            
            return {
                user_id: scoreData.user_id,
                email: profile ? profile.email : 'Usuário Desconhecido',
                score: parseInt(scoreData.score) || 0,
                level: parseInt(scoreData.level) || 1
            };
        });

        // Ordena por score decrescente
        const sortedLeaderboard = leaderboard.sort((a, b) => b.score - a.score);
        
        console.log(`[Google Service] Leaderboard gerado com ${sortedLeaderboard.length} usuários.`);
        return sortedLeaderboard;

    } catch (error) {
        console.error('[Google Service] Erro ao gerar leaderboard:', error);
        throw new Error('Falha ao gerar leaderboard');
    }
}

// Adicione outras funções aqui (getInvoices, updateUser, etc.) conforme necessário 