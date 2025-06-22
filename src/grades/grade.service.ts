// Lean Fastify-style GradeService with better-sqlite3 raw SQL
import { FastifyInstance } from 'fastify';

interface CreateGradeDto {
  attendanceDate?: string;
  scoretype: string;
  perfectscore: number;
}

export class GradeService {
  constructor(private app: FastifyInstance) {}

  create(data: CreateGradeDto) {
    const db = this.app.db;
    const allowedScoreTypes = ['Attendance', 'Quiz', 'Project', 'Exam'];

    if (!allowedScoreTypes.includes(data.scoretype)) {
      throw new Error('Invalid scoretype.');
    }

    const insertTransaction = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO gradelists (attendanceDate, scoretype, perfectscore, active)
        VALUES (?, ?, ?, 1)
      `).run(data.attendanceDate || null, data.scoretype, data.perfectscore);

      const gradeid = result.lastInsertRowid;

      const students = db.prepare(`SELECT studentgradeid FROM studentlists`).all() as { studentgradeid: number }[];

      const insertScore = db.prepare(`
        INSERT INTO scorelists (studentgradeid, gradeid, attendanceStatus, score, active)
        VALUES (?, ?, '', 0, 1)
      `);

      for (const student of students) {
        insertScore.run(student.studentgradeid, gradeid);
      }

      return {
        message: 'Grade and scores created.',
        gradeid,
        scoresCreated: students.length
      };
    });

    return insertTransaction();
  }

  deleteGradeById(gradeid: number) {
    const db = this.app.db;

    const result = db.transaction(() => {
      const grade = db.prepare(`SELECT * FROM gradelists WHERE gradeid = ?`).get(gradeid);
      if (!grade) throw new Error('Grade not found.');

      const scoresDeleted = db.prepare(`DELETE FROM scorelists WHERE gradeid = ?`).run(gradeid).changes;
      db.prepare(`DELETE FROM gradelists WHERE gradeid = ?`).run(gradeid);

      return {
        message: 'Grade and scores deleted.',
        scoresDeleted
      };
    });

    return result;
  }

  updatePerfectScore(gradeid: number, newPerfectScore: number) {
    const db = this.app.db;
    if (typeof newPerfectScore !== 'number' || newPerfectScore <= 0) {
      throw new Error('Invalid perfectscore.');
    }

    const result = db.transaction(() => {
      const grade = db.prepare(`SELECT * FROM gradelists WHERE gradeid = ?`).get(gradeid);
      if (!grade) throw new Error('Grade not found.');

      db.prepare(`UPDATE gradelists SET perfectscore = ? WHERE gradeid = ?`) 
        .run(newPerfectScore, gradeid);
      db.prepare(`UPDATE scorelists SET score = 0 WHERE gradeid = ?`).run(gradeid);

      return {
        message: 'Perfect score updated. Scores reset.',
        gradeid,
        perfectscore: newPerfectScore
      };
    });

    return result;
  }

  createAttendance(data: CreateGradeDto) {
    return this.create({ ...data, scoretype: 'Attendance', perfectscore: 10 });
  }

  updateScore(scoreid: number, newScore: number) {
    const db = this.app.db;
    if (typeof newScore !== 'number' || newScore <= 0) {
      throw new Error('Invalid score input.');
    }

    const score = db.prepare(`SELECT * FROM scorelists WHERE scoreid = ?`).get(scoreid) as { gradeid: number } | undefined;
    if (!score) throw new Error('Score not found.');

    const grade = db.prepare(`SELECT * FROM gradelists WHERE gradeid = ?`).get(score.gradeid) as { perfectscore: number } | undefined;
    if (!grade) throw new Error('Associated grade not found.');

    if (newScore > grade.perfectscore) {
      throw new Error(`Score cannot exceed ${grade.perfectscore}`);
    }

    db.prepare(`UPDATE scorelists SET score = ? WHERE scoreid = ?`).run(newScore, scoreid);

    return {
      message: 'Score updated.',
      scoreid,
      newScore
    };
  }

  updateAttendance(scoreid: number, attendanceStatus: string) {
    const db = this.app.db;
    const score = db.prepare(`SELECT * FROM scorelists WHERE scoreid = ?`).get(scoreid) as { gradeid: number } | undefined;
    if (!score) throw new Error('Attendance not found.');

    const grade = db.prepare(`SELECT * FROM gradelists WHERE gradeid = ?`).get(score.gradeid);
    if (!grade) throw new Error('Associated grade not found.');

    const status = attendanceStatus.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
    let newScore = 0;

    switch (status) {
      case 'Present': newScore = 10; break;
      case 'Absent': newScore = 0; break;
      case 'Late': newScore = 7; break;
      case 'Excused': newScore = 5; break;
      default:
        throw new Error('Invalid attendance status.');
    }

    db.prepare(`UPDATE scorelists SET score = ?, attendanceStatus = ? WHERE scoreid = ?`)
      .run(newScore, status, scoreid);

    return {
      message: 'Attendance updated.',
      scoreid,
      attendanceStatus: status,
      score: newScore
    };
  }

  getAllAttendanceStatuses() {
    const db = this.app.db;
    return db.prepare(`SELECT status FROM attendance ORDER BY id ASC`).all()
      .map((row: any) => row.status);
  }

async getScoresByScoreType(scoretype: string) {
  const db = this.app.db;

  const allowedTypes = ['Attendance', 'Quiz', 'Project', 'Exam'];
  if (!allowedTypes.includes(scoretype)) {
    throw new Error('Invalid scoretype.');
  }

  const grades = db
    .prepare(`SELECT gradeid, perfectscore, attendanceDate FROM gradelists WHERE scoretype = ? ORDER BY gradeid ASC`)
    .all(scoretype) as { gradeid: number; perfectscore: number; attendanceDate: string }[];

  const gradeIds = grades.map((g) => g.gradeid);

  const students = db
    .prepare(`SELECT studentgradeid, studentName FROM studentlists ORDER BY studentName ASC`)
    .all() as { studentgradeid: number; studentName: string }[];

  const getScores = db.prepare(`SELECT scoreid, gradeid, score, attendanceStatus FROM scorelists WHERE studentgradeid = ?`);

  type ScoreRow = { scoreid: number; gradeid: number; score: number | null; attendanceStatus: string };

  const result = students.map((student) => {
    const scores = getScores.all(student.studentgradeid) as ScoreRow[];
    const scoreMap: Record<number, { scoreid: number; score: number | null; attendanceStatus: string }> = {};

    for (const gradeid of gradeIds) {
      const entry = scores.find((s) => s.gradeid === gradeid);
      scoreMap[gradeid] = entry
        ? { scoreid: entry.scoreid, score: entry.score, attendanceStatus: entry.attendanceStatus }
        : { scoreid: 0, score: null, attendanceStatus: '' };
    }

    return {
      studentName: student.studentName,
      scores: scoreMap,
    };
  });

  return {
    headers: grades.map((g) => ({
      gradeid: g.gradeid,
      perfectscore: g.perfectscore,
      attendanceDate: g.attendanceDate,
    })),
    students: result,
  };
}

async getAttendance(scoretype: string) {
  const db = this.app.db;

  const allowedTypes = ['Attendance'];
  if (!allowedTypes.includes(scoretype)) {
    throw new Error('Invalid scoretype.');
  }

  const grades = db
    .prepare(`SELECT gradeid, perfectscore, attendanceDate FROM gradelists WHERE scoretype = ? ORDER BY gradeid ASC`)
    .all(scoretype) as { gradeid: number; perfectscore: number; attendanceDate: string }[];

  const gradeIds = grades.map((g) => g.gradeid);

  const students = db
    .prepare(`SELECT studentgradeid, studentName FROM studentlists ORDER BY studentName ASC`)
    .all() as { studentgradeid: number; studentName: string }[];

  const getScores = db.prepare(`SELECT scoreid, gradeid, score, attendanceStatus FROM scorelists WHERE studentgradeid = ?`);

  type ScoreRow = { scoreid: number; gradeid: number; score: number | null; attendanceStatus: string };

  const result = students.map((student) => {
    const scores = getScores.all(student.studentgradeid) as ScoreRow[];
    const scoreMap: Record<number, { scoreid: number; score: number | null; attendanceStatus: string }> = {};

    for (const gradeid of gradeIds) {
      const entry = scores.find((s) => s.gradeid === gradeid);
      scoreMap[gradeid] = entry
        ? { scoreid: entry.scoreid, score: entry.score, attendanceStatus: entry.attendanceStatus }
        : { scoreid: 0, score: null, attendanceStatus: '' };
    }

    return {
      studentName: student.studentName,
      scores: scoreMap,
    };
  });

  return {
    headers: grades.map((g) => ({
      gradeid: g.gradeid,
      perfectscore: g.perfectscore,
      attendanceDate: g.attendanceDate,
    })),
    students: result,
  };
}
}
