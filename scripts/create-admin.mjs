import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api/auth/signup';

async function createAdminUser() {
  console.log('Criando usuário admin...');

  const adminCredentials = {
    email: 'admin@score.local',
    password: 'admin',
  };

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminCredentials),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Erro ao criar admin: ${data.message || 'Erro desconhecido'}`);
      return;
    }

    console.log('Usuário admin criado com sucesso!');
    console.log(data);

  } catch (error) {
    console.error('Falha ao conectar com a API. O servidor está rodando?', error);
  }
}

createAdminUser(); 