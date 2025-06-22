import Fastify from 'fastify';
import dbPlugin from '../plugins/db';
import { studentRoutes } from '../students/students.controller';
import { GradeRoutes } from '../grades/grades.controller';
export async function buildApp() {
  const app = Fastify();

  await app.register(dbPlugin);
  studentRoutes(app);
    GradeRoutes(app);
  return app;
}
