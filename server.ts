import { buildApp } from './src/app/app';
import cors from '@fastify/cors';

async function start() {


  const app = await buildApp();

  await app.register(cors, {
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await app.listen({ port: 4000 });
  console.log(' Server listening on http://localhost:4000');
}

start();