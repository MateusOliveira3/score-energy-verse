import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeGoogleApis, uploadInvoice, saveInvoiceData, signInUser, createUser, getInvoices, getUserProfile, getAllUsersForAdmin, getGamificationData, updateGamificationData, getLeaderboard } from './google-service.js';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import bcrypt from 'bcrypt';
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import path from 'path';

dotenv.config();

console.log("--- V3: EXECUTANDO O ARQUIVO server/index.ts ---");

const app = express();
app.use(cors());
app.use(express.json());

console.log("--- EXECUTANDO A VERSÃO MAIS RECENTE DO PDF-PARSER (EMBUTIDO) ---");

async function parsePdf(filePath: string): Promise<any> {
  console.log(`[PDF Parser] Lendo o arquivo PDF em: ${filePath}`);
  
  try {
    const dataBuffer = fs.readFileSync(filePath);

    const standardFontDataUrl = path.resolve(
      './node_modules/pdfjs-dist/standard_fonts/'
    );

    const pdf = await pdfjsLib.getDocument({ 
      data: new Uint8Array(dataBuffer),
      standardFontDataUrl
    }).promise;

    const numPages = pdf.numPages;
    let textContent = '';

    console.log(`[PDF Parser] O PDF tem ${numPages} página(s). Extraindo texto...`);

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      textContent += content.items.map((item: any) => item.str).join(' ');
    }

    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('!!! INICIANDO A EXTRAÇÃO DE TEXTO DO PDF !!!');
    console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.log('[PDF Parser] Extração de texto concluída. Conteúdo bruto:');
    console.log('----------------------------------------------------');
    console.log(textContent);

    const cleanedText = textContent.replace(/\s+/g, ' ');

    // Função para buscar o primeiro número com vírgula após a keyword
    function findFirstCommaNumberAfterKeyword(text: string, keyword: string | RegExp): string {
      let keywordRegex = typeof keyword === 'string' ? new RegExp(keyword, 'i') : keyword;
      let keywordMatch = text.match(keywordRegex);
      if (!keywordMatch) return 'Não encontrado';
      let startIdx = (keywordMatch.index ?? 0) + keywordMatch[0].length;
      let afterKeyword = text.slice(startIdx);
      let valueMatch = afterKeyword.match(/\d{1,3},\d{2}/);
      return valueMatch ? valueMatch[0] : 'Não encontrado';
    }

    // Função para buscar o valor de consumo TE (kWh)
    function findConsumoTE(text: string): string {
      let match = text.match(/Consumo\s*TE\s*KWH\s*(\d{1,4},\d{3})/i);
      if (match && match[1]) return match[1].replace(',', '.');
      return '0.00';
    }
    // Função para buscar o valor de consumo TUSD (kWh)
    function findConsumoTUSD(text: string): string {
      let match = text.match(/Consumo\s*TUSD\s*KWH\s*(\d{1,4},\d{3})/i);
      if (match && match[1]) return match[1].replace(',', '.');
      return '0.00';
    }

    // Função para buscar o valor de consumo (kWh) após 'Consumo' e 'KWH'
    function findConsumoKwh(text: string): string {
      // Busca por padrões como: Consumo TE   KWH   150,000 ...
      let match = text.match(/Consumo\s+[A-Z]+\s+KWH\s+(\d{1,4},\d{3})/i);
      if (match && match[1]) return match[1].replace(',', '.');
      // Alternativa: buscar por Consumo ... KWH ... valor
      let altMatch = text.match(/Consumo[^\d]*(\d{1,4},\d{3})/i);
      if (altMatch && altMatch[1]) return altMatch[1].replace(',', '.');
      return 'Não encontrado';
    }

    // Função para buscar o valor mais próximo da keyword (antes ou depois)
    function findClosestValue(text: string, keyword: string | RegExp, valuePattern: RegExp): string {
      let keywordRegex = typeof keyword === 'string' ? new RegExp(keyword, 'i') : keyword;
      let valueMatches = [...text.matchAll(valuePattern)];
      let keywordMatch = text.match(keywordRegex);
      if (!keywordMatch || valueMatches.length === 0) return 'Não encontrado';
      let keywordIndex = keywordMatch.index ?? -1;
      let closest = { value: 'Não encontrado', distance: Infinity };
      for (let match of valueMatches) {
        let valueIndex = match.index ?? -1;
        let distance = Math.abs(valueIndex - keywordIndex);
        if (distance < closest.distance) {
          closest = { value: match[0], distance };
        }
      }
      return closest.value;
    }

    // Função para extrair valores unitários (com e sem tributos) para um tipo
    function findUnitValues(text: string, tipo: 'TE' | 'TUSD' | 'BANDEIRA'): { withTax: string, noTax: string } {
      let regex;
      if (tipo === 'TE') {
        regex = /Consumo\s*TE\s*KWH\s*\d{1,4},\d{3}\s*(\d{1,2},\d{6})[\s\S]*?(\d{1,2},\d{6})/i;
      } else if (tipo === 'TUSD') {
        regex = /Consumo\s*TUSD\s*KWH\s*\d{1,4},\d{3}\s*(\d{1,2},\d{6})[\s\S]*?(\d{1,2},\d{6})/i;
      } else {
        regex = /Bandeira\s+Amarela\s+KWH\s*\d{1,4},\d{3}\s*(\d{1,2},\d{6})[\s\S]*?(\d{1,2},\d{6})/i;
      }
      let match = text.match(regex);
      if (match && match[1] && match[2]) {
        return {
          withTax: match[1].replace(',', '.'),
          noTax: match[2].replace(',', '.')
        };
      }
      return { withTax: '0.00', noTax: '0.00' };
    }

    // Função para extrair a bandeira tarifária
    function findBandeiraTarifaria(text: string): string {
      let match = text.match(/Bandeira\s+(Verde|Amarela|Vermelha)/i);
      if (match && match[1]) return match[1];
      // Alternativa: buscar só por "Verde", "Amarela", "Vermelha" próximo de "R$"
      let alt = text.match(/(Verde|Amarela|Vermelha)\s*R\$/i);
      if (alt && alt[1]) return alt[1];
      return 'Não encontrado';
    }

    // Função para somar todos os valores de kWh de Consumo TE
    function sumAllConsumoTE(text: string): number {
      let matches = [...text.matchAll(/Consumo\s*TE\s*KWH\s*(\d{1,4},\d{3})/gi)];
      return matches.reduce((acc, m) => acc + parseFloat(m[1].replace(',', '.')), 0);
    }
    // Função para somar todos os valores de kWh de Consumo TUSD
    function sumAllConsumoTUSD(text: string): number {
      let matches = [...text.matchAll(/Consumo\s*TUSD\s*KWH\s*(\d{1,4},\d{3})/gi)];
      return matches.reduce((acc, m) => acc + parseFloat(m[1].replace(',', '.')), 0);
    }

    // Ajuste dos padrões para o modelo Celesc, agora usando busca por proximidade e regex global
    const customerNumber = findClosestValue(cleanedText, /Unidade\s+Consumidora/i, /\d{8,10}/g);
    const referenceMonth = findClosestValue(cleanedText, /Refer[êe]ncia/i, /\d{2}\/\d{4}/g);
    const dueDate = findClosestValue(cleanedText, /Vencimento/i, /\d{2}\/\d{2}\/\d{4}/g);
    const totalValueBrl = findFirstCommaNumberAfterKeyword(cleanedText, /Total\s+a\s+Pagar.*?R\$|Total\s+a\s+Pagar/i);
    const eletricityKWhTE = sumAllConsumoTE(cleanedText).toFixed(3);
    const eletricityPrice = findClosestValue(cleanedText, /Energia Elétrica kWh/i, /[\d.,]+\s+[\d.,]+\s+([\d.,]+)/g) || findClosestValue(cleanedText, /Energia Elétrica/i, /[\d.,]+\s+[\d.,]+\s+([\d.,]+)/g);
    const sceeeKWh = findClosestValue(cleanedText, /Energia SCEE s\/ ICMS kWh/i, /[\d.,]+/g);
    const sceeePrice = findClosestValue(cleanedText, /Energia SCEE s\/ ICMS kWh/i, /[\d.,]+\s+[\d.,]+\s+([\d.,]+)/g);
    const gdiKWh = findClosestValue(cleanedText, /Energia compensada GD I kWh/i, /[\d.,]+/g);
    const gdiPrice = findClosestValue(cleanedText, /Energia compensada GD I kWh/i, /[\d.,]+\s+[\d.,]+\s+([\d.,]+)/g);
    const publicLightingContribution = findClosestValue(cleanedText, /Contrib Ilum Publica Municipal/i, /[\d.,]+/g);
    
    const [month, year] = referenceMonth.split('/');
    let totalConsumptionKwhNum = parseFloat(eletricityKWhTE) + parseFloat(sceeeKWh);
    let totalConsumptionKwh = isNaN(totalConsumptionKwhNum) ? '0.00' : totalConsumptionKwhNum.toFixed(2);
    let totalValueBrlNum = parseFloat(totalValueBrl.replace(',', '.'));
    let totalValueBrlFixed = isNaN(totalValueBrlNum) ? '0.00' : totalValueBrlNum.toFixed(2);

    // Extrair valores unitários
    const teUnits = findUnitValues(cleanedText, 'TE');
    const tusdUnits = findUnitValues(cleanedText, 'TUSD');
    const bandeiraUnits = findUnitValues(cleanedText, 'BANDEIRA');
    const bandeiraTarifaria = findBandeiraTarifaria(cleanedText);

    // Função para extrair o histórico de consumo
    function extractHistoricoConsumo(text: string): { mes: string, consumo: number, dias: number }[] {
      // 1. Encontrar todos os meses (ex: ABR/25)
      const mesesMatch = Array.from(text.matchAll(/([A-Z]{3}\/\d{2})/g));
      const meses = mesesMatch.map(m => m[1]);
      if (meses.length === 0) return [];

      // 2. Encontrar o índice do primeiro mês no texto
      const idxPrimeiroMes = mesesMatch[0].index || 0;
      // 3. Pegar o texto a partir do primeiro mês
      const textoAPartirDosMeses = text.slice(idxPrimeiroMes);

      // 4. Extrair todos os consumos (3 dígitos) e dias (1 ou 2 dígitos) após os meses
      const consumos = Array.from(textoAPartirDosMeses.matchAll(/\b(\d{3})\b/g)).map(m => parseInt(m[1], 10));
      const dias = Array.from(textoAPartirDosMeses.matchAll(/\b(\d{1,2})\b/g)).map(m => parseInt(m[1], 10));

      // 5. Pegar apenas os N primeiros consumos e dias
      const N = meses.length;
      const consumosFinal = consumos.slice(0, N);
      const diasFinal = dias.slice(0, N);

      // 6. Montar a tabela
      const historico: { mes: string, consumo: number, dias: number }[] = [];
      for (let i = 0; i < N; i++) {
        historico.push({
          mes: meses[i],
          consumo: consumosFinal[i] || 0,
          dias: diasFinal[i] || 0
        });
      }
      return historico;
    }

    // Extrair histórico de consumo
    const historicoConsumo = extractHistoricoConsumo(cleanedText);

    // eletricityKWhTotal deve ser igual à soma de todos os consumos TE
    const eletricityKWhTotal = eletricityKWhTE;

    return {
      customerNumber: customerNumber || 'Não encontrado',
      month: month || 'Não encontrado',
      year: year || 'Não encontrado',
      eletricityKWhTE: eletricityKWhTE,
      eletricityKWhTotal: eletricityKWhTotal,
      teUnitWithTax: teUnits.withTax,
      teUnitNoTax: teUnits.noTax,
      tusdUnitWithTax: tusdUnits.withTax,
      tusdUnitNoTax: tusdUnits.noTax,
      bandeiraUnitWithTax: bandeiraUnits.withTax,
      bandeiraUnitNoTax: bandeiraUnits.noTax,
      bandeiraTarifaria: bandeiraTarifaria,
      historicoConsumo: historicoConsumo,
      eletricityPrice: eletricityPrice || 0,
      sceeeKWh: sceeeKWh || 0,
      sceeePrice: sceeePrice || 0,
      gdiKWh: gdiKWh || 0,
      gdiPrice: gdiPrice || 0,
      publicLightingContribution: publicLightingContribution || 0,
      totalConsumptionKwh: totalConsumptionKwh,
      totalValueBrl: totalValueBrlFixed,
      dueDate: dueDate || 'Não encontrado',
    };

  } catch (error) {
    console.error('[PDF Parser] Erro ao processar o PDF:', error);
    return { error: true, message: 'Falha ao ler o arquivo PDF.' };
  } finally {
    if (fs.existsSync(filePath)) {
      console.log(`[PDF Parser] Removendo arquivo temporário: ${filePath}`);
      fs.unlinkSync(filePath);
    }
  }
}

