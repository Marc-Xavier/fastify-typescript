import { buildApp } from './src/app/app';
import cors from '@fastify/cors';

async function start() {


  const app = await buildApp();

  await app.register(cors, {
    origin: ['http://localhost:3000', 'https://grading-demo-app.netlify.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });
 
  const port = Number(process.env.PORT) || 4000;

  await app.listen({ port, host: '0.0.0.0' }); // 👈 Required for Render
  console.log(`🚀 Server listening on http://localhost:4000`);
}


start();