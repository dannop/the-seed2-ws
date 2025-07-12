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

      ws.on("close", async () => {
        console.log("❌ Cliente desconectado");
        await this.removeConnection(ws);
      });
    });
  }

  private async handleMessage(ws: WebSocket, message: any) {
    try {
      const ParsedData = JSON.parse(message.toString());
      console.log(`📨 Mensagem recebida do tipo: ${ParsedData.type}`);
      
      if (ParsedData.type === 'PlayerData') {
        await this.handlePlayerData(ws, ParsedData);
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
      { position, velocity, rotation, health, animationState, isOnline: true },
      { new: true, upsert: true }
    );
    
    console.log(`✅ [${PlayerID}] Dados salvos no MongoDB (isOnline: true)`);
    await this.broadcastInformation(player);
    console.log(`📡 [${PlayerID}] Dados broadcastados para ${this.wss.clients.size} clientes`);
  }

  private async removeConnection(ws: WebSocket) {
    for (const [playerId, connection] of this.playerConnections.entries()) {
      if (connection === ws) {
        this.playerConnections.delete(playerId);
        console.log(`🗑️ [${playerId}] Conexão removida do Map`);
        
        // Marcar jogador como offline no banco de dados
        await Character.findOneAndUpdate(
          { playerId: playerId },
          { isOnline: false }
        );
        console.log(`📴 [${playerId}] Jogador marcado como offline no banco de dados`);
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

    // Enviar dados dos jogadores próximos para o jogador atual
    const currentPlayerWs = this.playerConnections.get(currentCharacter.playerId);
    if (currentPlayerWs && currentPlayerWs.readyState === WebSocket.OPEN) {
      console.log(`📨 [${currentCharacter.playerId}] Enviando dados dos jogadores próximos para ${currentCharacter.playerId}`);
      currentPlayerWs.send(dataToSendString);
      console.log(`✅ [${currentCharacter.playerId}] Dados enviados para o jogador atual`);
    } else {
      console.log(`⚠️ [${currentCharacter.playerId}] Conexão do jogador atual não encontrada ou fechada`);
    }
  }

  public getConnectionCount(): number {
    return this.playerConnections.size;
  }

  public getServer(): WebSocketServer {
    return this.wss;
  }
} 