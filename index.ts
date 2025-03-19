import { WebSocket, WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

const PlayersData: any = {};

const BroadcastInformation = () => {
  const DataToBeUpdated = {
    type: 'AllPlayerData',
    data: Object.entries(PlayersData).map(([id, data]) => ({
      PlayerID: id,
      ...(typeof data === 'object' && data !== null ? data : {})
    }))
  };
  console.log(DataToBeUpdated);
  const DataToSendString = JSON.stringify(DataToBeUpdated);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(DataToSendString);
    }
  });
};

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    const ParsedData = JSON.parse(message.toString());
    
    if (ParsedData.type === 'PlayerData') {
      const { PlayerID, position, velocity, rotation, health } = ParsedData.data;
      PlayersData[PlayerID] = { position, velocity, rotation, health };
      BroadcastInformation();
    } else if (ParsedData.type === 'PlayerDisconnected') {
      const { PlayerID } = ParsedData;
      delete PlayersData[PlayerID];
      BroadcastInformation();
    }
  });
});