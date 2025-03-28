import { WebSocket, WebSocketServer } from 'ws';
import { ICharacter, Character } from './models/Character';
import dotenv from "dotenv";
// import { getNearbyCharacters } from './services/characterService';
import { connectDB } from './config/database';

dotenv.config();
connectDB();

const PORT = Number(process.env.PORT);
const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 WebSocket rodando na porta ${PORT}`);

const broadcastInformation = async (currentCharacter: ICharacter) => {
  console.log('currentCharacter.position', currentCharacter.position);
  const nearbyCharacters = await Character.find({
    ws: { $ne: null }
  });
  // const nearbyCharacters = await getNearbyCharacters(currentCharacter, 500);
  // console.log('nearbyCharacters', nearbyCharacters.length);
  
  const dataToSendString = JSON.stringify({
    type: 'AllPlayerData',
    data: nearbyCharacters
  });

  // nearbyCharacters.forEach(player => {
  //   if (player.ws.readyState === WebSocket.OPEN) {
  //     player.ws.send(dataToSendString);
  //   }
  // });

  wss.clients.forEach((client) => { 
    if (client.readyState === WebSocket.OPEN) {
      client.send(dataToSendString);
    }
  });
};

wss.on('connection', (ws) => {
  console.log("🔗 Cliente conectado!");
  ws.on('message', async (message) => {
    try {
      const ParsedData = JSON.parse(message.toString());
      if (ParsedData.type === 'PlayerData') {
        const { 
          PlayerID, 
          position, 
          velocity, 
          rotation, 
          health,
          animationState 
        } = ParsedData.data;

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
        
        await broadcastInformation(player);
      } else if (ParsedData.type === 'PlayerDisconnected') {
        const { PlayerID } = ParsedData;
        const player = await Character.findOneAndUpdate(
          { playerId: PlayerID }, 
          { playerId: '', ws: null}
        );
        await broadcastInformation(player);
      }
    } catch (error) {
      console.error("❌ Erro ao processar mensagem:", error);
      ws.send(JSON.stringify({
        type: "DisconnectPlayer", 
        status: "error", 
        message: error.message 
      }));
    }
  });

  ws.on("close", () => console.log("❌ Cliente desconectado"));
});