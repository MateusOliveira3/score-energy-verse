#!/usr/bin/env node
import fs from 'node:fs';
import path from 'path';

console.log('=== Teste Simples ===');
console.log('Diretório atual:', process.cwd());
console.log('Arquivo PDF existe:', fs.existsSync('./test_invoice.pdf'));
console.log('Tamanho do PDF:', fs.statSync('./test_invoice.pdf').size, 'bytes');

try {
  const pdfContent = fs.readFileSync('./test_invoice.pdf', 'utf8');
  console.log('Primeiros 100 chars do PDF:', pdfContent.substring(0, 100));
} catch (error) {
  console.error('Erro ao ler PDF:', error.message);
}

// Teste simples das funções
console.log('🧪 Testando funções básicas...');

// Simular as funções para teste
function toNumberBR(x) {
  if (x === null || x === undefined) return 0;
  if (typeof x === 'number' && isFinite(x)) return x;
  const s = String(x).trim();
  if (!s) return 0;
  const n = parseFloat(s.replace(/\./g, '').replace(',', '.'));
  return isFinite(n) ? n : 0;
}

function asSheetNumber(x, decimals) {
  const n = toNumberBR(x);
  if (!isFinite(n)) return 0;
  if (typeof decimals === 'number') return Number(n.toFixed(decimals));
  return n;
}

function normalizeTariffKWh(raw) {
  const n = toNumberBR(raw);
  if (n === 0) return 0;
  return n >= 5 ? n / 1000 : n;
}

// Testes
console.log('\n📊 toNumberBR:');
console.log('"1.234,56" ->', toNumberBR("1.234,56"));
console.log('"abc" ->', toNumberBR("abc"));
console.log('null ->', toNumberBR(null));

console.log('\n📋 asSheetNumber:');
console.log('"1.234,56" (2 dec) ->', asSheetNumber("1.234,56", 2));
console.log('123.456789 (2 dec) ->', asSheetNumber(123.456789, 2));

console.log('\n⚡ normalizeTariffKWh:');
console.log('"362.600" ->', normalizeTariffKWh("362.600"));
console.log('"0.362" ->', normalizeTariffKWh("0.362"));

console.log('\n✅ Testes básicos concluídos!');
