import express, { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeGoogleApis, saveInvoiceData, signInUser, createUser, getInvoices, getUserProfile, getAllUsersForAdmin, getGamificationData, updateGamificationData, getLeaderboard, detectAndFixTariffsOnce, getDiagnosisByUser, getLastInvoiceNormalized } from './google-service.js';
import multer from 'multer';
import fs from 'fs';
import os from 'os';
import bcrypt from 'bcrypt';
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import path from 'path';

// 1) IMPORTS — adicione perto dos demais imports do topo de server/index.ts
import { parseInvoiceText } from './lib/invoice-parser.js';
import diagnosticoEnergeticoConsultivo from './lib/energy-advisor.js';
import computeConsultativeScore from './lib/score-advisor.js';
import { toNumberBR, safeDiv, normalizeTariffUnit, buildLastAnalysisPayload } from './lib/num.js';
import { saveTechnicalAnalysis, getLastDiagnosisRow, getLastAnalysisOrInvoice, getUserHistory, getInvoicesRaw } from './google-service.js';

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

    // helpers locais para extração de tarifas e preços
    const grab = (text: string, label: string) => {
      const r = new RegExp(label + "[^\\d]*([\\d\\.,]+)", "i");
      const m = text.match(r);
      return m ? m[1] : "";
    };
    const toBR = (s: string) => {
      if (!s) return 0;
      return parseFloat(s.replace(/\./g, "").replace(",", "."));
    };
    const normTariff = (n: number) => (n >= 5 ? n / 1000 : n); // R$/MWh → R$/kWh

    // CORRIGIDO: Extração direta das tarifas baseada no formato específico do PDF
    // Formato: (0D) Consumo TE KWH 150,000 0,362600 ... 0,302240
    let teComImp = 0;
    let teSemImp = 0;
    let tusdCom = 0;
    let tusdSem = 0;
    
    // Extrair tarifa TE com impostos (primeira tarifa após consumo TE)
    const teMatch = cleanedText.match(/Consumo\s+TE\s+KWH\s+\d+,\d+\s+(\d+,\d+)/i);
    if (teMatch) {
      teComImp = normTariff(toBR(teMatch[1]));
      console.log('[PARSER] Tarifa TE com impostos extraída:', teMatch[1], '->', teComImp);
    }
    
    // Extrair tarifa TE sem impostos (segunda tarifa na linha TE)
    const teSemMatch = cleanedText.match(/Consumo\s+TE\s+KWH\s+\d+,\d+\s+\d+,\d+\s+[^\d]*\d+,\d+\s+[^\d]*\d+,\d+\s+[^\d]*\d+,\d+\s+[^\d]*\d+,\d+\s+[^\d]*(\d+,\d+)/i);
    if (teSemMatch) {
      teSemImp = normTariff(toBR(teSemMatch[1]));
      console.log('[PARSER] Tarifa TE sem impostos extraída:', teSemMatch[1], '->', teSemImp);
    }
    
    // Extrair tarifa TUSD com impostos (primeira tarifa após consumo TUSD)
    const tusdMatch = cleanedText.match(/Consumo\s+TUSD\s+KWH\s+\d+,\d+\s+(\d+,\d+)/i);
    if (tusdMatch) {
      tusdCom = normTariff(toBR(tusdMatch[1]));
      console.log('[PARSER] Tarifa TUSD com impostos extraída:', tusdMatch[1], '->', tusdCom);
    }
    
    // Extrair tarifa TUSD sem impostos (segunda tarifa na linha TUSD)
    const tusdSemMatch = cleanedText.match(/Consumo\s+TUSD\s+KWH\s+\d+,\d+\s+\d+,\d+\s+[^\d]*\d+,\d+\s+[^\d]*\d+,\d+\s+[^\d]*\d+,\d+\s+[^\d]*\d+,\d+\s+[^\d]*(\d+,\d+)/i);
    if (tusdSemMatch) {
      tusdSem = normTariff(toBR(tusdSemMatch[1]));
      console.log('[PARSER] Tarifa TUSD sem impostos extraída:', tusdSemMatch[1], '->', tusdSem);
    }
    
    // Extrair bandeira tarifária
    const bandeiraMatch = cleanedText.match(/Bandeira\s+(Verde|Amarela|Vermelha)/i);
    const bandeira = bandeiraMatch ? bandeiraMatch[1] : 'Verde';
    
    // Preço médio da energia (usar primeira tarifa TE como referência)
    const precoEE = teComImp;
    
    console.log('[PARSER] Tarifas extraídas:', {
      teComImp,
      teSemImp,
      tusdCom,
      tusdSem,
      bandeira,
      precoEE
    });

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
        // Padrão: (0D) Consumo TE KWH 150,000 0,362600 ... 0,302240
        regex = /Consumo\s*TE\s*KWH\s*\d{1,4},\d{3}\s*(\d{1,2},\d{6})[\s\S]*?(\d{1,2},\d{6})/i;
      } else if (tipo === 'TUSD') {
        // Padrão: (0E) Consumo TUSD KWH 150,000 0,378667 ... 0,315670
        regex = /Consumo\s*TUSD\s*KWH\s*\d{1,4},\d{3}\s*(\d{1,2},\d{6})[\s\S]*?(\d{1,2},\d{6})/i;
      } else {
        // Padrão: (2L) Bandeira Amarela KWH 150,000 0,008267 ... 0,006841
        regex = /Bandeira\s+(Verde|Amarela|Vermelha)\s*KWH\s*\d{1,4},\d{3}\s*(\d{1,2},\d{6})[\s\S]*?(\d{1,2},\d{6})/i;
      }
      let match = text.match(regex);
      if (match && match[1] && match[2]) {
        return {
          withTax: match[1].replace(',', '.'),
          noTax: match[2].replace(',', '.')
        };
      }
      // Se não encontrar, tentar padrão mais simples
      if (tipo === 'TE') {
        const simpleMatch = text.match(/Consumo\s*TE\s*KWH[^\d]*(\d{1,2},\d{6})/i);
        if (simpleMatch) {
          return {
            withTax: simpleMatch[1].replace(',', '.'),
            noTax: '0.00'
          };
        }
      } else if (tipo === 'TUSD') {
        const simpleMatch = text.match(/Consumo\s*TUSD\s*KWH[^\d]*(\d{1,2},\d{6})/i);
        if (simpleMatch) {
          return {
            withTax: simpleMatch[1].replace(',', '.'),
            noTax: '0.00'
          };
        }
      } else {
        const simpleMatch = text.match(/Bandeira[^\d]*(\d{1,2},\d{6})/i);
        if (simpleMatch) {
          return {
            withTax: simpleMatch[1].replace(',', '.'),
            noTax: '0.00'
          };
        }
      }
      return { withTax: '0.00', noTax: '0.00' };
    }

    // Função para extrair a bandeira tarifária
    function findBandeiraTarifaria(text: string): string {
      // Procurar por padrões como: (2L) Bandeira Amarela KWH
      let match = text.match(/Bandeira\s+(Verde|Amarela|Vermelha)/i);
      if (match && match[1]) return match[1];
      
      // Alternativa: buscar só por "Verde", "Amarela", "Vermelha" próximo de "R$"
      let alt = text.match(/(Verde|Amarela|Vermelha)\s*R\$/i);
      if (alt && alt[1]) return alt[1];
      
      // Procurar por "Etapa: Verde" ou similar
      let etapa = text.match(/Etapa:\s*(Verde|Amarela|Vermelha)/i);
      if (etapa && etapa[1]) return etapa[1];
      
      // Procurar por "21 Amarela" ou similar
      let amarela = text.match(/\d+\s+(Amarela|Verde|Vermelha)/i);
      if (amarela && amarela[1]) return amarela[1];
      
      return 'Verde'; // Padrão para residencial
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

    // Ajuste dos padrões para o modelo Celesc real
    const customerNumber = findClosestValue(cleanedText, /Unidade\s+Consumidora/i, /\d{8,10}/g) || '0000000000';
    const referenceMonth = findClosestValue(cleanedText, /Refer[êe]ncia/i, /\d{2}\/\d{4}/g) || '01/2025';
    const dueDate = findClosestValue(cleanedText, /Vencimento/i, /\d{2}\/\d{2}\/\d{4}/g) || '01/01/2025';
    const totalValueBrl = findFirstCommaNumberAfterKeyword(cleanedText, /Total\s+a\s+Pagar.*?R\$|Total\s+a\s+Pagar/i) || '0,00';
    
    // Extrair consumo TE total (soma de todos os consumos TE)
    const eletricityKWhTE = sumAllConsumoTE(cleanedText).toFixed(3);
    
    // Extrair preços baseados nos dados reais do PDF
    // Procurar por padrões como: (0D) Consumo TE KWH 150,000 0,362600
    const eletricityPriceMatch = cleanedText.match(/Consumo\s+TE\s+KWH\s+\d{1,4},\d{3}\s+(\d{1,2},\d{6})/i);
    const eletricityPrice = eletricityPriceMatch ? eletricityPriceMatch[1].replace(',', '.') : '0.00';
    
    // SCEE geralmente é 0 para residencial
    const sceeeKWh = '0,000';
    const sceeePrice = '0,00';
    
    // GD geralmente é 0 para residencial
    const gdiKWh = '0,000';
    const gdiPrice = '0,00';
    
    // Contribuição de iluminação pública (COSIP)
    const publicLightingContributionMatch = cleanedText.match(/COSIP\s+Municipal[^\d]*(\d{1,2},\d{2})/i);
    const publicLightingContribution = publicLightingContributionMatch ? publicLightingContributionMatch[1].replace(',', '.') : '0.00';
    
    const [month, year] = referenceMonth.split('/');
    let totalConsumptionKwhNum = parseFloat(eletricityKWhTE) + parseFloat(sceeeKWh || '0');
    let totalConsumptionKwh = isNaN(totalConsumptionKwhNum) ? '0.00' : totalConsumptionKwhNum.toFixed(2);
    
    // Debug: logar o cálculo do consumo total
    console.log('[PARSER] Cálculo consumo total:', {
      eletricityKWhTE,
      sceeeKWh,
      totalConsumptionKwhNum,
      totalConsumptionKwh
    });
    let totalValueBrlNum = parseFloat(totalValueBrl.replace(',', '.'));
    let totalValueBrlFixed = isNaN(totalValueBrlNum) ? '0.00' : totalValueBrlNum.toFixed(2);

    // Extrair valores unitários
    const teUnits = findUnitValues(cleanedText, 'TE');
    const tusdUnits = findUnitValues(cleanedText, 'TUSD');
    const bandeiraUnits = findUnitValues(cleanedText, 'BANDEIRA');
    const bandeiraTarifaria = findBandeiraTarifaria(cleanedText);

    // Função para extrair o histórico de consumo
    function extractHistoricoConsumo(text: string): { mes: string, consumo: number, dias: number }[] {
      // 1. Encontrar todos os meses (ex: ABR/25, MAR/25, etc.)
      const mesesMatch = Array.from(text.matchAll(/([A-Z]{3}\/\d{2})/g));
      const meses = mesesMatch.map(m => m[1]);
      if (meses.length === 0) return [];

      // 2. Encontrar o índice do primeiro mês no texto
      const idxPrimeiroMes = mesesMatch[0].index || 0;
      // 3. Pegar o texto a partir do primeiro mês
      const textoAPartirDosMeses = text.slice(idxPrimeiroMes);

      // 4. Extrair todos os consumos (3 dígitos) e dias (1 ou 2 dígitos) após os meses
      // Padrão: ABR/25 338 28 (mês, consumo, dias)
      const consumos = Array.from(textoAPartirDosMeses.matchAll(/\b(\d{3})\b/g)).map(m => parseInt(m[1], 10));
      const dias = Array.from(textoAPartirDosMeses.matchAll(/\b(\d{1,2})\b/g)).map(m => parseInt(m[1], 10));

      // 5. Pegar apenas os N primeiros consumos e dias
      const N = Math.min(meses.length, consumos.length, dias.length);
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
      customerNumber: customerNumber || '0000000000',
      month: month || '01',
      year: year || '2025',
      eletricityKWhTE: eletricityKWhTE || '0.000',
      eletricityKWhTotal: eletricityKWhTotal || '0.000',
      teUnitWithTax: teUnits.withTax || '0.00',
      teUnitNoTax: teUnits.noTax || '0.00',
      tusdUnitWithTax: tusdUnits.withTax || '0.00',
      tusdUnitNoTax: tusdUnits.noTax || '0.00',
      bandeiraUnitWithTax: bandeiraUnits.withTax || '0.00',
      bandeiraUnitNoTax: bandeiraUnits.noTax || '0.00',
      bandeiraTarifaria: bandeiraTarifaria || 'Verde',
      historicoConsumo: historicoConsumo || [],
      eletricityPrice: eletricityPrice || '0.00',
      sceeeKWh: sceeeKWh || '0.000',
      sceeePrice: sceeePrice || '0.00',
      gdiKWh: gdiKWh || '0.000',
      gdiPrice: gdiPrice || '0.00',
      publicLightingContribution: publicLightingContribution || '0.00',
      totalConsumptionKwh: totalConsumptionKwh || '0.00',
      totalValueBrl: totalValueBrlFixed || '0.00',
      dueDate: dueDate || '01/01/2025',
      // CORRIGIDO: Usar os valores das variáveis locais que foram extraídos corretamente
      tarifa_te_com_impostos: teComImp,
      tarifa_te_sem_impostos: teSemImp,
      tarifa_tusd_com_impostos: tusdCom,
      tarifa_tusd_sem_impostos: tusdSem,
      bandeira_tarifaria: bandeira,
      preco_energia_eletrica: precoEE,
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
    // Usar os valores corretos das tarifas extraídas
    const teComImp = parseFloat(extractedData.tarifa_te_com_impostos || '0');
    const tusdComImp = parseFloat(extractedData.tarifa_tusd_com_impostos || '0');
    const bandeiraComImp = parseFloat(extractedData.bandeira_tarifaria === 'Amarela' ? '0.014467' : '0');
    
    // Calcular preço médio por kWh usando as tarifas reais
    const totalTariff = teComImp + tusdComImp + bandeiraComImp;
    
    // O consumo total em kWh
    const totalConsumption = parseFloat(extractedData.totalConsumptionKwh || '0');
    const totalValue = parseFloat(extractedData.totalValueBrl || '0');

    // Se não temos dados válidos, retornar 0
    if (totalConsumption <= 0 || totalValue <= 0) {
      return 0;
    }
    
    // Calcula economia baseada em diferentes cenários
    let economy = 0;
    
    // 1. Economia por redução de 10% no consumo (meta realista)
    const reducedConsumption = totalConsumption * 0.9;
    const economyFromReduction = (totalConsumption - reducedConsumption) * totalTariff;
    
    // 2. Economia por uso de energia solar (se não há GD)
    const gdiKWh = parseFloat(extractedData.gdiKWh || '0');
    const solarEconomy = gdiKWh > 0 ? 0 : totalValue * 0.3; // 30% de economia com solar
    
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
      // 1. Extrair dados do PDF primeiro
      const extractedData = await parsePdf(req.file.path);
      console.log('[API] Dados extraídos do PDF:', extractedData);
      
      if (extractedData.error) {
        res.status(500).json({ message: extractedData.message });
        return;
      }

      // 2. Calcular análises baseadas nos dados extraídos
      const economy = calculateEconomy(extractedData);
      const points = calculatePoints(economy, extractedData.totalValueBrl);
      const diagnostico = diagnosticoEnergetico(extractedData);
      
      console.log(`[API] Economia calculada: R$ ${economy}`);
      console.log(`[API] Pontos calculados: ${points}`);
      console.log(`[API] Diagnóstico energético:`, diagnostico);
      
      // --- CAMADA CONSULTIVA (NOVA) ---
      let invoiceResumo: any = null;
      let scoreConsultivo: any = null;
      let diagnosticoConsultivo: any = null;
      let tagsConsultivo: any = null;
      
      try {
        const totalKwh = Number(extractedData.eletricityKWh || 0) + Number(extractedData.sceeeKWh || 0);

        invoiceResumo = {
          month: extractedData.month || '',
          year: extractedData.year || '',
          consumption_kwh: Number(totalKwh.toFixed(2)),
          total_value_brl: Number(Number(extractedData.totalValueBrl || 0).toFixed(2)),
          has_reactive: false, // ajuste se você já extrair explicitamente
          has_gd: Number(extractedData.gdiKWh || 0) > 0,
          tariff: '', // preencha se tiver no extractedData
          value_per_kwh: totalKwh > 0
            ? Number((Number(extractedData.totalValueBrl || 0) / totalKwh).toFixed(4))
            : 0,
          publicLightingContribution: Number(extractedData.publicLightingContribution || 0),
        };

        const { tips, tags } = diagnosticoEnergeticoConsultivo(invoiceResumo);
        scoreConsultivo = computeConsultativeScore(invoiceResumo);
        diagnosticoConsultivo = tips;
        tagsConsultivo = tags;

        await saveTechnicalAnalysis(userId, {
          month: Number(invoiceResumo.month || 0),
          year: Number(invoiceResumo.year || 0),
          consumption_kwh: Number(invoiceResumo.consumption_kwh || 0),
          total_value_brl: Number(invoiceResumo.total_value_brl || 0),
          value_per_kwh: Number(invoiceResumo.value_per_kwh || 0),
          has_reactive: Boolean(invoiceResumo.has_reactive),
          has_gd: Boolean(invoiceResumo.has_gd),
          tariff: String(invoiceResumo.tariff || ''),
          score_total: Number(scoreConsultivo?.total || 0),
          score_breakdown_json: JSON.stringify(scoreConsultivo?.breakdown || {}),
          recommendations_json: tips || [],
          created_at: new Date().toISOString(),
        });
        console.log('[SHEETS] (upload) Análise consultiva salva em invoices_diagnosis.');

      } catch (e) {
        console.error('[API] (upload) Falha ao gerar/salvar análise consultiva:', e);
        // não falhe a requisição por causa da camada consultiva; prossiga sem bloquear o fluxo antigo
      }
      
      // 3. Preparar payload com dados extraídos e análises
      const invoicePayload = {
        ...extractedData,
        fileName: req.file.originalname,
        economy,
        points,
        diagnostico
      };

      // 4. Salvar dados na planilha do Google
      await saveInvoiceData(userId, invoicePayload);
      console.log('[API] Dados da fatura salvos na planilha com sucesso.');

      // 5. Descartar o arquivo PDF temporário
      try {
        fs.unlinkSync(req.file.path);
        console.log(`[API] Arquivo temporário removido: ${req.file.path}`);
      } catch (unlinkError) {
        console.warn(`[API] Aviso: Não foi possível remover arquivo temporário: ${req.file.path}`);
      }

      res.status(200).json({
        message: 'Dados extraídos e salvos com sucesso!',
        extractedData,
        fileName: req.file.originalname,
        economy,
        points,
        diagnostico,
        // Campos da camada consultiva (se disponíveis)
        ...(invoiceResumo && { invoiceResumo }),
        ...(scoreConsultivo && { scoreConsultivo }),
        ...(diagnosticoConsultivo && { diagnosticoConsultivo }),
        ...(tagsConsultivo && { tagsConsultivo })
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

// Rota para corrigir tarifas no Google Sheets (executar apenas uma vez)
app.post('/api/admin/fix-tariffs-once', async (req, res) => {
  try {
    // Auth básica: admin:admin
    const authHeader = req.headers.authorization || '';
    const expected = 'Basic ' + Buffer.from('admin:admin').toString('base64');
    if (authHeader !== expected) {
      res.status(401).json({ message: 'Autenticação necessária.' });
      return;
    }

    const result = await detectAndFixTariffsOnce();
    res.json({
      ok: true,
      ...result,
      note: 'Valores >= 5 foram convertidos de R$/MWh para R$/kWh (÷1000).',
    });
  } catch (err) {
    console.error('[ADMIN] fix-tariffs-once error:', err);
    res.status(500).json({ ok: false, error: 'Falha ao corrigir tarifas.' });
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

import type { DiagnosisListOptions } from './lib/types.js';

type FixResult = { updated: number; checked: number };

app.get('/api/users/:userId/diagnosis', async (req, res) => {
  console.log('[API] GET /api/users/:userId/diagnosis');
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({ message: 'userId obrigatório.' });
      return;
    }

    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
    const wantsPagination = Boolean(limit || cursor);

    const options: DiagnosisListOptions | undefined = wantsPagination
      ? { limit, cursor: cursor ?? null }
      : undefined;

    const result = await getDiagnosisByUser(userId, options);

    // Compat: sem paginação → retorna array; com paginação → { items, nextCursor }
    res.status(200).json(result);
  } catch (e: any) {
    console.error('[API] Erro em /diagnosis:', e?.message || e);
    res.status(500).json({ message: 'Erro ao buscar histórico de análises.' });
  }
});

// === [ADICIONAR] Rota: Histórico unificado ===
type HistoryParams = { userId: string };
type HistoryBody = { ok: true; data: { invoices: any[]; diagnosis: any[] } } | { ok: false; error: string };

const historyHandler: RequestHandler<HistoryParams, HistoryBody> = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await getUserHistory(userId);
    res.status(200).json({ ok: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    res.status(500).json({ ok: false, error: msg });
  }
};

app.get<HistoryParams, HistoryBody>('/api/users/:userId/history', historyHandler);

// === [AJUSTE] rota que alimenta "Análise da Última Fatura" ===
type LastRes = { ok: true; data: any | null } | { ok: false; error: string };

const lastAnalysisHandler: RequestHandler<HistoryParams, LastRes> = async (req, res) => {
  try {
    const { userId } = req.params;
    // usa invoices ordenadas por created_at
    const invoices = await getInvoicesRaw(userId);
    const last = invoices[0] || null;
    res.status(200).json({ ok: true, data: last });
  } catch (e) {
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : String(e) });
  }
};

app.get<HistoryParams, LastRes>('/api/users/:userId/last-analysis', lastAnalysisHandler);

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

// 2) ROTA NOVA — cole abaixo das outras rotas, sem alterar as existentes
//    POST /api/invoices/analyze-pdf
//    - recebe arquivo "invoice" (PDF) e userId no body
//    - extrai dados com parsePdf (já existente no seu server)
//    - NÃO faz upload no Drive
//    - salva linha "operacional" em INVOICES com saveInvoiceData (fileId vazio)
//    - monta InvoiceParsed -> diagnostico + score consultivo -> salva em invoices_diagnosis
app.post('/api/invoices/analyze-pdf', upload.single('invoice'), async (req, res) => {
  console.log('[API] POST /api/invoices/analyze-pdf');

  try {
    const userId = req.body?.userId;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ message: 'Parâmetro inválido: userId é obrigatório.' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: 'Nenhum arquivo enviado (campo "invoice").' });
      return;
    }

    console.log(`[API] Arquivo recebido: ${req.file.originalname}, tmp: ${req.file.path}`);

    // 2.1) Extrair texto/valores do PDF usando sua função atual
    const extractedData = await parsePdf(req.file.path);
    if (extractedData?.error) {
      res.status(500).json({ message: extractedData.message || 'Falha ao ler o PDF.' });
      return;
    }
    console.log('[PARSER] Extraído:', {
      month: extractedData.month,
      year: extractedData.year,
      eletricityKWh: extractedData.eletricityKWh,
      sceeeKWh: extractedData.sceeeKWh,
      totalValueBrl: extractedData.totalValueBrl
    });

    // Usando as novas funções mais robustas
    const teKwh  = toNumberBR(extractedData?.eletricityKWhTE || extractedData?.eletricityKWh);
    const sceeeKwh = toNumberBR(extractedData?.sceeeKWh);
    
    // CORRIGIDO: Garantir que o consumo total seja extraído corretamente
    let totalKwh = toNumberBR(extractedData?.totalConsumptionKWh);
    if (totalKwh === 0) {
      totalKwh = teKwh + sceeeKwh;
    }
    
    // Debug: logar os valores extraídos
    console.log('[DEBUG] Valores extraídos:', {
      eletricityKWhTE: extractedData?.eletricityKWhTE,
      eletricityKWh: extractedData?.eletricityKWh,
      totalConsumptionKwh: extractedData?.totalConsumptionKwh,
      teKwh,
      sceeeKwh,
      totalKwh,
      rawTotalConsumption: extractedData?.totalConsumptionKwh
    });

    const totalValueBrl = toNumberBR(extractedData?.totalValueBrl);
    const valuePerKwh   = safeDiv(totalValueBrl, totalKwh);

    // mantém seus cálculos existentes
    const economy = calculateEconomy({
      ...extractedData,
      eletricityKWh: teKwh,
      sceeeKWh: sceeeKwh,
      totalConsumptionKwh: totalKwh,
      totalValueBrl: totalValueBrl,
    });
    const points  = calculatePoints(economy, totalValueBrl);

    // payload operacional (planilha invoices) – mantenha os demais campos que você já passa
    const invoicePayload = {
      ...extractedData,
      eletricityKWh: teKwh,
      sceeeKWh: sceeeKwh,
      totalConsumptionKwh: totalKwh,
      totalValueBrl: totalValueBrl,
      economy,
      points,
    };

    // salva como você já faz
    await saveInvoiceData(userId, invoicePayload);

    // payload consultivo (planilha invoices_diagnosis)
    const consultParsed = {
      month: toNumberBR(extractedData?.month) || extractedData?.month || '',
      year:  toNumberBR(extractedData?.year)  || extractedData?.year  || '',
      consumption_kwh: totalKwh,
      total_value_brl: totalValueBrl,
      has_reactive: Boolean(extractedData?.hasReactive),
      has_gd: Boolean(extractedData?.gdiKWh) && toNumberBR(extractedData?.gdiKWh) > 0,
      tariff: extractedData?.tariff || 'N/D',
      value_per_kwh: valuePerKwh,
    };

    // usa seu advisor e score existentes
    const diag = diagnosticoEnergeticoConsultivo({
      month: String(consultParsed.month),
      year: String(consultParsed.year),
      consumption_kwh: consultParsed.consumption_kwh,
      total_value_brl: consultParsed.total_value_brl,
      value_per_kwh: consultParsed.value_per_kwh,
      has_reactive: consultParsed.has_reactive,
      has_gd: consultParsed.has_gd,
      tariff: consultParsed.tariff,
    });
    const score = computeConsultativeScore(consultParsed);

    await saveTechnicalAnalysis(userId, {
      ...consultParsed,
      score_total: score.total,
      score_breakdown_json: JSON.stringify(score.breakdown),
      recommendations_json: diag.tips ?? [],
      created_at: new Date().toISOString(),
    });

    // DEBUG: ler a última linha de diagnosis e logar
    const lastRow = await getLastDiagnosisRow(userId);
    console.log('[DEBUG last diagnosis row]', lastRow);

    console.log('[DEBUG] saved diagnosis row', {
      consumption_kwh: consultParsed.consumption_kwh,
      total_value_brl: consultParsed.total_value_brl,
      value_per_kwh: consultParsed.value_per_kwh,
    });

    // Objeto com o diagnóstico salvo para retornar na resposta
    const diagnosisSaved = {
      user_id: userId,
      month: consultParsed.month,
      year: consultParsed.year,
      consumption_kwh: consultParsed.consumption_kwh,
      total_value_brl: consultParsed.total_value_brl,
      value_per_kwh: consultParsed.value_per_kwh,
      score_total: score.total,
      score_breakdown: score.breakdown,
      recommendations: diag.tips ?? [],
      created_at: new Date().toISOString(),
    };

    // resposta final (mantenha sua resposta, mas inclua os números já normalizados):
    res.status(200).json({
      message: 'Arquivo enviado e processado com sucesso!',
      extractedData: {
        ...extractedData,
        eletricityKWh: teKwh,
        sceeeKWh: sceeeKwh,
        totalConsumptionKwh: totalKwh,
        totalValueBrl: totalValueBrl,
        valuePerKwh
      },
      economy,
      points,
      diagnosis: diagnosisSaved,   // <<< devolve o diagnóstico salvo
    });

  } catch (error: any) {
    console.error('[API] Erro em /api/invoices/analyze-pdf:', error?.message || error);
    res.status(500).json({ message: 'Erro ao analisar o PDF.' });
  }
});

app.get('/api/users/:userId/last-invoice', async (req, res) => {
  try {
    const { userId } = req.params;
    const inv = await getLastInvoiceNormalized(userId);
    if (!inv) {
      console.warn('[last-invoice] nenhum registro para', userId);
      res.status(404).json({ message: 'Nenhuma fatura encontrada.' });
      return;
    }

    // tenta casar com o diagnóstico mais recente do mesmo mês/ano
    const diagResp = await getDiagnosisByUser(userId, { limit: 10 });
    const diags = Array.isArray((diagResp as any)?.items)
      ? (diagResp as any).items
      : Array.isArray(diagResp)
        ? (diagResp as any)
        : [];

    const match = diags.find((d: any) => Number(d.month) === Number(inv.month) && Number(d.year) === Number(inv.year));

    res.json({
      ...inv,
      tips: match?.recommendations ?? match?.tips ?? [],
      score_total: match?.score_total ?? 0,
      score_breakdown: match?.score_breakdown ?? {},
    });
  } catch (e: any) {
    console.error('[last-invoice] error', e?.message);
    res.status(500).json({ message: 'Erro ao obter última fatura.' });
  }
});

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