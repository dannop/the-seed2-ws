# API REST - TheEmptySeed Server

Esta documentação descreve os endpoints da API REST implementados no servidor TheEmptySeed.

## Configuração

A API REST roda na porta `3001` por padrão (configurável via variável de ambiente `API_PORT`).

## Endpoints Disponíveis

### 1. Listar Todos os Personagens

**GET** `/api/characters`

Retorna a lista de todos os personagens salvos no MongoDB.

**Resposta de Sucesso:**
```json
{
  "success": true,
  "count": 2,
  "characters": [
    {
      "playerId": "Postman_123",
      "position": { "x": 10, "y": 20, "z": 30 },
      "velocity": { "x": 0.5, "y": 0.5, "z": 0.5 },
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "health": 100,
      "animationState": {
        "isSprinting": false,
        "isJumping": false,
        "isMoving": false,
        "currentAction": "idle"
      }
    }
  ]
}
```

### 2. Buscar Personagem Específico

**GET** `/api/characters/:playerId`

Retorna os dados de um personagem específico pelo ID.

**Parâmetros:**
- `playerId` (string): ID do personagem

**Resposta de Sucesso:**
```json
{
  "success": true,
  "character": {
    "playerId": "Postman_123",
    "position": { "x": 10, "y": 20, "z": 30 },
    "velocity": { "x": 0.5, "y": 0.5, "z": 0.5 },
    "rotation": { "x": 0, "y": 0, "z": 0 },
    "health": 100,
    "animationState": {
      "isSprinting": false,
      "isJumping": false,
      "isMoving": false,
      "currentAction": "idle"
    }
  }
}
```

**Resposta de Erro (404):**
```json
{
  "success": false,
  "error": "Personagem não encontrado"
}
```

### 3. Buscar Personagens Próximos

**GET** `/api/characters/nearby/:playerId?distance=500`

Retorna os personagens próximos a um personagem específico.

**Parâmetros:**
- `playerId` (string): ID do personagem de referência
- `distance` (number, opcional): Distância máxima em unidades (padrão: 500)

**Resposta de Sucesso:**
```json
{
  "success": true,
  "count": 1,
  "distance": 500,
  "characters": [
    {
      "playerId": "Postman_456",
      "position": { "x": 11, "y": 20, "z": 30 },
      "velocity": { "x": 0.5, "y": 0.5, "z": 0.5 },
      "rotation": { "x": 0, "y": 0, "z": 0 },
      "health": 100,
      "animationState": {
        "isSprinting": false,
        "isJumping": false,
        "isMoving": false,
        "currentAction": "idle"
      }
    }
  ]
}
```

### 4. Status do Servidor

**GET** `/api/status`

Retorna o status atual do servidor.

**Resposta:**
```json
{
  "success": true,
  "status": "online",
  "websocketConnections": 2,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Códigos de Status HTTP

- `200`: Sucesso
- `404`: Personagem não encontrado
- `500`: Erro interno do servidor

## Exemplos de Uso

### Usando cURL

```bash
# Listar todos os personagens
curl http://localhost:3001/api/characters

# Buscar personagem específico
curl http://localhost:3001/api/characters/Postman_123

# Buscar personagens próximos
curl http://localhost:3001/api/characters/nearby/Postman_123?distance=300

# Verificar status do servidor
curl http://localhost:3001/api/status
```

### Usando JavaScript/Fetch

```javascript
// Listar todos os personagens
const response = await fetch('http://localhost:3001/api/characters');
const data = await response.json();
console.log(data.characters);

// Buscar personagem específico
const characterResponse = await fetch('http://localhost:3001/api/characters/Postman_123');
const characterData = await characterResponse.json();
console.log(characterData.character);

// Buscar personagens próximos
const nearbyResponse = await fetch('http://localhost:3001/api/characters/nearby/Postman_123?distance=300');
const nearbyData = await nearbyResponse.json();
console.log(nearbyData.characters);
```

## Integração com WebSocket

A API REST funciona em conjunto com o WebSocket existente:

- **WebSocket (Porta 3000)**: Para comunicação em tempo real entre jogadores
- **API REST (Porta 3001)**: Para consultas pontuais e gerenciamento de dados

Ambos os serviços compartilham a mesma base de dados MongoDB, garantindo consistência dos dados.

## Variáveis de Ambiente

- `PORT`: Porta do WebSocket (padrão: 3000)
- `API_PORT`: Porta da API REST (padrão: 3001)
- `MONGODB_URI`: URI de conexão com o MongoDB 