import fp from 'fastify-plugin';
import Database from 'better-sqlite3';
import { FastifyInstance } from 'fastify';

export default fp(async function dbPlugin(fastify: FastifyInstance, opts) {
  const db = new Database('db.sqlite'); // or ':memory:' for testing
  fastify.decorate('db', db);
});

declare module 'fastify' {
  interface FastifyInstance {
    db: Database.Database;
  }
}
