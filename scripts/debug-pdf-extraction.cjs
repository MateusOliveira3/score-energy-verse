const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Simular as funções de extração do server/index.ts
function findClosestValue(text, keyword, valuePattern) {
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

function findFirstCommaNumberAfterKeyword(text, keyword) {
  let keywordRegex = typeof keyword === 'string' ? new RegExp(keyword, 'i') : keyword;
  let keywordMatch = text.match(keywordRegex);
  if (!keywordMatch) return 'Não encontrado';
  let startIdx = (keywordMatch.index ?? 0) + keywordMatch[0].length;
  let afterKeyword = text.slice(startIdx);
  let valueMatch = afterKeyword.match(/\d{1,3},\d{2}/);
  return valueMatch ? valueMatch[0] : 'Não encontrado';
}

function sumAllConsumoTE(text) {
  let matches = [...text.matchAll(/Consumo\s*TE\s*KWH\s*(\d{1,4},\d{3})/gi)];
  return matches.reduce((acc, m) => acc + parseFloat(m[1].replace(',', '.')), 0);
}

function findUnitValues(text, tipo) {
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

function findBandeiraTarifaria(text) {
  // Procurar por padrões como: (2L) Bandeira Amarela KWH
  let match = text.match(/Bandeira\s+(Verde|Amarela|Vermelha)/i);
  if (match && match[1]) return match[1];
  
  // Alternativa: buscar só por "Verde", "Amarela", "Vermelha" próximo de "R$"
  let alt = text.match(/(Verde|Amarela|Vermelha)\s*R\$/i);
  if (alt && alt[1]) return alt[1];
  
  // Procurar por "Etapa: Verde" ou similar
  let etapa = text.match(/Etapa:\s*(Verde|Amarela|Vermelha)/i);
  if (etapa && etapa[1]) return etapa[1];
  
  return 'Verde'; // Padrão para residencial
}

function extractHistoricoConsumo(text) {
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
  const historico = [];
  for (let i = 0; i < N; i++) {
    historico.push({
      mes: meses[i],
      consumo: consumosFinal[i] || 0,
      dias: diasFinal[i] || 0
    });
  }
  return historico;
}

function debugPdfExtraction() {
  try {
    console.log('🔍 Iniciando debug da extração de PDF com dados reais...');
    
    // Dados reais do PDF da Celesc
    const testText = `
      RESIDENCIAL - RESIDENCIAL - B1 Residencial - MONOFÁSICO  21062553  69260659 Cliente:  05/2025   28/05/2025   285,20 R$  OLAVO ANTONIO DE OLIVEIRA NOME:  ***.170.198-** CPF/CNPJ:  MANOEL BORGES 248 - LAGOAO ENDERECO:  88900-000 CEP:   ARARANGUA SC CIDADE:   B Grupo/Subgrupo Tensão:   B1 /  09/04/2025   12/05/2025   33   10/06/2025  046523370 NOTA FISCAL Nº   001 SERIE:   12/05/2025 DATA EMISSAO:  PIS   227,53   0,94   2,13  COFINS   227,53   4,33   9,84  ICMS   112,43   12,00   13,50  ICMS   154,93   17,00   26,34  (0D) Consumo TE   KWH   150,000   0,362600   54,39   2,52   54,39   12,00   6,53   0,302240  (0D) Consumo TE   KWH   195,000   0,384359   74,95   3,27   74,95   17,00   12,74   0,302240  (0E) Consumo TUSD   KWH   150,000   0,378667   56,80   2,63   56,80   12,00   6,82   0,315670  (0E) Consumo TUSD   KWH   195,000   0,401487   78,29   3,42   78,29   17,00   13,31   0,315670  (2L) Bandeira Amarela   KWH   150,000   0,008267   1,24   0,06   1,24   12,00   0,15   0,006841  (2L) Bandeira Amarela   KWH   195,000   0,008667   1,69   0,07   1,69   17,00   0,29   0,006841  SUBTOTAL   267,36  (8H) Correção Monetária   0,000   0,000000   0,10   0,00   0,00   0,00   0,00   0,000000  (AH) Juros 04/2025   0,000   0,000000   0,16   0,00   0,00   0,00   0,00   0,000000  (AM) Multa 04/2025   0,000   0,000000   5,49   0,00   0,00   0,00   0,00   0,000000  (C0) COSIP Municipal   0,000   0,000000   12,09   0,00   0,00   0,00   0,00   0,000000  SUBTOTAL   17,84  Iluminação pública: Ararangua - (48) 3521-0900  Comunicado importante  Consulte Chave de Acesso em:  https://sat.sef.sc.gov.br/nf3e/consulta  Chave de Acesso:  4225.0508.3367.8300.0190.6600.1046.5233.7010.4226.1169  3.422.500.017.767.901 - 12/05/2025 às 23:03 Protocolo de Autorização:  07 Etapa:  Verde   21  Amarela R$ 0,01885   12  TOTAL   285,20  Consumo Faturado   Dias Faturados  ABR/25  MAR/25  FEV/25  JAN/25  DEZ/24  NOV/24  OUT/24  SET/24  AGO/24  JUL/24  JUN/24  MAI/24  338  494  605  478  417  379  317  329  338  347  311  412  28  29  32  31  31  30  30  29  31  29  30  33  ABR/24   0   31  Lida  4893392   Energia   Único   13.874   14.219   1,00000   0,00   345  LEGENDA:  Beneficiário: Celesc Distribuição SA - CNPJ 08336783/0001-90 Av. Itamarati, n 160 - Itacorubi - Florianópolis - SC CP: 88.034-900  PAGÁVEL EM QUALQUER AGÊNCIA BANCÁRIA  OLAVO ANTONIO DE OLIVEIRA Pagador:  ***.170.198-** CPF/CNPJ:  MANOEL BORGES 248 - LAGOAO Endereço:  88900-000 CEP:   ARARANGUA SC Cidade:  12/05/2025  Data Documento   Número Referência  202505-046523370  Agência / Código Cedente: 0348-4/0136136-8  Unidade Consumidora  0021062553  Nosso Número  14902447656  Referência  05/2025  Vencimento  28/05/2025  Código para Cadastro em Débito Automático:  Total a Pagar (R$)  21062553  285,20  237-2   23790.3480090149.02447465013.613602110950000028520  BRADESCO  (0D) Consumo TE | (0E) Consumo TUSD | (2L) Bandeira Amarela | (8H) Correção Monetária | (AH) Juros | (AM) Multa | (C0) COSIP Municipal Araranguá  PAGUE COM PIX
    `;
    
    console.log('📄 Dados reais do PDF da Celesc. Analisando...');
    
    const cleanedText = testText.replace(/\s+/g, ' ');
    console.log('📝 Texto limpo (primeiros 300 chars):', cleanedText.substring(0, 300) + '...');
    
    // Testar cada extração
    console.log('\n🔍 Testando extrações com dados reais:');
    
    const customerNumber = findClosestValue(cleanedText, /Unidade\s+Consumidora/i, /\d{8,10}/g);
    console.log(`📋 Unidade Consumidora: ${customerNumber}`);
    
    const referenceMonth = findClosestValue(cleanedText, /Refer[êe]ncia/i, /\d{2}\/\d{4}/g);
    console.log(`📅 Referência: ${referenceMonth}`);
    
    const dueDate = findClosestValue(cleanedText, /Vencimento/i, /\d{2}\/\d{2}\/\d{4}/g);
    console.log(`📅 Vencimento: ${dueDate}`);
    
    const totalValueBrl = findFirstCommaNumberAfterKeyword(cleanedText, /Total\s+a\s+Pagar.*?R\$|Total\s+a\s+Pagar/i);
    console.log(`💰 Total a Pagar: ${totalValueBrl}`);
    
    const eletricityKWhTE = sumAllConsumoTE(cleanedText).toFixed(3);
    console.log(`⚡ Consumo TE kWh (soma): ${eletricityKWhTE}`);
    
    // Extrair preço da energia elétrica - procurar por padrões como: 0,362600
    const eletricityPriceMatch = cleanedText.match(/Consumo\s+TE\s+KWH\s+\d{1,4},\d{3}\s+(\d{1,2},\d{6})/i);
    const eletricityPrice = eletricityPriceMatch ? eletricityPriceMatch[1].replace(',', '.') : '0.00';
    console.log(`⚡ Preço Energia Elétrica: ${eletricityPrice}`);
    
    const sceeeKWh = '0,000';
    console.log(`⚡ Energia SCEE kWh: ${sceeeKWh}`);
    
    const sceeePrice = '0,00';
    console.log(`💰 Preço Energia SCEE: ${sceeePrice}`);
    
    const gdiKWh = '0,000';
    console.log(`⚡ Energia compensada GD I kWh: ${gdiKWh}`);
    
    const gdiPrice = '0,00';
    console.log(`💰 Preço Energia compensada GD I: ${gdiPrice}`);
    
    const publicLightingContribution = findClosestValue(cleanedText, /COSIP\s+Municipal/i, /[\d.,]+/g);
    console.log(`💡 Contribuição Iluminação Pública (COSIP): ${publicLightingContribution}`);
    
    const teUnits = findUnitValues(cleanedText, 'TE');
    console.log(`📊 Tarifas TE - Com impostos: ${teUnits.withTax}, Sem impostos: ${teUnits.noTax}`);
    
    const tusdUnits = findUnitValues(cleanedText, 'TUSD');
    console.log(`📊 Tarifas TUSD - Com impostos: ${tusdUnits.withTax}, Sem impostos: ${tusdUnits.noTax}`);
    
    const bandeiraUnits = findUnitValues(cleanedText, 'BANDEIRA');
    console.log(`📊 Tarifas Bandeira - Com impostos: ${bandeiraUnits.withTax}, Sem impostos: ${bandeiraUnits.noTax}`);
    
    const bandeiraTarifaria = findBandeiraTarifaria(cleanedText);
    console.log(`🚦 Bandeira Tarifária: ${bandeiraTarifaria}`);
    
    // Testar extração de histórico
    const historicoConsumo = extractHistoricoConsumo(cleanedText);
    console.log(`📊 Histórico de consumo:`, historicoConsumo);
    
    console.log('\n✅ Debug concluído com dados reais!');
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

debugPdfExtraction();
