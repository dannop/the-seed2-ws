import express, { Request, Response } from 'express';
import cors from 'cors';
import { Character } from '../models/Character';
import { getNearbyCharacters } from '../services/characterService';

export class RestAPIManager {
  private app: express.Application;
  private websocketManager?: any;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  public setWebSocketManager(websocketManager: any) {
    this.websocketManager = websocketManager;
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes() {
    // Endpoint de status
    this.app.get('/api/status', (req: Request, res: Response) => {
      res.json({
        success: true,
        status: 'online',
        websocketConnections: this.websocketManager?.getConnectionCount() || 0,
        timestamp: new Date().toISOString()
      });
    });

    // Listar todos os personagens
    this.app.get('/api/characters', async (req: Request, res: Response) => {
      try {
        console.log('📋 Requisição para listar todos os personagens');
        const characters = await Character.find({ playerId: { $ne: '' } });
        
        const charactersList = characters.map(char => ({
          playerId: char.playerId,
          position: char.position,
          velocity: char.velocity,
          rotation: char.rotation,
          health: char.health,
          animationState: char.animationState
        }));
        
        console.log(`✅ ${charactersList.length} personagens encontrados`);
        res.json({
          success: true,
          count: charactersList.length,
          characters: charactersList
        });
      } catch (error) {
        console.error('❌ Erro ao buscar personagens:', error);
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // Buscar personagem específico
    this.app.get('/api/characters/:playerId', async (req: any, res: any) => {
      try {
        const { playerId } = req.params;
        console.log(`🔍 Buscando personagem: ${playerId}`);
        
        const character = await Character.findOne({ playerId });
        
        if (!character) {
          console.log(`❌ Personagem ${playerId} não encontrado`);
          return res.status(404).json({
            success: false,
            error: 'Personagem não encontrado'
          });
        }
        
        const characterData = {
          playerId: character.playerId,
          position: character.position,
          velocity: character.velocity,
          rotation: character.rotation,
          health: character.health,
          animationState: character.animationState
        };
        
        console.log(`✅ Personagem ${playerId} encontrado`);
        res.json({
          success: true,
          character: characterData
        });
      } catch (error) {
        console.error('❌ Erro ao buscar personagem:', error);
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });

    // Buscar personagens próximos
    this.app.get('/api/characters/nearby/:playerId', async (req: any, res: any) => {
      try {
        const { playerId } = req.params;
        const distance = Number(req.query.distance) || 500;
        
        console.log(`🔍 Buscando personagens próximos a ${playerId} (distância: ${distance})`);
        
        const character = await Character.findOne({ playerId });
        
        if (!character) {
          console.log(`❌ Personagem ${playerId} não encontrado`);
          return res.status(404).json({
            success: false,
            error: 'Personagem não encontrado'
          });
        }
        
        const nearbyCharacters = await getNearbyCharacters(character, distance);
        
        const nearbyList = nearbyCharacters.map(char => ({
          playerId: char.playerId,
          position: char.position,
          velocity: char.velocity,
          rotation: char.rotation,
          health: char.health,
          animationState: char.animationState
        }));
        
        console.log(`✅ ${nearbyList.length} personagens próximos encontrados`);
        res.json({
          success: true,
          count: nearbyList.length,
          distance: distance,
          characters: nearbyList
        });
      } catch (error) {
        console.error('❌ Erro ao buscar personagens próximos:', error);
        res.status(500).json({
          success: false,
          error: 'Erro interno do servidor'
        });
      }
    });
  }

  public getApp(): express.Application {
    return this.app;
  }
} 