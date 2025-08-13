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
