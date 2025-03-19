import { WebSocket, WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

const PlayersData: any = {};

const BroadcastInformation = () => {
  const DataToBeUpdated = {
    type: 'AllPlayerData',
    data: Object.entries(PlayersData).map(([id, data]) => ({
      id,
      ...(typeof data === 'object' && data !== null ? data : {})
    }))
  };
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
    console.log('ParsedData', ParsedData);
    if (ParsedData.type === 'PlayerData') {
      const { PlayerID, position, velocity, rotation, health } = ParsedData.data;
      PlayersData[PlayerID] = { position, velocity, rotation, health };
      BroadcastInformation();
    }
  });
});