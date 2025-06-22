"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentService = void 0;
class StudentService {
    constructor(app) {
        this.app = app;
    }
    create(data) {
        const db = this.app.db;
        const name = data.studentName;
        if (typeof name !== 'string' || !name.trim()) {
            throw new Error('studentName must be a non-empty string.');
        }
        const trimmedName = name.trim();
        // Check for duplicates (case-insensitive)
        const existing = db
            .prepare(`SELECT * FROM studentlists WHERE LOWER(studentName) = LOWER(?)`)
            .get(trimmedName);
        if (existing) {
            throw new Error('A student with this name already exists.');
        }
        // Start transaction
        const insertTransaction = db.transaction(() => {
            // Insert student
            const result = db
                .prepare(`INSERT INTO studentlists (studentName) VALUES (?)`)
                .run(trimmedName);
            const studentgradeid = result.lastInsertRowid;
            // Fetch all grades
            const grades = db.prepare(`SELECT * FROM gradelists`).all();
            // Insert corresponding scores
            const insertScore = db.prepare(`
        INSERT INTO scorelists (studentgradeid, gradeid, attendanceStatus, score, active)
        VALUES (?, ?, ?, ?, ?)
      `);
            for (const grade of grades) {
                insertScore.run(studentgradeid, grade.gradeid, '', 0, 1);
            }
            // Insert computed grade record
            db.prepare(`
        INSERT INTO computedgradelists (studentgradeid)
        VALUES (?)
      `).run(studentgradeid);
            return {
                studentgradeid,
                studentName: trimmedName,
            };
        });
        return insertTransaction();
    }
    getAll() {
        const db = this.app.db;
        const records = db.prepare(`
      SELECT
        s.studentName,
        c.computedgradeid,
        c.studentgradeid,
        c.totalattendance,
        c.perfectattendancescore,
        c.attendance10percent,
        c.totalquiz,
        c.perfectquizscore,
        c.quiz15percent,
        c.totalproject,
        c.perfectprojectscore,
        c.project30percent,
        c.totalexam,
        c.perfectexamscore,
        c.exam45percent,
        c.finalcomputedgrade,
        c.transmutedgrade
      FROM computedgradelists c
      LEFT JOIN studentlists s ON s.studentgradeid = c.studentgradeid
      ORDER BY s.studentName ASC
    `).all();
        return records;
    }
    deleteById(studentgradeid) {
        const db = this.app.db;
        const result = db.transaction(() => {
            // Check if student exists
            const student = db
                .prepare(`SELECT * FROM studentlists WHERE studentgradeid = ?`)
                .get(studentgradeid);
            if (!student) {
                throw new Error("Student not found.");
            }
            // Delete scores
            const scoresDeleted = db
                .prepare(`DELETE FROM scorelists WHERE studentgradeid = ?`)
                .run(studentgradeid).changes;
            // Delete computed grade
            const computedGradesDeleted = db
                .prepare(`DELETE FROM computedgradelists WHERE studentgradeid = ?`)
                .run(studentgradeid).changes;
            // Delete student
            db.prepare(`DELETE FROM studentlists WHERE studentgradeid = ?`)
                .run(studentgradeid);
            return {
                message: "Student and associated scores and computed grades deleted successfully.",
                scoresDeleted,
                computedGradesDeleted,
            };
        })();
        return result;
    }
}
exports.StudentService = StudentService;