// Configuração do Multer para salvar arquivos temporariamente no diretório do sistema operacional
const upload = multer({ dest: os.tmpdir() });

// Função para calcular economia baseada nos dados da fatura
function calculateEconomy(extractedData: any): number {
    const { eletricityPrice, gdiPrice, publicLightingContribution } = extractedData;
    const totalValue = eletricityPrice + publicLightingContribution - gdiPrice;
    
    // O consumo é a soma de todas as fontes de energia.
    const totalConsumption = extractedData.eletricityKWhTE + extractedData.sceeeKWh;

    // Adicionado para evitar divisão por zero se o consumo for 0.
    if (totalConsumption === 0) {
      return 0;
    }
    
    const averagePricePerKWh = totalValue / totalConsumption;
    
    // Calcula economia baseada em diferentes cenários
    let economy = 0;
    
    // 1. Economia por redução de 10% no consumo (meta realista)
    const reducedConsumption = totalConsumption * 0.9;
    const economyFromReduction = (totalConsumption - reducedConsumption) * averagePricePerKWh;
    
    // 2. Economia por uso de energia solar (se não há GD)
    const solarEconomy = extractedData.gdiKWh > 0 ? 0 : totalValue * 0.3; // 30% de economia com solar
    
    // 3. Economia por eficiência energética
    const efficiencyEconomy = totalValue * 0.15; // 15% de economia com eficiência
    
    // Soma todas as economias potenciais
    economy = economyFromReduction + solarEconomy + efficiencyEconomy;
    
    return Math.round(economy * 100) / 100; // Arredonda para 2 casas decimais
}

