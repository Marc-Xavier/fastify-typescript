"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GradeService = void 0;
class GradeService {
    constructor(app) {
        this.app = app;
    }
    create(data) {
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
            const students = db.prepare(`SELECT studentgradeid FROM studentlists`).all();
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
    deleteGradeById(gradeid) {
        const db = this.app.db;
        const result = db.transaction(() => {
            const grade = db.prepare(`SELECT * FROM gradelists WHERE gradeid = ?`).get(gradeid);
            if (!grade)
                throw new Error('Grade not found.');
            const scoresDeleted = db.prepare(`DELETE FROM scorelists WHERE gradeid = ?`).run(gradeid).changes;
            db.prepare(`DELETE FROM gradelists WHERE gradeid = ?`).run(gradeid);
            return {
                message: 'Grade and scores deleted.',
                scoresDeleted
            };
        });
        return result;
    }
    updatePerfectScore(gradeid, newPerfectScore) {
        const db = this.app.db;
        if (typeof newPerfectScore !== 'number' || newPerfectScore <= 0) {
            throw new Error('Invalid perfectscore.');
        }
        const result = db.transaction(() => {
            const grade = db.prepare(`SELECT * FROM gradelists WHERE gradeid = ?`).get(gradeid);
            if (!grade)
                throw new Error('Grade not found.');
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
    createAttendance(data) {
        return this.create(Object.assign(Object.assign({}, data), { scoretype: 'Attendance', perfectscore: 10 }));
    }
    updateScore(scoreid, newScore) {
        const db = this.app.db;
        if (typeof newScore !== 'number' || newScore <= 0) {
            throw new Error('Invalid score input.');
        }
        const score = db.prepare(`SELECT * FROM scorelists WHERE scoreid = ?`).get(scoreid);
        if (!score)
            throw new Error('Score not found.');
        const grade = db.prepare(`SELECT * FROM gradelists WHERE gradeid = ?`).get(score.gradeid);
        if (!grade)
            throw new Error('Associated grade not found.');
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
    updateAttendance(scoreid, attendanceStatus) {
        const db = this.app.db;
        const score = db.prepare(`SELECT * FROM scorelists WHERE scoreid = ?`).get(scoreid);
        if (!score)
            throw new Error('Attendance not found.');
        const grade = db.prepare(`SELECT * FROM gradelists WHERE gradeid = ?`).get(score.gradeid);
        if (!grade)
            throw new Error('Associated grade not found.');
        const status = attendanceStatus.trim().toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
        let newScore = 0;
        switch (status) {
            case 'Present':
                newScore = 10;
                break;
            case 'Absent':
                newScore = 0;
                break;
            case 'Late':
                newScore = 7;
                break;
            case 'Excused':
                newScore = 5;
                break;
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
            .map((row) => row.status);
    }
    getScoresByScoreType(scoretype) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.app.db;
            const allowedTypes = ['Attendance', 'Quiz', 'Project', 'Exam'];
            if (!allowedTypes.includes(scoretype)) {
                throw new Error('Invalid scoretype.');
            }
            const grades = db
                .prepare(`SELECT gradeid, perfectscore, attendanceDate FROM gradelists WHERE scoretype = ? ORDER BY gradeid ASC`)
                .all(scoretype);
            const gradeIds = grades.map((g) => g.gradeid);
            const students = db
                .prepare(`SELECT studentgradeid, studentName FROM studentlists ORDER BY studentName ASC`)
                .all();
            const getScores = db.prepare(`SELECT scoreid, gradeid, score, attendanceStatus FROM scorelists WHERE studentgradeid = ?`);
            const result = students.map((student) => {
                const scores = getScores.all(student.studentgradeid);
                const scoreMap = {};
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
        });
    }
    getAttendance(scoretype) {
        return __awaiter(this, void 0, void 0, function* () {
            const db = this.app.db;
            const allowedTypes = ['Attendance'];
            if (!allowedTypes.includes(scoretype)) {
                throw new Error('Invalid scoretype.');
            }
            const grades = db
                .prepare(`SELECT gradeid, perfectscore, attendanceDate FROM gradelists WHERE scoretype = ? ORDER BY gradeid ASC`)
                .all(scoretype);
            const gradeIds = grades.map((g) => g.gradeid);
            const students = db
                .prepare(`SELECT studentgradeid, studentName FROM studentlists ORDER BY studentName ASC`)
                .all();
            const getScores = db.prepare(`SELECT scoreid, gradeid, score, attendanceStatus FROM scorelists WHERE studentgradeid = ?`);
            const result = students.map((student) => {
                const scores = getScores.all(student.studentgradeid);
                const scoreMap = {};
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
        });
    }
}
exports.GradeService = GradeService;
