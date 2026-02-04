/**
 * Agent Arena Game Server
 * 
 * REST API + WebSocket server for running the game.
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { initDb, closeDb } from './db.js';
import { wsManager } from './websocket.js';
import { queueManager } from './queue.js';
import { orchestrator } from './orchestrator.js';
import { testBotManager } from './test-bots.js';
import routes from './routes.js';
import { mkdirSync } from 'fs';

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
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    matchActive: orchestrator.isMatchActive(),
    queueSize: queueManager.getState().bots.length,
    connections: wsManager.getStats()
  });
});

// Admin endpoint to fill queue with test bots
app.post('/api/admin/fill-queue', (req, res) => {
  const target = req.body.target || 8;
  testBotManager.fillQueueTo(target);
  res.json({ success: true, message: `Filling queue to ${target} bots` });
});

// Admin endpoint to start match with test bots
app.post('/api/admin/start-demo', async (req, res) => {
  if (orchestrator.isMatchActive()) {
    return res.json({ success: false, error: 'Match already in progress' });
  }
  
  // Fill queue and start
  testBotManager.fillQueueTo(8);
  res.json({ success: true, message: 'Starting demo match with test bots' });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket
wsManager.init(server);

// Set up queue -> match trigger
queueManager.setMatchReadyHandler((botIds) => {
  orchestrator.startMatch(botIds);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  testBotManager.disconnectAll();
  closeDb();
  process.exit(0);
});

// Start server
server.listen(PORT, () => {
  console.log(`
🏟️  Agent Arena Game Server
════════════════════════════════════
REST API:    http://localhost:${PORT}/api
WebSocket:   ws://localhost:${PORT}/ws
Health:      http://localhost:${PORT}/health

Endpoints:
  POST /api/bots           - Register new bot
  GET  /api/bots           - Leaderboard
  GET  /api/bots/:id       - Bot profile
  GET  /api/queue          - Queue status
  POST /api/queue/join     - Join queue (needs X-API-Key)
  POST /api/queue/leave    - Leave queue
  GET  /api/matches        - Recent matches
  GET  /api/matches/live   - Current match
  GET  /api/matches/:id    - Match replay data
  
Admin:
  POST /api/admin/fill-queue  - Fill queue with test bots
  POST /api/admin/start-demo  - Start demo match

WebSocket:
  ?apiKey=xxx              - Connect as bot
  (no params)              - Connect as spectator

Test bots initialized. Ready for matches!
  `);
});
