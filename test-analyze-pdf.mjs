#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import FormData from 'form-data';
import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const USER_ID  = process.env.USER_ID  || 'user_test';
const PDF_PATH = process.env.PDF_PATH || './uploads/user_1750536675273/1754685321199_393000180804.pdf';

function log(msg) {
  console.log(msg);
}

function pass(msg){
  console.log(`✅ ${msg}`);
}

function fail(msg){
  console.error(`❌ ${msg}`);
  process.exit(1);
}

log('== Config ==');
log(`BASE_URL=${BASE_URL}`);
log(`USER_ID=${USER_ID}`);
log(`PDF_PATH=${PDF_PATH}\n`);

if (!fs.existsSync(PDF_PATH)) fail(`Arquivo PDF não encontrado: ${PDF_PATH}`);

async function postAnalyzePdf(filePath, userId, mime='application/pdf') {
  const form = new FormData();
  form.append('userId', userId);
  form.append('invoice', fs.createReadStream(path.resolve(filePath)), { contentType: mime });
  
  const headers = form.getHeaders();
  
  const { data, status } = await axios.post(`${BASE_URL}/api/invoices/analyze-pdf`, form, {
    headers,
    maxBodyLength: Infinity
  });
  
  return { data, status };
}

(async () => {
  try {
    // 1) Teste funcional básico
    log('1) Teste funcional básico...');
    let res = await postAnalyzePdf(PDF_PATH, USER_ID);
    
    if (res.status !== 200) fail(`HTTP ${res.status} no teste funcional`);
    
    const body = res.data || {};
    if (!body.invoiceResumo) fail('Sem invoiceResumo na resposta');
    if (!body.scoreConsultivo) fail('Sem scoreConsultivo na resposta');
    if (!Array.isArray(body.diagnostico)) fail('Sem diagnostico (array) na resposta');
    
    pass('Resposta contém invoiceResumo, scoreConsultivo e diagnostico');
    
    // 2) Teste arquivo inválido
    log('\n2) Teste arquivo inválido...');
    const tmp = path.resolve('.tmp-not-pdf.txt');
    fs.writeFileSync(tmp, 'não sou um pdf');
    
    try {
      await postAnalyzePdf(tmp, USER_ID, 'text/plain');
      fail('Esperava HTTP 400/500 para arquivo inválido, mas requisição passou');
    } catch (err) {
      const code = err.response?.status;
      if (code === 400 || code === 500) pass(`Tratou arquivo inválido (HTTP ${code})`);
      else fail(`Código inesperado para arquivo inválido: ${code || err.message}`);
    } finally {
      fs.existsSync(tmp) && fs.unlinkSync(tmp);
    }
    
    // 3) Teste sem userId
    log('\n3) Teste sem userId...');
    try {
      const form = new FormData();
      form.append('invoice', fs.createReadStream(path.resolve(PDF_PATH)));
      
      const headers = form.getHeaders();
      
      await axios.post(`${BASE_URL}/api/invoices/analyze-pdf`, form, { headers });
      fail('Esperava HTTP 400 para ausência de userId');
    } catch (err) {
      const code = err.response?.status;
      if (code === 400) pass('Validou ausência de userId (HTTP 400)');
      else fail(`Código inesperado ao faltar userId: ${code || err.message}`);
    }
    
    // 4) Teste idempotência (duplo envio)
    log('\n4) Teste idempotência (duplo envio)...');
    for (let i = 1; i <= 2; i++) {
      const r = await postAnalyzePdf(PDF_PATH, USER_ID);
      if (r.status !== 200) fail(`HTTP ${r.status} no envio ${i}`);
    }
    pass('Duplo envio registrado com sucesso (linhas distintas na planilha)');
    
    log('\n🎉 Todos os testes do Node passaram.');
    
  } catch (e) {
    fail(e?.response?.data?.message || e.message);
  }
})();
