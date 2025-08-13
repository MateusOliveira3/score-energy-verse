import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testUpload() {
  try {
    console.log('🧪 Testando upload de fatura...');
    
    const form = new FormData();
    form.append('invoice', fs.createReadStream('test_invoice.pdf'));
    form.append('userId', 'user_1750536675273');
    
    const response = await fetch('http://localhost:3001/api/invoices/upload', {
      method: 'POST',
      body: form
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Upload realizado com sucesso!');
      console.log('📊 Resultado:', JSON.stringify(result, null, 2));
      
      // Verificar se a análise consultiva foi gerada
      if (result.scoreConsultivo) {
        console.log('🎯 Análise consultiva gerada:');
        console.log('   Score:', result.scoreConsultivo.total);
        console.log('   Dicas:', result.diagnostico);
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Erro no upload:', response.status, errorText);
    }
  } catch (error) {
    console.error('💥 Erro durante o teste:', error.message);
  }
}

testUpload();
