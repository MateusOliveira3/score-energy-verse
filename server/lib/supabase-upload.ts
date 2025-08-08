import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Verificar se as variáveis estão definidas
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_BUCKET;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL não está definida no arquivo .env');
}

if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY não está definida no arquivo .env');
}

if (!bucketName) {
  throw new Error('SUPABASE_BUCKET não está definida no arquivo .env');
}

console.log('[Supabase Config] URL:', supabaseUrl);
console.log('[Supabase Config] Bucket:', bucketName);

const supabase = createClient(supabaseUrl, supabaseKey);

export async function uploadInvoiceToSupabase(userId: string, filePath: string, originalName: string) {
  try {
    console.log(`[Supabase Upload] Iniciando upload para usuário: ${userId}`);
    
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = `${userId}/${Date.now()}_${originalName}`;
    
    console.log(`[Supabase Upload] Fazendo upload do arquivo: ${fileName}`);
    
    const { data, error } = await supabase.storage
      .from(bucketName!)
      .upload(fileName, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      console.error('[Supabase Upload] Erro no upload:', error);
      throw new Error('Erro ao fazer upload para o Supabase: ' + error.message);
    }

    console.log(`[Supabase Upload] Upload concluído com sucesso: ${data.path}`);
    
    // Gerar URL pública para o arquivo
    const { data: urlData } = supabase.storage
      .from(bucketName!)
      .getPublicUrl(data.path);

    return {
      id: data.path,
      name: originalName,
      webViewLink: urlData.publicUrl,
      path: data.path
    };
    
  } catch (error) {
    console.error('[Supabase Upload] Erro geral:', error);
    
    // FALLBACK: Salvar localmente se o Supabase não estiver acessível
    console.log('[Supabase Upload] Usando fallback local...');
    
    try {
      // Criar pasta local para uploads se não existir
      const uploadsDir = './uploads';
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Criar pasta do usuário se não existir
      const userDir = `${uploadsDir}/${userId}`;
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }
      
      // Copiar arquivo para pasta do usuário
      const fileName = `${Date.now()}_${originalName}`;
      const destinationPath = `${userDir}/${fileName}`;
      fs.copyFileSync(filePath, destinationPath);
      
      console.log(`[Supabase Upload] Arquivo salvo localmente: ${destinationPath}`);
      
      return {
        id: `local_${Date.now()}`,
        name: fileName,
        webViewLink: `/uploads/${userId}/${fileName}`,
        path: destinationPath
      };
      
    } catch (fallbackError) {
      console.error('[Supabase Upload] Erro no fallback local:', fallbackError);
      throw new Error('Falha ao fazer upload do arquivo (Supabase e local)');
    }
  }
}