// Função para calcular pontos baseados na economia
function calculatePoints(economy: number, totalValue: number): number {
    // Pontos base por upload de fatura
    let points = 50;
    
    // Pontos adicionais baseados na economia potencial
    if (economy > 0) {
        points += Math.min(Math.round(economy * 10), 500); // Máximo 500 pontos por economia
    }
    
    // Pontos adicionais baseados no valor da fatura (faturas maiores = mais pontos)
    if (totalValue > 100) {
        points += Math.min(Math.round(totalValue / 10), 200); // Máximo 200 pontos por valor
    }
    
    // Bônus por primeira fatura do mês
    // (isso seria implementado verificando se já existe fatura do mesmo mês)
    points += 25; // Bônus base
    
    return points;
}

function diagnosticoEnergetico(extractedData: any): Array<{ tipo: string, mensagem: string }> {
    const recomendacoes: Array<{ tipo: string, mensagem: string }> = [];
    
    // Extrair valores dos dados
    const eletricityKWh = parseFloat(extractedData.eletricityKWh || '0');
    const sceeeKWh = parseFloat(extractedData.sceeeKWh || '0');
    const gdiKWh = parseFloat(extractedData.gdiKWh || '0');
    const publicLightingContribution = parseFloat(extractedData.publicLightingContribution || '0');
    const eletricityPrice = parseFloat(extractedData.eletricityPrice || '0');
    
    // Critério 1: Consumo alto
    if (eletricityKWh + sceeeKWh > 250) {
        recomendacoes.push({
            tipo: "alerta",
            mensagem: "Consumo elevado. Avalie hábitos e equipamentos."
        });
    }
    
    // Critério 2: Sem geração distribuída
    if (gdiKWh === 0) {
        recomendacoes.push({
            tipo: "sugestao",
            mensagem: "Sem GD detectada. Avalie energia solar."
        });
    }
    
    // Critério 3: CIP alta
    if (publicLightingContribution > 50) {
        recomendacoes.push({
            tipo: "alerta",
            mensagem: "CIP elevada. Possível revisão da iluminação pública."
        });
    }
    
    // Critério 4: Tarifa alta
    if (eletricityPrice > 1.00) {
        recomendacoes.push({
            tipo: "sugestao",
            mensagem: "Tarifa alta detectada. Considere mudança de hábitos ou tarifa."
        });
    }
    
    // Se não há recomendações, adicionar uma positiva
    if (recomendacoes.length === 0) {
        recomendacoes.push({
            tipo: "positivo",
            mensagem: "Consumo dentro dos padrões esperados. Continue assim!"
        });
    }
    
    return recomendacoes;
}

