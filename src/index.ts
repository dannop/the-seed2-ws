import dotenv from "dotenv";
import { connectDB } from './config/database';
import { WebSocketManager } from './api/websocket';
import { RestAPIManager } from './api/rest';
import { createServer } from 'http';

// Configuração das variáveis de ambiente
dotenv.config();

// Conectar ao MongoDB
connectDB();

// Configuração da porta única
const PORT = Number(process.env.PORT) || 3000;

console.log('🎮 Iniciando servidor TheEmptySeed...');

// Criar servidor HTTP
const server = createServer();

// Inicializar REST API Manager primeiro
const restAPIManager = new RestAPIManager();
const app = restAPIManager.getApp();

// Montar a aplicação Express no servidor HTTP
server.on('request', app);

// Inicializar WebSocket Manager no mesmo servidor
const websocketManager = new WebSocketManager(server);

// Conectar o WebSocket Manager ao REST API Manager
restAPIManager.setWebSocketManager(websocketManager);

// Iniciar o servidor na porta única
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor iniciado na porta ${PORT}`);
});

// Exemplo de mensagem recebida
// {
//   "type": "PlayerData",
//   "data": {
//     "PlayerID": "Postman_123",
//     "position": { "x": 10, "y": 20, "z": 30 },
//     "velocity": { "x": 0.5, "y": 0.5, "z": 0.5 },
//     "rotation": { "x": 0, "y": 0, "z": 0 },
//     "health": 100,
//     "animationState": { "isSprinting": false, "isJumping": false, "isMoving": false, "currentAction": "idle" }
//   }
// }

// Exemplo de mensagem recebida de jogador proximo
// {
//   "type": "PlayerData",
//   "data": {
//     "PlayerID": "Postman_456",
//     "position": { "x": 11, "y": 20, "z": 30 },
//     "velocity": { "x": 0.5, "y": 0.5, "z": 0.5 },
//     "rotation": { "x": 0, "y": 0, "z": 0 },
//     "health": 100,
//     "animationState": { "isSprinting": false, "isJumping": false, "isMoving": false, "currentAction": "idle" }
//   }
// }

// Exemplo de mensagem recebida de jogador longe
// {
//   "type": "PlayerData",
//   "data": {
//     "PlayerID": "Postman_789",
//     "position": { "x": 100, "y": 200, "z": 300 },
//     "velocity": { "x": 0.5, "y": 0.5, "z": 0.5 },
//     "rotation": { "x": 0, "y": 0, "z": 0 },
//     "health": 100,
//     "animationState": { "isSprinting": false, "isJumping": false, "isMoving": false, "currentAction": "idle" }
//   }
// }