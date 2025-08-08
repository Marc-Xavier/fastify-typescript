import { FastifyInstance } from 'fastify';
import { StudentService } from './student.service';

export async function studentRoutes(app: FastifyInstance) {
  const service = new StudentService(app);

  app.post('/students/addstudent', async (request, reply) => {
    try {
      const student = service.create(request.body as { studentName: string });
      return reply.code(201).send(student);
    } catch (err: any) {
      return reply.code(400).send({ error: err.message });
    }
  });

  
 app.get('/students', async (request, reply) => {
    try {
      const students = service.getAll();
      return reply.send(students);
    } catch (err: any) {
      return reply.code(500).send({ error: err.message });
    }
  });

  app.delete('/students/:studentgradeid', async (request, reply) => {
    try {
      const studentId = parseInt((request.params as any).studentgradeid, 10);
      if (isNaN(studentId)) {
        return reply.code(400).send({ message: 'Invalid student ID.' });
      }

      const result = service.deleteById(studentId);
      return reply.code(200).send(result);
    } catch (error: any) {
      return reply.code(404).send({ message: error.message ?? 'Unknown error occurred.' });
    }
  });

}
