import { WebSocket, WebSocketServer } from 'ws';
import { ICharacter, Character } from './models/Character';
import dotenv from "dotenv";
import { getNearbyCharacters } from './services/characterService';
import { connectDB } from './config/database';

dotenv.config();
connectDB();

const PORT = Number(process.env.PORT);
const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });

// Map para gerenciar conexões WebSocket em memória
const playerConnections = new Map<string, WebSocket>();

console.log(`🚀 WebSocket rodando na porta ${PORT}`);

const broadcastInformation = async (currentCharacter: ICharacter) => {
  console.log('📍 currentCharacter.position', currentCharacter.position);
  
  // Buscar apenas jogadores próximos (dentro de 500 unidades)
  const nearbyCharacters = await getNearbyCharacters(currentCharacter, 500);
  console.log(`👥 [${currentCharacter.playerId}] Jogadores próximos: ${nearbyCharacters.length}`);
  
  // Log das conexões ativas
  console.log(`🔗 Conexões ativas no Map: ${playerConnections.size}`);
  for (const [playerId, ws] of playerConnections.entries()) {
    console.log(`   - ${playerId}: ${ws.readyState === WebSocket.OPEN ? 'OPEN' : 'CLOSED'}`);
  }
  
  const dataToSendString = JSON.stringify({
    type: 'NearbyPlayers',
    data: nearbyCharacters.map(char => ({
      playerId: char.playerId,
      position: char.position,
      velocity: char.velocity,
      rotation: char.rotation,
      health: char.health,
      animationState: char.animationState
    }))
  });

  // Enviar apenas para jogadores próximos usando o Map de conexões
  let sentCount = 0;
  nearbyCharacters.forEach(player => {
    const playerWs = playerConnections.get(player.playerId);
    if (playerWs && playerWs.readyState === WebSocket.OPEN) {
      console.log(`📨 [${player.playerId}] Enviando dados para ${player.playerId}`);
      playerWs.send(dataToSendString);
      sentCount++;
    } else {
      console.log(`⚠️ [${player.playerId}] Conexão não encontrada ou fechada`);
    }
  });
  
  console.log(`✅ [${currentCharacter.playerId}] Dados enviados para ${sentCount} jogadores`);
};

wss.on('connection', (ws) => {
  console.log("🔗 Cliente conectado!");
  ws.on('message', async (message) => {
    try {
      const ParsedData = JSON.parse(message.toString());
      console.log(`📨 Mensagem recebida do tipo: ${ParsedData.type}`);
      
      if (ParsedData.type === 'PlayerData') {
        const { 
          PlayerID, 
          position, 
          velocity, 
          rotation, 
          health,
          animationState 
        } = ParsedData.data;

        console.log(`🎮 [${PlayerID}] Dados recebidos:`);
        console.log(`   📍 Posição: (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
        console.log(`   🏃 Velocidade: (${velocity.x.toFixed(1)}, ${velocity.y.toFixed(1)}, ${velocity.z.toFixed(1)})`);
        console.log(`   🔄 Rotação: (${rotation.x.toFixed(1)}, ${rotation.y.toFixed(1)}, ${rotation.z.toFixed(1)})`);
        console.log(`   ❤️ Health: ${health}`);
        console.log(`   🎭 Animation State:`);
        console.log(`      - isSprinting: ${animationState.isSprinting}`);
        console.log(`      - isJumping: ${animationState.isJumping}`);
        console.log(`      - isMoving: ${animationState.isMoving}`);
        console.log(`      - currentAction: ${animationState.currentAction}`);

        // Adicionar/atualizar conexão no Map
        playerConnections.set(PlayerID, ws);

        const player = await Character.findOneAndUpdate(
          { playerId: PlayerID },
          { position, velocity, rotation, health, animationState },
          { new: true, upsert: true } // Cria se não existir, atualiza se existir
        );
        
        console.log(`✅ [${PlayerID}] Dados salvos no MongoDB`);
        await broadcastInformation(player);
        console.log(`📡 [${PlayerID}] Dados broadcastados para ${wss.clients.size} clientes`);
        
      } else if (ParsedData.type === 'PlayerDisconnected') {
        const { PlayerID } = ParsedData;
        console.log(`❌ [${PlayerID}] Jogador desconectado`);
        
        // Remover conexão do Map
        playerConnections.delete(PlayerID);
        
        const player = await Character.findOneAndUpdate(
          { playerId: PlayerID }, 
          { playerId: ''}
        );
        await broadcastInformation(player);
        console.log(`📡 [${PlayerID}] Desconexão broadcastada`);
      }
    } catch (error) {
      console.error("❌ Erro ao processar mensagem:", error);
      console.error("📄 Mensagem original:", message.toString());
      ws.send(JSON.stringify({
        type: "DisconnectPlayer", 
        status: "error", 
        message: error.message 
      }));
    }
  });

  ws.on("close", () => {
    console.log("❌ Cliente desconectado");
    // Remover conexão do Map quando o WebSocket for fechado
    for (const [playerId, connection] of playerConnections.entries()) {
      if (connection === ws) {
        playerConnections.delete(playerId);
        console.log(`🗑️ [${playerId}] Conexão removida do Map`);
        break;
      }
    }
  });
});

// 1. Exemplo de mensagem recebida
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

// 2. Exemplo de mensagem recebida de jogador proximo
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

// 3. Exemplo de mensagem recebida de jogador longe
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