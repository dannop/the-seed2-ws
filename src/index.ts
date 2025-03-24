import { WebSocket, WebSocketServer } from 'ws';
import { IPlayer, Player } from './models/Player';
import dotenv from "dotenv";
// import { getNearbyPlayers } from './services/playerService';
import { connectDB } from './config/database';

dotenv.config();
connectDB();

const PORT = Number(process.env.PORT);
const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 WebSocket rodando na porta ${PORT}`);

const broadcastInformation = async (currentPlayer: IPlayer) => {
  console.log('currentPlayer.position', currentPlayer.position);
  const nearbyPlayers = await Player.find({
    ws: { $ne: null }
  });
  //const nearbyPlayers = await getNearbyPlayers(currentPlayer, 500);
  // console.log('nearbyPlayers', nearbyPlayers.length);
  
  const dataToSendString = JSON.stringify({
    type: 'AllPlayerData',
    data: nearbyPlayers
  });

  // nearbyPlayers.forEach(player => {
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

        let player = await Player.findOne({ playerId: PlayerID });
        if (player.ws) {
          player.ws.send(JSON.stringify({
            type: "DisconnectPlayer", 
            status: "error", 
            message: "Iniciada outra sessão" 
          }));
        }

        player = await Player.findOneAndUpdate(
          { playerId: PlayerID },
          { ws, position, velocity, rotation, health, animationState },
          { new: true, upsert: true } // Cria se não existir, atualiza se existir
        );
        
        await broadcastInformation(player);
      } else if (ParsedData.type === 'PlayerDisconnected') {
        const { PlayerID } = ParsedData;
        const player = await Player.findOneAndUpdate(
          { playerId: PlayerID }, 
          { ws: null }
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