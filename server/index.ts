import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getUserProfile, createUser, signInUser, getInvoices, uploadFileToDrive, createInvoiceRecord } from './google-service';
import bcrypt from 'bcrypt';
import multer from 'multer';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Configuração do Multer para armazenamento em memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// Tipos para middlewares assíncronos
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

const asyncHandler = (fn: AsyncRequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
};

// Endpoint de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Endpoint para buscar perfil de usuário
app.get('/api/users/:userId/profile', asyncHandler(async (req, res) => {
  console.log(`[API] Requisição recebida: GET /api/users/${req.params.userId}/profile`);
  try {
    const { userId } = req.params;
    const profile = await getUserProfile(userId);

    if (profile) {
      console.log(`[API] Perfil encontrado para ${userId}. Enviando resposta.`);
      res.json(profile);
    } else {
      console.log(`[API] Perfil não encontrado para ${userId}. Enviando 404.`);
      res.status(404).json({ message: 'Perfil não encontrado.' });
    }
  } catch (error) {
    console.error('[API] Erro no endpoint de perfil:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar perfil.' });
  }
}));

// Endpoint para buscar faturas de um usuário
app.get('/api/users/:userId/invoices', asyncHandler(async (req, res) => {
  console.log(`[API] Requisição recebida: GET /api/users/${req.params.userId}/invoices`);
  try {
    const { userId } = req.params;
    const invoices = await getInvoices(userId);
    res.json(invoices);
  } catch (error) {
    console.error('[API] Erro no endpoint de faturas:', error);
    res.status(500).json({ message: 'Erro no servidor ao buscar faturas.' });
  }
}));

// Endpoint para upload de arquivo de fatura
app.post('/api/invoices/upload', upload.single('invoice'), asyncHandler(async (req, res) => {
  const userId = req.body.userId; // O ID do usuário deve ser enviado no corpo
  console.log(`[API] Requisição recebida: POST /api/invoices/upload para o usuário ${userId}`);
  
  if (!req.file) {
    return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
  }
  if (!userId) {
    return res.status(400).json({ message: 'ID do usuário não fornecido.' });
  }
  
  const uploadedFile = await uploadFileToDrive(req.file, userId);
  console.log('[API] Arquivo enviado para o Drive com sucesso.');
  res.json({
    message: 'Upload bem-sucedido!',
    fileUrl: uploadedFile.url,
    fileName: req.file.originalname,
    fileId: uploadedFile.id
  });
}));

// Endpoint para registrar os dados da fatura na planilha
app.post('/api/invoices', asyncHandler(async (req, res) => {
  const invoiceData = req.body;
  console.log('[API] Recebido dados da fatura para registrar:', invoiceData);

  await createInvoiceRecord(invoiceData);

  console.log('[API] Fatura registrada na planilha com sucesso.');
  res.status(201).json({ message: 'Fatura registrada com sucesso!' });
}));

// Endpoint para fazer login (signin)
app.post('/api/auth/signin', asyncHandler(async (req, res) => {
  console.log('[API] Requisição recebida: POST /api/auth/signin');
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    const user = await signInUser(email, password);

    if (user) {
      console.log(`[API] Login bem-sucedido para ${email}.`);
      res.json(user);
    } else {
      console.log(`[API] Credenciais inválidas para ${email}.`);
      res.status(401).json({ message: 'Credenciais inválidas.' });
    }
  } catch (error) {
    console.error('[API] Erro no endpoint de signin:', error);
    res.status(500).json({ message: 'Erro no servidor ao fazer login.' });
  }
}));

// Endpoint para criar um novo usuário (signup)
app.post('/api/auth/signup', asyncHandler(async (req, res) => {
  console.log('[API] Requisição recebida: POST /api/auth/signup');
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
  }

  try {
    // Criptografar a senha
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Chamar o serviço para criar o usuário e todos os dados
    const newUser = await createUser(email, passwordHash);

    console.log(`[API] Usuário ${email} criado com sucesso.`);
    res.status(201).json(newUser);
  } catch (error) {
    console.error('[API] Erro no endpoint de signup:', error);
    res.status(500).json({ message: 'Erro no servidor ao criar usuário.' });
  }
}));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("[API] Erro não tratado:", err);
    res.status(500).json({ message: err.message || "Ocorreu um erro interno no servidor." });
});

app.listen(port, () => {
  console.log(`⚡️ Server rodando na porta ${port}`);
}); 