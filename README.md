# TheEmptySeed Server

Servidor para o jogo TheEmptySeed com suporte a WebSocket para comunicação em tempo real e API REST para consultas.

## 🚀 Funcionalidades

- **WebSocket**: Comunicação em tempo real entre jogadores
- **API REST**: Consultas e gerenciamento de dados dos personagens
- **MongoDB**: Armazenamento persistente dos dados
- **Sistema de Proximidade**: Filtragem de jogadores por distância
- **Arquitetura Modular**: Separação clara entre WebSocket e API REST

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- MongoDB rodando localmente ou em nuvem
- TypeScript

## 🛠️ Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente criando um arquivo `.env`:
```env
PORT=3000
API_PORT=3001
MONGODB_URI=mongodb://localhost:27017/theemptyseed
```

4. Inicie o servidor:
```bash
npm start
```

## 🌐 Endpoints da API REST

### Status do Servidor
- **GET** `/api/status` - Verificar status do servidor (inclui conexões WebSocket)

### Gerenciamento de Personagens
- **GET** `/api/characters` - Listar todos os personagens
- **GET** `/api/characters/:playerId` - Buscar personagem específico
- **GET** `/api/characters/nearby/:playerId` - Buscar personagens próximos

### Exemplos de Uso

```bash
# Verificar status
curl http://localhost:3001/api/status

# Listar personagens
curl http://localhost:3001/api/characters

# Buscar personagem específico
curl http://localhost:3001/api/characters/Postman_123

# Buscar personagens próximos
curl http://localhost:3001/api/characters/nearby/Postman_123?distance=300
```

## 🔌 WebSocket

### Conexão
```javascript
const ws = new WebSocket('ws://localhost:3000');
```

### Enviar Dados do Jogador
```javascript
ws.send(JSON.stringify({
  type: 'PlayerData',
  data: {
    PlayerID: 'MeuJogador',
    position: { x: 10, y: 20, z: 30 },
    velocity: { x: 0.5, y: 0.5, z: 0.5 },
    rotation: { x: 0, y: 0, z: 0 },
    health: 100,
    animationState: {
      isSprinting: false,
      isJumping: false,
      isMoving: false,
      currentAction: 'idle'
    }
  }
}));
```

### Receber Dados de Jogadores Próximos
```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'NearbyPlayers') {
    console.log('Jogadores próximos:', data.data);
  }
};
```

## 🧪 Testes

### Teste da API REST
Abra o arquivo `test-api.html` no navegador para testar os endpoints da API.

### Teste do WebSocket
Use o arquivo `test-websocket.html` para testar a comunicação WebSocket.

## 📁 Estrutura do Projeto

```
src/
├── index.ts              # Ponto de entrada principal
├── api/
│   ├── websocket.ts      # Gerenciador do WebSocket
│   └── rest.ts           # Gerenciador da API REST
├── models/
│   └── Character.ts      # Modelo do MongoDB
├── services/
│   └── characterService.ts # Serviços de personagem
└── config/
    └── database.ts       # Configuração do MongoDB
```

### Arquitetura Modular

O projeto foi estruturado de forma modular para melhor organização:

- **`WebSocketManager`**: Gerencia todas as conexões WebSocket e comunicação em tempo real
- **`RestAPIManager`**: Gerencia todos os endpoints da API REST
- **`index.ts`**: Orquestra a inicialização dos managers e configuração geral

## 🔧 Configuração

### Variáveis de Ambiente

- `PORT`: Porta do WebSocket (padrão: 3000)
- `API_PORT`: Porta da API REST (padrão: 3001)
- `MONGODB_URI`: URI de conexão com o MongoDB

### Docker

Para executar com Docker:

```bash
docker build -t theseed2-server .
docker run -p 3000:3000 -p 3001:3001 theseed2-server
```

## 📊 Monitoramento

O servidor fornece logs detalhados para monitoramento:

- 🔗 Conexões WebSocket
- 📨 Mensagens recebidas/enviadas
- 👥 Jogadores próximos
- ✅ Operações de banco de dados
- ❌ Erros e exceções

### Status Integrado

O endpoint `/api/status` retorna informações sobre:
- Status do servidor
- Número de conexões WebSocket ativas
- Timestamp da requisição

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ISC. 