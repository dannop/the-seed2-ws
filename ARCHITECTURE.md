# Arquitetura do TheEmptySeed Server

Este documento descreve a arquitetura modular implementada no servidor TheEmptySeed.

## 🏗️ Visão Geral da Arquitetura

O servidor foi estruturado seguindo princípios de **Separação de Responsabilidades** e **Modularidade**, dividindo as funcionalidades em componentes bem definidos e independentes.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   index.ts      │    │  WebSocket      │    │   REST API      │
│   (Orquestrador)│◄──►│   Manager       │    │   Manager       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Database      │    │   Character     │    │   Character     │
│   Connection    │    │   Service       │    │   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Estrutura de Arquivos

### Ponto de Entrada
- **`src/index.ts`**: Arquivo principal que orquestra a inicialização

### Camada de API
- **`src/api/websocket.ts`**: Gerenciador do WebSocket
- **`src/api/rest.ts`**: Gerenciador da API REST

### Camada de Dados
- **`src/models/Character.ts`**: Modelo do MongoDB
- **`src/services/characterService.ts`**: Lógica de negócio
- **`src/config/database.ts`**: Configuração do banco

## 🔧 Componentes Principais

### 1. WebSocketManager (`src/api/websocket.ts`)

**Responsabilidades:**
- Gerenciar conexões WebSocket
- Processar mensagens em tempo real
- Broadcast de dados para jogadores próximos
- Manutenção do estado das conexões

**Principais Métodos:**
```typescript
class WebSocketManager {
  constructor(port: number)           // Inicializa o servidor WebSocket
  private handleMessage()             // Processa mensagens recebidas
  private handlePlayerData()          // Atualiza dados do jogador
  private broadcastInformation()      // Envia dados para jogadores próximos
  public getConnectionCount()         // Retorna número de conexões
}
```

### 2. RestAPIManager (`src/api/rest.ts`)

**Responsabilidades:**
- Gerenciar endpoints da API REST
- Processar requisições HTTP
- Retornar dados dos personagens
- Integração com WebSocket para status

**Principais Métodos:**
```typescript
class RestAPIManager {
  constructor()                       // Inicializa o Express
  public setWebSocketManager()        // Conecta com WebSocket
  private setupRoutes()               // Define endpoints
  public start(port: number)          // Inicia o servidor HTTP
}
```

### 3. Orquestrador (`src/index.ts`)

**Responsabilidades:**
- Configuração de variáveis de ambiente
- Inicialização dos managers
- Conexão com banco de dados
- Logs de inicialização

## 🔄 Fluxo de Dados

### WebSocket (Tempo Real)
```
Cliente → WebSocketManager → Character Service → MongoDB
                ↓
        Broadcast para jogadores próximos
```

### API REST (Consultas)
```
Cliente → RestAPIManager → Character Service → MongoDB
                ↓
        Resposta JSON
```

## 🎯 Benefícios da Arquitetura Modular

### 1. **Separação de Responsabilidades**
- Cada manager tem uma responsabilidade específica
- Fácil manutenção e debugging
- Código mais limpo e organizado

### 2. **Escalabilidade**
- Possibilidade de escalar WebSocket e API independentemente
- Fácil adição de novos endpoints ou funcionalidades
- Estrutura preparada para microserviços

### 3. **Testabilidade**
- Cada componente pode ser testado isoladamente
- Mocks mais simples de implementar
- Cobertura de testes mais eficiente

### 4. **Reutilização**
- Managers podem ser reutilizados em outros projetos
- Lógica de negócio centralizada nos services
- Configurações compartilhadas

## 🔌 Integração entre Componentes

### Comunicação WebSocket ↔ API REST

```typescript
// No index.ts
const websocketManager = new WebSocketManager(PORT);
const restAPIManager = new RestAPIManager();

// Conecta os managers para compartilhar informações
restAPIManager.setWebSocketManager(websocketManager);
```

### Compartilhamento de Dados
- Ambos os managers usam o mesmo modelo `Character`
- Serviços compartilhados (`characterService`)
- Conexão única com MongoDB

## 🚀 Padrões Utilizados

### 1. **Manager Pattern**
- Cada funcionalidade principal tem seu próprio manager
- Encapsulamento da lógica específica
- Interface clara para interação

### 2. **Dependency Injection**
- WebSocketManager injetado no RestAPIManager
- Facilita testes e manutenção
- Baixo acoplamento entre componentes

### 3. **Service Layer**
- Lógica de negócio centralizada
- Reutilização entre diferentes managers
- Separação entre dados e lógica

## 🔮 Possíveis Melhorias Futuras

### 1. **Event-Driven Architecture**
```typescript
// Implementar sistema de eventos
eventEmitter.emit('playerUpdated', playerData);
eventEmitter.on('playerUpdated', handlePlayerUpdate);
```

### 2. **Plugin System**
```typescript
// Permitir plugins para extensibilidade
class PluginManager {
  registerPlugin(plugin: BasePlugin) { ... }
}
```

### 3. **Configuration Management**
```typescript
// Centralizar configurações
class ConfigManager {
  getWebSocketConfig() { ... }
  getAPIConfig() { ... }
}
```

### 4. **Health Checks**
```typescript
// Sistema de monitoramento
class HealthManager {
  checkWebSocketHealth() { ... }
  checkAPIHealth() { ... }
  checkDatabaseHealth() { ... }
}
```

## 📊 Métricas e Monitoramento

A arquitetura atual suporta:
- Contagem de conexões WebSocket ativas
- Status de cada componente
- Logs estruturados por manager
- Métricas de performance por endpoint

## 🛠️ Desenvolvimento

### Adicionando Novos Endpoints
1. Adicione o método no `RestAPIManager`
2. Implemente a lógica no service apropriado
3. Teste isoladamente
4. Integre com o sistema

### Adicionando Novos Tipos de Mensagem WebSocket
1. Adicione o handler no `WebSocketManager`
2. Implemente a lógica de processamento
3. Atualize a documentação
4. Teste com clientes reais

Esta arquitetura modular fornece uma base sólida e escalável para o servidor TheEmptySeed, permitindo crescimento e manutenção eficientes. 