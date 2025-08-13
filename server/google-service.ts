import { google } from 'googleapis';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { Readable } from 'stream';
import fs from 'fs';
import { asSheetNumber, toNumberBR, normalizeTariffUnit } from './lib/num';


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
        
        // Garantir que a aba de diagnóstico esteja pronta
        await ensureDiagnosisSheetReady();
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
        console.log(`[Google Service] Tentando adicionar ${rows.length} linha(s) na aba ${sheetName}`);
        console.log(`[Google Service] Dados a serem inseridos:`, rows);
        
        const response = await sheetsApi.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: sheetName,
            valueInputOption: 'USER_ENTERED',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values: rows,
            },
        });
        
        console.log(`[Google Service] Dados adicionados com sucesso na aba ${sheetName}`);
        console.log(`[Google Service] Resposta da API:`, response.data);
        
    } catch (error) {
        console.error(`[Google Service] Erro ao adicionar dados na aba ${sheetName}:`, error);
        console.error(`[Google Service] Detalhes do erro:`, error.response?.data || error.message);
        throw new Error(`Falha ao escrever na aba ${sheetName}: ${error.message}`);
    }
}

function rowToObject(row: any[], headers: string[]) {
    const obj: any = {};
    headers.forEach((header, index) => {
        obj[header] = row[index];
    });
    return obj;
}

// --- Novas Utilidades para Sheets ---

