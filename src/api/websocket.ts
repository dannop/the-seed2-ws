import { WebSocket, WebSocketServer } from 'ws';
import { ICharacter, Character } from '../models/Character';
import { getNearbyCharacters } from '../services/characterService';
import { Server } from 'http';

export class WebSocketManager {
  private wss: WebSocketServer;
  private playerConnections: Map<string, WebSocket>;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server });
    this.playerConnections = new Map<string, WebSocket>();
    
    console.log(`🚀 WebSocket configurado para usar o mesmo servidor HTTP`);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.wss.on('connection', (ws) => {
      console.log("🔗 Cliente conectado!");
      
      ws.on('message', async (message) => {
        await this.handleMessage(ws, message);
      });

      ws.on("close", () => {
        console.log("❌ Cliente desconectado");
        this.removeConnection(ws);
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: any) {
    try {
      const ParsedData = JSON.parse(message.toString());
      console.log(`📨 Mensagem recebida do tipo: ${ParsedData.type}`);
      
      if (ParsedData.type === 'PlayerData') {
        await this.handlePlayerData(ws, ParsedData);
      } else if (ParsedData.type === 'PlayerDisconnected') {
        await this.handlePlayerDisconnected(ParsedData);
      }
    } catch (error) {
      console.error("❌ Erro ao processar mensagem:", error);
      console.error("📄 Mensagem original:", message.toString());
      ws.send(JSON.stringify({
        type: "DisconnectPlayer", 
        status: "error", 
        message: (error as Error).message 
      }));
    }
  }

  private async handlePlayerData(ws: WebSocket, data: any) {
    const { 
      PlayerID, 
      position, 
      velocity, 
      rotation, 
      health,
      animationState 
    } = data.data;

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
    this.playerConnections.set(PlayerID, ws);

    const player = await Character.findOneAndUpdate(
      { playerId: PlayerID },
      { position, velocity, rotation, health, animationState },
      { new: true, upsert: true }
    );
    
    console.log(`✅ [${PlayerID}] Dados salvos no MongoDB`);
    await this.broadcastInformation(player);
    console.log(`📡 [${PlayerID}] Dados broadcastados para ${this.wss.clients.size} clientes`);
  }

  private async handlePlayerDisconnected(data: any) {
    const { PlayerID } = data;
    console.log(`❌ [${PlayerID}] Jogador desconectado`);
    
    // Remover conexão do Map
    this.playerConnections.delete(PlayerID);
    
    const player = await Character.findOneAndUpdate(
      { playerId: PlayerID }, 
      { playerId: ''}
    );
    if (player) {
      await this.broadcastInformation(player);
    }
    console.log(`📡 [${PlayerID}] Desconexão broadcastada`);
  }

  private removeConnection(ws: WebSocket) {
    for (const [playerId, connection] of this.playerConnections.entries()) {
      if (connection === ws) {
        this.playerConnections.delete(playerId);
        console.log(`🗑️ [${playerId}] Conexão removida do Map`);
        break;
      }
    }
  }

  private async broadcastInformation(currentCharacter: ICharacter) {
    console.log('📍 currentCharacter.position', currentCharacter.position);
    
    const maxDistance = 2000;
    const nearbyCharacters = await getNearbyCharacters(currentCharacter, maxDistance);
    console.log(`👥 [${currentCharacter.playerId}] Jogadores próximos: ${nearbyCharacters.length}`);
    
    // Log das conexões ativas
    console.log(`🔗 Conexões ativas no Map: ${this.playerConnections.size}`);
    for (const [playerId, ws] of this.playerConnections.entries()) {
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
      const playerWs = this.playerConnections.get(player.playerId);
      if (playerWs && playerWs.readyState === WebSocket.OPEN) {
        console.log(`📨 [${player.playerId}] Enviando dados para ${player.playerId}`);
        playerWs.send(dataToSendString);
        sentCount++;
      } else {
        console.log(`⚠️ [${player.playerId}] Conexão não encontrada ou fechada`);
      }
    });
    
    console.log(`✅ [${currentCharacter.playerId}] Dados enviados para ${sentCount} jogadores`);
  }

  public getConnectionCount(): number {
    return this.playerConnections.size;
  }

  public getServer(): WebSocketServer {
    return this.wss;
  }
} 