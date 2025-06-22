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
exports.GradeRoutes = GradeRoutes;
const grade_service_1 = require("./grade.service");
function GradeRoutes(app) {
    return __awaiter(this, void 0, void 0, function* () {
        const Grade = new grade_service_1.GradeService(app);
        app.get('/grades/status', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const statuses = yield Grade.getAllAttendanceStatuses();
                reply.send({ data: statuses });
            }
            catch (error) {
                reply.code(500).send({ message: error.message });
            }
        }));
        app.post('/grades/addgrade', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield Grade.create(request.body);
                reply.code(201).send(result);
            }
            catch (error) {
                reply.code(400).send({ message: error.message });
            }
        }));
        app.delete('/grades/:gradeid', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const gradeid = parseInt(request.params.gradeid, 10);
                if (isNaN(gradeid)) {
                    return reply.code(400).send({ message: 'Invalid grade ID.' });
                }
                const result = yield Grade.deleteGradeById(gradeid);
                reply.send(result);
            }
            catch (error) {
                reply.code(404).send({ message: error.message });
            }
        }));
        app.put('/grades/updateperfectscore/:id', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const gradeid = parseInt(request.params.id, 10);
                const { perfectscore } = request.body;
                if (isNaN(gradeid)) {
                    return reply.code(400).send({ message: 'Invalid grade ID.' });
                }
                const result = yield Grade.updatePerfectScore(gradeid, perfectscore);
                reply.send(result);
            }
            catch (error) {
                reply.code(400).send({ message: error.message });
            }
        }));
        app.post('/grades/addattendance', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield Grade.createAttendance(request.body);
                reply.code(201).send(result);
            }
            catch (error) {
                reply.code(400).send({ message: error.message });
            }
        }));
        app.put('/grades/updatescore/:id', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const scoreid = parseInt(request.params.id);
                const { score } = request.body;
                if (isNaN(scoreid)) {
                    return reply.code(400).send({ message: 'Invalid score ID.' });
                }
                const result = yield Grade.updateScore(scoreid, score);
                reply.send(result);
            }
            catch (error) {
                reply.code(400).send({ message: error.message });
            }
        }));
        app.get('/grades/getattendance/:scoretype', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const scoretype = request.params.scoretype;
                const data = yield Grade.getAttendance(scoretype);
                reply.send({ message: `Scores for scoretype: ${scoretype}`, data });
            }
            catch (error) {
                reply.code(400).send({ message: error.message || 'Failed to get scores' });
            }
        }));
        app.get('/grades/:scoretype', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const scoretype = request.params.scoretype;
                const data = yield Grade.getScoresByScoreType(scoretype);
                reply.send({ message: `Scores for scoretype: ${scoretype}`, data });
            }
            catch (error) {
                reply.code(400).send({ message: error.message || 'Failed to get scores' });
            }
        }));
        app.put('/grades/attendance/:id', (request, reply) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const { attendanceStatus } = request.body;
                const scoreid = parseInt(id, 10);
                if (isNaN(scoreid)) {
                    return reply.code(400).send({ message: 'Invalid score ID.' });
                }
                const result = yield Grade.updateAttendance(scoreid, attendanceStatus);
                reply.send(result);
            }
            catch (error) {
                reply.code(400).send({ message: error.message });
            }
        }));
    });
}