async function sheetExists(sheetName: string): Promise<boolean> {
    try {
        const sheetsApi = await getSheetsApi();
        await sheetsApi.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A1:Z1`,
        });
        console.log(`[SHEETS] A aba '${sheetName}' existe e tem cabeçalho.`);
        return true;
    } catch (error) {
        console.log(`[SHEETS] A aba '${sheetName}' não existe ou não tem cabeçalho.`);
        return false;
    }
}

async function ensureSheetHeaders(sheetName: string, headers: string[]): Promise<void> {
    try {
        const exists = await sheetExists(sheetName);
        
        if (!exists) {
            console.log(`[SHEETS] Criando nova aba '${sheetName}' com cabeçalhos...`);
            const sheetsApi = await getSheetsApi();
            
            // Criar nova aba
            await sheetsApi.spreadsheets.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: sheetName
                            }
                        }
                    }]
                }
            });
            
            console.log(`[SHEETS] Aba '${sheetName}' criada com sucesso.`);
        }
        
        // Garantir que a linha 1 tenha exatamente os headers
        const sheetsApi = await getSheetsApi();
        const range = `${sheetName}!A1:${columnNumberToA1(headers.length)}1`;
        
        await sheetsApi.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [headers]
            }
        });
        
        console.log(`[SHEETS] Cabeçalhos da aba '${sheetName}' configurados com sucesso.`);
    } catch (error) {
        console.error(`[SHEETS] Erro ao configurar aba '${sheetName}':`, error);
        throw new Error(`Falha ao configurar aba ${sheetName}: ${error.message}`);
    }
}

export async function ensureDiagnosisSheetReady(): Promise<void> {
    console.log('[SHEETS] Verificando se a aba invoices_diagnosis está pronta...');
    
    // Padronizando cabeçalhos em português para consistência com aba invoices
    const headers = [
        'id', 'user_id', 'mes', 'ano', 'consumo_kwh', 'valor_total_brl',
        'tem_reativo', 'tem_gd', 'tarifa', 'valor_por_kwh', 'score_total',
        'score_detalhado_json', 'recomendacoes_json', 'data_criacao'
    ];
    
    await ensureSheetHeaders('invoices_diagnosis', headers);
    console.log('[SHEETS] Aba invoices_diagnosis está pronta para uso.');
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

// Função auxiliar para buscar ou criar pasta do usuário no Drive
async function getOrCreateUserFolder(driveApi: any, userEmail: string, parentFolderId: string) {
    // Procurar pasta existente
    const res = await driveApi.files.list({
        q: `name='${userEmail}' and mimeType='application/vnd.google-apps.folder' and '${parentFolderId}' in parents and trashed=false`,
        fields: 'files(id, name)',
    });
    if (res.data.files.length > 0) {
        return res.data.files[0].id;
    }
    // Criar nova pasta
    const folder = await driveApi.files.create({
        requestBody: {
            name: userEmail,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentFolderId],
        },
        fields: 'id',
    });
    return folder.data.id;
}



export async function saveInvoiceData(userId, data) {
  const now = new Date().toISOString();
  const invoiceId = `invoice_${Date.now()}`;

  const kwh_te    = asSheetNumber(data.eletricityKWh, 3);
  const kwh_sceee = asSheetNumber(data.sceeeKWh, 3);
  const kwh_gdi   = asSheetNumber(data.gdiKWh, 3);
  const totalKwh  = asSheetNumber(data.totalConsumptionKwh ?? (kwh_te + kwh_sceee), 3);
  const totalBRL  = asSheetNumber(data.totalValueBrl, 2);

  const te_com    = asSheetNumber(normalizeTariffUnit(data.tarifa_te_com_impostos), 3);
  const te_sem    = asSheetNumber(normalizeTariffUnit(data.tarifa_te_sem_impostos), 3);
  const tusd_com  = asSheetNumber(normalizeTariffUnit(data.tarifa_tusd_com_impostos), 3);
  const tusd_sem  = asSheetNumber(normalizeTariffUnit(data.tarifa_tusd_sem_impostos), 3);
  const band_com  = asSheetNumber(normalizeTariffUnit(data.tarifa_bandeira_com_impostos), 3);
  const band_sem  = asSheetNumber(normalizeTariffUnit(data.tarifa_bandeira_sem_impostos), 3);

  const row = [
    invoiceId,
    userId,
    data.fileName ?? '',
    data.customerNumber ?? '',
    asSheetNumber(data.month, 0),
    asSheetNumber(data.year, 0),
    kwh_te,
    asSheetNumber(totalKwh, 3), // consumo_total_kwh
    te_com,
    te_sem,
    tusd_com,
    tusd_sem,
    band_com,
    band_sem,
    data.bandeira_tarifaria || '',
    asSheetNumber(data.preco_energia_eletrica, 3),
    kwh_sceee,
    asSheetNumber(data.sceeePrice, 3),
    kwh_gdi,
    asSheetNumber(data.gdiPrice, 3),
    asSheetNumber(data.publicLightingContribution, 2),
    asSheetNumber(totalKwh, 3), // consumo_total_kwh_calculado (se existir)
    asSheetNumber(totalBRL, 2),
    data.dueDate || '',
    JSON.stringify(data.historico_consumo ?? data.consumoHistorico ?? []),
    asSheetNumber(data.economy, 2),
    asSheetNumber(data.points, 0),
    JSON.stringify(data.diagnostico_energetico ?? []),
    'PROCESSED',
    now,
    now,
  ];

  await appendToSheet(SHEETS.INVOICES, [row]);
  console.log(`[Google Service] Dados da fatura para ${userId} salvos na planilha (invoices).`);
}

// Função para garantir que a aba invoices existe e tem a estrutura correta
async function ensureInvoicesSheetStructure(expectedHeaders: string[]) {
    try {
        const sheetsApi = await getSheetsApi();
        
        // 1. Verificar se a planilha existe
        const spreadsheet = await sheetsApi.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });
        
        // 2. Verificar se a aba 'invoices' existe
        const invoicesSheet = spreadsheet.data.sheets.find(s => s.properties.title === SHEETS.INVOICES);
        
        if (!invoicesSheet) {
            console.log(`[Google Service] Aba "${SHEETS.INVOICES}" não encontrada. Criando...`);
            
            // Criar a aba invoices
            await sheetsApi.spreadsheets.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                requestBody: {
                    requests: [
                        {
                            addSheet: {
                                properties: {
                                    title: SHEETS.INVOICES,
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
            
            console.log(`[Google Service] Aba "${SHEETS.INVOICES}" criada com sucesso!`);
        }
        
        // 3. Verificar cabeçalhos da aba invoices
        let currentHeaders: string[] = [];
        try {
            const headersData = await sheetsApi.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEETS.INVOICES}!A1:Z1`,
            });
            currentHeaders = (headersData.data.values?.[0] || []) as string[];
        } catch (error) {
            console.log(`[Google Service] Erro ao ler cabeçalhos existentes, criando novos...`);
            currentHeaders = [];
        }
        
        console.log(`[Google Service] Cabeçalhos atuais da aba ${SHEETS.INVOICES}:`, currentHeaders);
        
        // 4. Se não há cabeçalhos ou estão diferentes, criar/atualizar
        if (currentHeaders.length === 0 || currentHeaders.join(',') !== expectedHeaders.join(',')) {
            console.log(`[Google Service] Atualizando cabeçalhos da aba ${SHEETS.INVOICES}...`);
            
            // Calcular a última coluna baseada no número de cabeçalhos (suporta além de Z)
            const lastColumn = columnNumberToA1(expectedHeaders.length);
            
            await sheetsApi.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${SHEETS.INVOICES}!A1:${lastColumn}1`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [expectedHeaders]
                }
            });
            
            console.log(`[Google Service] Cabeçalhos da aba ${SHEETS.INVOICES} atualizados com sucesso!`);
        } else {
            console.log(`[Google Service] Cabeçalhos da aba ${SHEETS.INVOICES} já estão corretos`);
        }
        
    } catch (error) {
        console.error(`[Google Service] Erro ao verificar/criar estrutura da aba ${SHEETS.INVOICES}:`, error);
        throw error;
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

// ------------------------------------------------------------------
// Persistência da análise consultiva em `invoices_diagnosis`
// ------------------------------------------------------------------
import type { InvoiceParsed, ConsultativeScore } from './lib/types.js';

export async function saveTechnicalAnalysis(userId: string, payload: {
  month: number; year: number; consumption_kwh: number; total_value_brl: number; value_per_kwh: number;
  has_reactive: boolean; has_gd: boolean; tariff: string;
  score_total: number; score_breakdown_json: string; recommendations_json: string[]; created_at: string;
}) {
  const id = `analysis_${Date.now()}`;
  const row = [
    id,
    userId,
    asSheetNumber(payload.month, 0),
    asSheetNumber(payload.year, 0),
    asSheetNumber(payload.consumption_kwh, 3),
    asSheetNumber(payload.total_value_brl, 2),
    String(payload.has_reactive).toUpperCase(),
    String(payload.has_gd).toUpperCase(),
    payload.tariff,
    asSheetNumber(payload.value_per_kwh, 3),
    asSheetNumber(payload.score_total, 0),
    payload.score_breakdown_json,
    JSON.stringify(payload.recommendations_json || []),
    payload.created_at,
  ];
  await appendToSheet('invoices_diagnosis', [row]);
  console.log(`[Google Service] Diagnóstico salvo (invoices_diagnosis) para ${userId}.`);
}

import type { DiagnosisItem, DiagnosisListOptions, DiagnosisListResponse } from './lib/types.js';

// Aceita PT/EN nos cabeçalhos e normaliza a saída em inglês.
// Suporta paginação opcional via options { limit, cursor }.
// Compatível: sem options → retorna array simples.
export async function getDiagnosisByUser(
  userId: string,
  options?: DiagnosisListOptions
): Promise<DiagnosisItem[] | DiagnosisListResponse> {
  try {
    const rows = await readSheet('invoices_diagnosis');
    if (!rows || rows.length < 2) {
      return options ? { items: [], nextCursor: null } : [];
    }

    const headers = rows[0].map(String);

    const col = (...names: string[]) => {
      for (const n of names) {
        const i = headers.indexOf(n);
        if (i !== -1) return i;
      }
      return -1;
    };

    const idx = {
      id:             col('id', 'ID'),
      user_id:        col('user_id', 'usuario_id', 'userId'),
      month:          col('month', 'mes', 'mês'),
      year:           col('year', 'ano'),
      consumption:    col('consumption_kwh', 'consumo_kwh', 'consumo_total_kwh', 'consumo_te_kwh'),
      total_value:    col('total_value_brl', 'valor_total_brl', 'valor_total'),
      score_total:    col('score_total', 'pontuacao_total'),
      score_json:     col('score_breakdown_json', 'score_detalhado_json'),
      tips_json:      col('recommendations_json', 'recomendacoes_json'),
      created_at:     col('created_at', 'criado_em'),
    };

    const safeNum = (v: unknown) => {
      if (typeof v === 'number') return v;
      if (typeof v !== 'string') return 0;
      const s = v.replace(/\./g, '').replace(',', '.');
      const n = Number(s);
      return Number.isFinite(n) ? n : 0;
    };

    const safeJson = <T,>(raw: unknown, fallback: T): T => {
      try {
        if (!raw || typeof raw !== 'string') return fallback;
        return JSON.parse(raw) as T;
      } catch { return fallback; }
    };

    let all = rows
      .slice(1)
      .filter((r) => String(r[idx.user_id] ?? '') === userId)
      .map((r): DiagnosisItem => ({
        id: String(r[idx.id] ?? ''),
        user_id: String(r[idx.user_id] ?? ''),
        month: String(r[idx.month] ?? ''),
        year: String(r[idx.year] ?? ''),
        consumption_kwh: safeNum(r[idx.consumption]),
        total_value_brl: safeNum(r[idx.total_value]),
        score_total: safeNum(r[idx.score_total]),
        breakdown: safeJson(r[idx.score_json], {} as Record<string, number>),
        tips: safeJson(r[idx.tips_json], [] as string[]),
        created_at: String(r[idx.created_at] ?? ''),
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    if (!options || (!options.limit && !options.cursor)) {
      return all;
    }

    const limit = Math.max(1, Math.min(100, Number(options.limit || 20)));
    const cursor = options.cursor ? new Date(options.cursor) : null;

    if (cursor && !isNaN(cursor.getTime())) {
      all = all.filter((it) => new Date(it.created_at).getTime() < cursor.getTime());
    }

    const page = all.slice(0, limit);
    const next = page.length === limit ? page[page.length - 1].created_at : null;

    const resp: DiagnosisListResponse = {
      items: page,
      nextCursor: next,
    };
    return resp;
  } catch (err) {
    console.error('[SHEETS] getDiagnosisByUser: erro ao ler/normalizar:', err);
    return options ? { items: [], nextCursor: null } : [];
  }
}

// Converte número da coluna (1-based) para notação A1 (A, Z, AA, AB, ...)
function columnNumberToA1(columnNumber: number): string {
    let result = '';
    let n = columnNumber;
    while (n > 0) {
        const rem = (n - 1) % 26;
        result = String.fromCharCode(65 + rem) + result;
        n = Math.floor((n - 1) / 26);
    }
    return result;
}

// ====== Tariff maintenance (one-shot) ======
type FixResult = { updated: number; checked: number };

export async function detectAndFixTariffsOnce(): Promise<FixResult> {
  const sheetsApi = await getSheetsApi();

  const resp = await sheetsApi.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID!,
    range: SHEETS.INVOICES,
  });
  const rows = (resp.data.values || []) as string[][];
  if (rows.length < 2) return { updated: 0, checked: 0 };

  const headers = rows[0];
  const col = (name: string) => headers.indexOf(name);
  const cols = {
    teCom: col('tarifa_te_com_impostos'),
    teSem: col('tarifa_te_sem_impostos'),
    tusdCom: col('tarifa_tusd_com_impostos'),
    tusdSem: col('tarifa_tusd_sem_impostos'),
    bandCom: col('tarifa_bandeira_com_impostos'),
    bandSem: col('tarifa_bandeira_sem_impostos'),
  };
  const numericCols = Object.values(cols).filter((i) => i >= 0);

  let updated = 0, checked = 0;
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    checked++;

    let changed = false;
    for (const c of numericCols) {
      const raw = row[c];
      if (raw == null || raw === '') continue;
      const n = toNumberBR(raw);
      if (!Number.isFinite(n)) continue;
      // >=5 => assume MWh
      if (n >= 5) {
        row[c] = (n / 1000).toFixed(3);
        changed = true;
      }
    }
    if (changed) {
      const rowNumber = r + 1; // + cabeçalho
      await sheetsApi.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID!,
        range: `${SHEETS.INVOICES}!A${rowNumber}:ZZ${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [row] },
      });
      updated++;
    }
  }
  return { updated, checked };
} 