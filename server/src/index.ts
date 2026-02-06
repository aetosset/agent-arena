/**
 * Multi-Game Platform Server
 * 
 * REST API + WebSocket server for all games.
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { mkdirSync } from 'fs';

// Import game engine (registers games on import)
import '../../game-engine/dist/index.js';
import { gameRegistry } from '../../game-engine/dist/index.js';

import { initDb, closeDb } from './db.js';
import { wsManager } from './websocket.js';
import { queueManager } from './queue.js';
import { orchestrator } from './orchestrator.js';
import { testBotManager } from './test-bots.js';
import routes from './routes.js';

const PORT = process.env.PORT || 3001;

// Ensure data directory exists
mkdirSync('./data', { recursive: true });

// Initialize database
initDb();

// Initialize test bots
testBotManager.initBots();

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  const games = gameRegistry.getAll().map(g => ({
    id: g.id,
    name: g.name,
    queueCount: queueManager.getQueueState(g.id)?.bots.length || 0,
    liveMatches: orchestrator.getMatchCount(g.id),
  }));

  res.json({
    status: 'ok',
    timestamp: Date.now(),
    games,
    totalLiveMatches: orchestrator.getActiveMatches().length,
    connections: wsManager.getStats(),
  });
});

// Admin endpoint to fill queue with test bots
app.post('/api/admin/fill-queue/:gameType', (req, res) => {
  const { gameType } = req.params;
  const gameTypeInfo = gameRegistry.get(gameType);
  
  if (!gameTypeInfo) {
    return res.status(404).json({ success: false, error: 'Unknown game type' });
  }

  const target = req.body.target || gameTypeInfo.minPlayers;
  const result = testBotManager.fillQueueTo(gameType, target);
  res.json({ success: true, message: `Filling ${gameType} queue to ${target} bots`, ...result });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket
wsManager.init(server);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  testBotManager.disconnectAll();
  closeDb();
  process.exit(0);
});

// Start server
server.listen(Number(PORT), '0.0.0.0', () => {
  const games = gameRegistry.getAll();
  
  console.log(`
🏟️  Multi-Game Platform Server
════════════════════════════════════════════════════════════════
REST API:    http://localhost:${PORT}/api
WebSocket:   ws://localhost:${PORT}/ws
Health:      http://localhost:${PORT}/health

Registered Games:
${games.map(g => `  • ${g.name} (${g.id}) - ${g.minPlayers} players`).join('\n')}

API Endpoints:
  GET  /api/games                    - List game types
  GET  /api/games/:id                - Game type info
  
  POST /api/bots                     - Register bot
  GET  /api/bots/:id                 - Bot profile
  GET  /api/leaderboard              - Global leaderboard
  GET  /api/leaderboard?gameType=x   - Per-game leaderboard
  
  GET  /api/queue/:gameType          - Queue status
  GET  /api/queues                   - All queue statuses
  POST /api/queue/:gameType/join     - Join queue (X-API-Key)
  POST /api/queue/:gameType/leave    - Leave queue
  
  GET  /api/matches                  - Match history
  GET  /api/matches/live             - Live matches
  GET  /api/matches/:id              - Match details

Admin:
  POST /api/admin/start-demo/:gameType  - Start demo match
  POST /api/admin/fill-queue/:gameType  - Fill queue with test bots

WebSocket:
  ?apiKey=xxx   - Connect as bot
  (no params)   - Connect as spectator

Ready for matches! 🎮
  `);
});
