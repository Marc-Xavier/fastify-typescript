import { buildApp } from './app/app';

async function start() {
  const app = await buildApp();
  await app.listen({ port: 3000 });
  console.log('🚀 Server listening on http://localhost:3000');
}

start();
