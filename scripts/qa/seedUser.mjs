import process from 'node:process';
import {
  assertSafeQaEnvironment,
  distQaRuntimeSeedPath,
  ensureQaReadme,
  publicQaRuntimeSeedPath,
  QA_LOCAL_CONFIRMATION,
  QA_SEED_EMAIL,
  QA_SEED_PASSWORD,
  QA_SEED_USER_ID,
  qaUrl,
  writeQaRuntimeArtifacts,
} from './runtime.mjs';

assertSafeQaEnvironment({
  commandName: 'qa:seed-user',
  confirmation: QA_LOCAL_CONFIRMATION,
  env: process.env,
  targetUrl: qaUrl,
});

await ensureQaReadme();

const createdAt = new Date().toISOString();
const result = await writeQaRuntimeArtifacts({
  createdAt,
  email: QA_SEED_EMAIL,
  password: QA_SEED_PASSWORD,
  userId: QA_SEED_USER_ID,
});

console.log('QA seed local preparado com sucesso.');
console.log(`URL alvo: ${qaUrl}`);
console.log(`Email: ${QA_SEED_EMAIL}`);
console.log(`Senha: ${QA_SEED_PASSWORD}`);
console.log(`User ID local: ${QA_SEED_USER_ID}`);
console.log(`Seed publico atualizado: ${publicQaRuntimeSeedPath}`);
console.log(
  `Seed do preview atualizado: ${result.wroteDistRuntime ? distQaRuntimeSeedPath : 'dist ainda nao existe; gere build para usar preview manual'}`
);
console.log(`Versao do seed: ${result.seedVersion}`);
console.log('Estado inicial gerado: conta QA local garantida, sessao removida, jornada limpa e faturas locais ignoradas/removidas ao carregar o app em host local.');
console.log('Se o preview ou dev ja estiver aberto no navegador, recarregue /login para aplicar o seed no browser manual.');
