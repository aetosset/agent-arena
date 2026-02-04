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
import routes from './routes.js';
import { mkdirSync } from 'fs';

const PORT = process.env.PORT || 3001;

// Ensure data directory exists
mkdirSync('./data', { recursive: true });

// Initialize database
initDb();

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
    queueSize: queueManager.getState().bots.length
  });
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
  GET  /api/status         - Server status

WebSocket:
  ?apiKey=xxx              - Connect as bot
  (no params)              - Connect as spectator

Waiting for bots to connect and queue up...
  `);
});
