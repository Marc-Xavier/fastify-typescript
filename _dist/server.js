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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./src/app/app");
const cors_1 = __importDefault(require("@fastify/cors"));
function start() {
    return __awaiter(this, void 0, void 0, function* () {
        const app = yield (0, app_1.buildApp)();
        yield app.register(cors_1.default, {
            origin: ['http://localhost:3000', 'https://grading-demo-app.netlify.app'],
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        });
        const port = Number(process.env.PORT) || 4000;
        yield app.listen({ port, host: '0.0.0.0' }); // 👈 Required for Render
        console.log(`🚀 Server listening on http://localhost:4000`);
    });
}
start();
