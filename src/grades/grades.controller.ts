import { FastifyInstance } from 'fastify';
import { GradeService } from './grade.service';

export async function GradeRoutes(app: FastifyInstance) {
  const Grade = new GradeService(app);

  app.get('/grades/status', async (request, reply) => {
    try {
      const statuses = await Grade.getAllAttendanceStatuses();
      reply.send({ data: statuses });
    } catch (error: any) {
      reply.code(500).send({ message: error.message });
    }
  });

app.post<{
  Body: {
    attendanceDate?: string;
    scoretype: string;
    perfectscore: number;
  };
}>('/grades/addgrade', async (request, reply) => {
  try {
    const result = await Grade.create(request.body);
    reply.code(201).send(result);
  } catch (error: any) {
    reply.code(400).send({ message: error.message });
  }
});


app.delete<{
  Params: {
    gradeid: string;
  };
}>('/grades/:gradeid', async (request, reply) => {
  try {
    const gradeid = parseInt(request.params.gradeid, 10);
    if (isNaN(gradeid)) {
      return reply.code(400).send({ message: 'Invalid grade ID.' });
    }
    const result = await Grade.deleteGradeById(gradeid);
    reply.send(result);
  } catch (error: any) {
    reply.code(404).send({ message: error.message });
  }
});


app.put<{
  Params: { id: string };
  Body: { perfectscore: number };
}>('/grades/updateperfectscore/:id', async (request, reply) => {
  try {
    const gradeid = parseInt(request.params.id, 10);
    const { perfectscore } = request.body;

    if (isNaN(gradeid)) {
      return reply.code(400).send({ message: 'Invalid grade ID.' });
    }

    const result = await Grade.updatePerfectScore(gradeid, perfectscore);
    reply.send(result);
  } catch (error: any) {
    reply.code(400).send({ message: error.message });
  }
});


app.post<{
  Body: {
    attendanceDate?: string;
    scoretype: string;
    perfectscore: number;
  };
}>('/grades/addattendance', async (request, reply) => {
  try {
    const result = await Grade.createAttendance(request.body);
    reply.code(201).send(result);
  } catch (error: any) {
    reply.code(400).send({ message: error.message });
  }
});


app.put<{
  Params: { id: string };
  Body: { score: number };
}>('/grades/updatescore/:id', async (request, reply) => {
  try {
    const scoreid = parseInt(request.params.id);
    const { score } = request.body;
    if (isNaN(scoreid)) {
      return reply.code(400).send({ message: 'Invalid score ID.' });
    }
    const result = await Grade.updateScore(scoreid, score);
    reply.send(result);
  } catch (error: any) {
    reply.code(400).send({ message: error.message });
  }
});


 app.get<{
  Params: { scoretype: string };
}>('/grades/getattendance/:scoretype', async (request, reply) => {
  try {
    const scoretype = request.params.scoretype;
    const data = await Grade.getAttendance(scoretype);
    reply.send({ message: `Scores for scoretype: ${scoretype}`, data });
  } catch (error: any) {
    reply.code(400).send({ message: error.message || 'Failed to get scores' });
  }
});


 app.get<{
  Params: { scoretype: string };
}>('/grades/:scoretype', async (request, reply) => {
  try {
    const scoretype = request.params.scoretype;
    const data = await Grade.getScoresByScoreType(scoretype);
    reply.send({ message: `Scores for scoretype: ${scoretype}`, data });
  } catch (error: any) {
    reply.code(400).send({ message: error.message || 'Failed to get scores' });
  }
});


  app.put('/grades/attendance/:id', async (request, reply) => {
  try {
    const { id } = request.params as { id: string };
    const { attendanceStatus } = request.body as { attendanceStatus: string };

    const scoreid = parseInt(id, 10);
    if (isNaN(scoreid)) {
      return reply.code(400).send({ message: 'Invalid score ID.' });
    }

    const result = await Grade.updateAttendance(scoreid, attendanceStatus);
    reply.send(result);
  } catch (error: any) {
    reply.code(400).send({ message: error.message });
  }
});

}