// Rota de Teste para verificar se o servidor está no ar
app.get('/api/test', (req: Request, res: Response) => {
  res.send('O servidor está funcionando!');
});

// Rotas de teste para desenvolvimento (sem Google APIs)
app.post('/api/test/signup', (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log(`[TESTE] Registro de usuário: ${email}`);
  
  // Simula criação de usuário
  const testUser = {
    id: `user_${Date.now()}`,
    email: email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  res.status(201).json(testUser);
});

app.post('/api/test/signin', (req: Request, res: Response) => {
  const { email, password } = req.body;
  console.log(`[TESTE] Login de usuário: ${email}`);
  
  // Simula login bem-sucedido
  const testUser = {
    id: `user_${Date.now()}`,
    email: email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  res.status(200).json(testUser);
});

app.get('/api/test/users/:userId/profile', (req: Request, res: Response) => {
  const { userId } = req.params;
  console.log(`[TESTE] Buscando perfil: ${userId}`);
  
  // Simula perfil de usuário
  const testProfile = {
    id: `profile_${Date.now()}`,
    user_id: userId,
    email: 'teste@exemplo.com',
    consumer_type: 'Residencial',
    location: 'São Paulo, SP',
    property_size: 80,
    people_count: 3,
    energy_preference: 'Convencional',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  res.status(200).json(testProfile);
});

app.get('/api/test/users/:userId/invoices', (req: Request, res: Response) => {
  const { userId } = req.params;
  console.log(`[TESTE] Buscando faturas: ${userId}`);
  
  // Simula lista de faturas
  const testInvoices = [
    {
      id: `invoice_${Date.now()}`,
      user_id: userId,
      consumption: 250,
      total_value: 150.50,
      tax_percentage: 18,
      peak_hours: '18:00-22:00',
      month: 'Janeiro 2024',
      file_url: 'https://example.com/test.pdf',
      file_name: 'fatura_teste.pdf',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  res.status(200).json(testInvoices);
});

app.get('/api/test/leaderboard', (req: Request, res: Response) => {
  console.log('[TESTE] Gerando leaderboard');
  
  // Simula leaderboard
  const testLeaderboard = [
    {
      user_id: 'user_1',
      email: 'maria@exemplo.com',
      score: 2847,
      level: 12
    },
    {
      user_id: 'user_2',
      email: 'joao@exemplo.com',
      score: 2654,
      level: 11
    },
    {
      user_id: 'user_3',
      email: 'ana@exemplo.com',
      score: 2489,
      level: 10
    }
  ];
  
  res.status(200).json(testLeaderboard);
});

// Rota para upload de fatura
app.post(
  '/api/invoices/upload',
  upload.single('invoice'),
  async (req: express.Request, res: express.Response): Promise<void> => {
    const userId = req.body.userId;
    console.log(`[API] Requisição recebida para o usuário ${userId}`);

    if (!req.file) {
      res.status(400).json({ message: 'Nenhum arquivo enviado.' });
      return;
    }

    console.log(`[API] Arquivo recebido: ${req.file.originalname}, salvo temporariamente em: ${req.file.path}`);

    try {
      const { webViewLink: fileUrl, id: fileId } = await uploadInvoice(userId, req.file.path, req.file.originalname);
      console.log(`[API] Arquivo enviado para o Drive com sucesso. File ID: ${fileId}`);

      const extractedData = await parsePdf(req.file.path);
      console.log('[API] Dados extraídos do PDF:', extractedData);
      
      if (extractedData.error) {
        res.status(500).json({ message: extractedData.message });
        return;
      }

      const economy = calculateEconomy(extractedData);
      const points = calculatePoints(economy, extractedData.totalValueBrl);
      const diagnostico = diagnosticoEnergetico(extractedData);
      
      console.log(`[API] Economia calculada: R$ ${economy}`);
      console.log(`[API] Pontos calculados: ${points}`);
      console.log(`[API] Diagnóstico energético:`, diagnostico);
      
      const invoicePayload = {
        ...extractedData,
        fileUrl,
        fileId,
        fileName: req.file.originalname,
        economy,
        points,
        diagnostico
      };

      await saveInvoiceData(userId, invoicePayload);
      console.log('[API] Dados da fatura salvos na planilha com sucesso.');

      res.status(200).json({
        message: 'Arquivo enviado e processado com sucesso!',
        extractedData,
        fileUrl,
        fileName: req.file.originalname,
        economy,
        points,
        diagnostico
      });

    } catch (error) {
      console.error('[API] Erro no processamento do upload:', error);
      res.status(500).json({ message: 'Erro ao processar o arquivo.' });
    }
  }
);

// Rota para buscar faturas de um usuário
app.get('/api/users/:userId/invoices', async (req: Request, res: Response) => {
    const { userId } = req.params;
    console.log(`[API] Requisição recebida: GET /api/users/${userId}/invoices`);
    try {
        const invoices = await getInvoices(userId);
        console.log(`[API] Encontradas ${invoices.length} faturas para o usuário ${userId}`);
        res.status(200).json(invoices);
    } catch (error) {
        console.error(`[API] Erro ao buscar faturas para ${userId}:`, error);
        res.status(500).json({ message: 'Erro ao buscar faturas.' });
    }
});

// Rota para buscar perfil de um usuário
app.get('/api/users/:userId/profile', async (req: Request, res: Response) => {
    const { userId } = req.params;
    console.log(`[API] Requisição recebida: GET /api/users/${userId}/profile`);
    try {
        const profile = await getUserProfile(userId);
        if (profile) {
            console.log(`[API] Perfil encontrado para o usuário ${userId}`);
            res.status(200).json(profile);
        } else {
            console.log(`[API] Perfil não encontrado para o usuário ${userId}`);
            res.status(404).json({ message: 'Perfil não encontrado.' });
        }
    } catch (error) {
        console.error(`[API] Erro ao buscar perfil para ${userId}:`, error);
        res.status(500).json({ message: 'Erro ao buscar perfil.' });
    }
});

// Rota para dados do administrador
app.get('/api/admin/users', async (req: Request, res: Response) => {
    console.log('[API] Requisição recebida: GET /api/admin/users');
    
    // Verificar autenticação básica (admin:admin)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.status(401).json({ message: 'Autenticação necessária.' });
        return;
    }
    
    const credentials = Buffer.from(authHeader.substring(6), 'base64').toString();
    if (credentials !== 'admin:admin') {
        res.status(401).json({ message: 'Credenciais inválidas.' });
        return;
    }
    
    try {
        const users = await getAllUsersForAdmin();
        console.log(`[API] Encontrados ${users.length} usuários para o admin`);
        res.status(200).json(users);
    } catch (error) {
        console.error('[API] Erro ao buscar dados para admin:', error);
        res.status(500).json({ message: 'Erro ao buscar dados de administrador.' });
    }
});

// Rota para buscar dados de gamificação de um usuário
app.get('/api/users/:userId/gamification', async (req: Request, res: Response) => {
    const { userId } = req.params;
    console.log(`[API] Requisição recebida: GET /api/users/${userId}/gamification`);
    try {
        const gamificationData = await getGamificationData(userId);
        if (gamificationData) {
            console.log(`[API] Dados de gamificação encontrados para o usuário ${userId}`);
            res.status(200).json(gamificationData);
        } else {
            console.log(`[API] Dados de gamificação não encontrados para o usuário ${userId}`);
            res.status(404).json({ message: 'Dados de gamificação não encontrados.' });
        }
    } catch (error) {
        console.error(`[API] Erro ao buscar dados de gamificação para ${userId}:`, error);
        res.status(500).json({ message: 'Erro ao buscar dados de gamificação.' });
    }
});

// Rota para atualizar dados de gamificação de um usuário
app.put('/api/users/:userId/gamification', async (req: Request, res: Response) => {
    const { userId } = req.params;
    const updateData = req.body;
    console.log(`[API] Requisição recebida: PUT /api/users/${userId}/gamification`);
    try {
        await updateGamificationData(userId, updateData);
        console.log(`[API] Dados de gamificação atualizados para o usuário ${userId}`);
        res.status(200).json({ message: 'Dados de gamificação atualizados com sucesso.' });
    } catch (error) {
        console.error(`[API] Erro ao atualizar dados de gamificação para ${userId}:`, error);
        res.status(500).json({ message: 'Erro ao atualizar dados de gamificação.' });
    }
});

// Rota para buscar leaderboard
app.get('/api/leaderboard', async (req: Request, res: Response) => {
    console.log('[API] Requisição recebida: GET /api/leaderboard');
    try {
        const leaderboard = await getLeaderboard();
        console.log(`[API] Leaderboard gerado com ${leaderboard.length} usuários`);
        res.status(200).json(leaderboard);
    } catch (error) {
        console.error('[API] Erro ao gerar leaderboard:', error);
        res.status(500).json({ message: 'Erro ao gerar leaderboard.' });
    }
});

// --- ROTA TEMPORÁRIA PARA TESTE DO PARSER DE PDF ---
app.post(
  '/api/test/parse-pdf',
  upload.single('invoice'),
  async (req: express.Request, res: express.Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ message: 'Nenhum arquivo enviado.' });
      return;
    }
    try {
      const extractedData = await parsePdf(req.file.path);
      res.status(200).json({ extractedData });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao processar o PDF.' });
    }
  }
);

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email e senha são obrigatórios.' });
      return;
    }

    // Hash da senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Cria o usuário
    const newUser = await createUser(email, passwordHash);
    res.status(201).json(newUser);
  } catch (error: any) {
    console.error('[API] Erro no signup:', error);
    res.status(500).json({ message: 'Erro ao criar usuário.', error: error.message });
  }
});

app.post('/api/auth/signin', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email e senha são obrigatórios.' });
      return;
    }

    const user = await signInUser(email, password);

    if (user) {
      // Excluir o hash da senha da resposta
      delete user.password_hash;
      res.status(200).json(user);
    } else {
      res.status(401).json({ message: 'Email ou senha inválidos.' });
    }
  } catch (error: any) {
    console.error('[API] Erro no signin:', error);
    res.status(500).json({ message: 'Erro interno do servidor.', error: error.message });
  }
});

const PORT = process.env.PORT || 3001;

// Inicializa as APIs do Google e então inicia o servidor
initializeGoogleApis()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`⚡️ Server rodando na porta ${PORT}`);
    });
  })
  .catch(error => {
    console.error('❌ Falha ao inicializar os serviços do Google e iniciar o servidor:', error);
    process.exit(1);
  });