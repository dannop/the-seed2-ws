import { WebSocket, WebSocketServer } from 'ws';
import { ICharacter, Character } from './models/Character';
import dotenv from "dotenv";
import { getNearbyCharacters } from './services/characterService';
import { connectDB } from './config/database';

dotenv.config();
connectDB();

const PORT = Number(process.env.PORT);
const wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });

console.log(`🚀 WebSocket rodando na porta ${PORT}`);

const broadcastInformation = async (currentCharacter: ICharacter) => {
  console.log('📍 currentCharacter.position', currentCharacter.position);
  
  // Buscar apenas jogadores próximos (dentro de 500 unidades)
  const nearbyCharacters = await getNearbyCharacters(currentCharacter, 500);
  console.log(`👥 [${currentCharacter.playerId}] Jogadores próximos: ${nearbyCharacters.length}`);
  
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

  // Enviar apenas para jogadores próximos
  nearbyCharacters.forEach(player => {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(dataToSendString);
    }
  });
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

        // let player = await Character.findOne({ playerId: PlayerID });
        // if (player.ws) {
        //   player.ws.send(JSON.stringify({
        //     type: "DisconnectPlayer", 
        //     status: "error", 
        //     message: "Iniciada outra sessão" 
        //   }));
        // }

        const player = await Character.findOneAndUpdate(
          { playerId: PlayerID },
          { ws, position, velocity, rotation, health, animationState },
          { new: true, upsert: true } // Cria se não existir, atualiza se existir
        );
        
        console.log(`✅ [${PlayerID}] Dados salvos no MongoDB`);
        await broadcastInformation(player);
        console.log(`📡 [${PlayerID}] Dados broadcastados para ${wss.clients.size} clientes`);
        
      } else if (ParsedData.type === 'PlayerDisconnected') {
        const { PlayerID } = ParsedData;
        console.log(`❌ [${PlayerID}] Jogador desconectado`);
        
        const player = await Character.findOneAndUpdate(
          { playerId: PlayerID }, 
          { playerId: '', ws: null}
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

  ws.on("close", () => console.log("❌ Cliente desconectado"));
});