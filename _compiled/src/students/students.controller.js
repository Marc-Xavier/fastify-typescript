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
exports.studentRoutes = studentRoutes;
const student_service_1 = require("./student.service");
function studentRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        const service = new student_service_1.StudentService(app);
        app.post('/students/addstudent', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const student = service.create(request.body);
                return reply.code(201).send(student);
            }
            catch (err) {
                return reply.code(400).send({ error: err.message });
            }
        }));
        app.get('/students', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const students = service.getAll();
                return reply.send(students);
            }
            catch (err) {
                return reply.code(500).send({ error: err.message });
            }
        }));
        app.delete('/students/:studentgradeid', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const studentId = parseInt(request.params.studentgradeid, 10);
                if (isNaN(studentId)) {
                    return reply.code(400).send({ message: 'Invalid student ID.' });
                }
                const result = service.deleteById(studentId);
                return reply.code(200).send(result);
            }
            catch (error) {
                return reply.code(404).send({ message: (_a = error.message) !== null && _a !== void 0 ? _a : 'Unknown error occurred.' });
            }
        }));
    });
}
