/**
 * REST API Routes - Multi-Game Platform
 */

import { Router } from 'express';
import {
  createBot,
  getBot,
  getBotByName,
  getAllBots,
  getGlobalLeaderboard,
  getGameLeaderboard,
  getMatch,
  getLiveMatches,
  getRecentMatches,
  botToPublic,
} from './db.js';
import { queueManager } from './queue.js';
import { orchestrator } from './orchestrator.js';
import { wsManager } from './websocket.js';
import { gameRegistry } from '../../game-engine/dist/index.js';
import type { ApiResponse, BotPublic, LeaderboardEntry, GameTypeInfo } from './types.js';

const router = Router();

// ============ GAME TYPES ============

// Get all available game types
router.get('/games', (req, res) => {
  const gameTypes = gameRegistry.getAll();
  
  const data: GameTypeInfo[] = gameTypes.map(gt => ({
    id: gt.id,
    name: gt.name,
    description: gt.description,
    minPlayers: gt.minPlayers,
    maxPlayers: gt.maxPlayers,
    hasPrizePool: gt.hasPrizePool,
    gridIconSize: gt.gridIconSize,
    showMovement: gt.showMovement,
    queueCount: queueManager.getQueueState(gt.id)?.bots.length || 0,
    liveMatches: orchestrator.getMatchCount(gt.id),
  }));

  res.json({ success: true, data } as ApiResponse<GameTypeInfo[]>);
});

// Get specific game type
router.get('/games/:id', (req, res) => {
  const info = gameRegistry.getGameTypeInfo(req.params.id);
  if (!info) {
    return res.status(404).json({ success: false, error: 'Game type not found' } as ApiResponse<null>);
  }

  const queueState = queueManager.getQueueState(req.params.id);
  const data: GameTypeInfo = {
    ...info,
    queueCount: queueState?.bots.length || 0,
    liveMatches: orchestrator.getMatchCount(req.params.id),
  };

  res.json({ success: true, data } as ApiResponse<GameTypeInfo>);
});

// ============ BOTS ============

// Register new bot
router.post('/bots', (req, res) => {
  const { name, avatar } = req.body;

  if (!name || typeof name !== 'string' || name.length < 3 || name.length > 20) {
    return res.status(400).json({
      success: false,
      error: 'Name must be 3-20 characters',
    } as ApiResponse<null>);
  }

  const existing = getBotByName(name);
  if (existing) {
    return res.status(400).json({
      success: false,
      error: 'Bot name already taken',
    } as ApiResponse<null>);
  }

  const bot = createBot(name, avatar || '🤖');

  res.json({
    success: true,
    data: {
      id: bot.id,
      name: bot.name,
      avatar: bot.avatar,
      apiKey: bot.apiKey, // Only returned on creation
    },
  } as ApiResponse<any>);
});

// Get bot by ID
router.get('/bots/:id', (req, res) => {
  const bot = getBot(req.params.id);
  if (!bot) {
    return res.status(404).json({ success: false, error: 'Bot not found' } as ApiResponse<null>);
  }

  res.json({ success: true, data: botToPublic(bot) } as ApiResponse<BotPublic>);
});

// ============ LEADERBOARD ============

// Global leaderboard
router.get('/leaderboard', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const gameTypeId = req.query.gameType as string | undefined;

  let bots: BotPublic[];
  if (gameTypeId) {
    bots = getGameLeaderboard(gameTypeId, limit);
  } else {
    bots = getGlobalLeaderboard(limit);
  }

  const leaderboard: LeaderboardEntry[] = bots.map((bot, i) => ({
    rank: i + 1,
    bot,
    gameTypeId,
    points: bot.totalPoints,
  }));

  res.json({ success: true, data: leaderboard } as ApiResponse<LeaderboardEntry[]>);
});

// ============ QUEUE ============

// Get queue status for a game type
router.get('/queue/:gameType', (req, res) => {
  const { gameType } = req.params;
  const queue = queueManager.getQueueState(gameType);
  
  if (!queue) {
    return res.status(404).json({ success: false, error: 'Unknown game type' } as ApiResponse<null>);
  }

  const bots = queueManager.getQueueWithDetails(gameType);

  res.json({
    success: true,
    data: {
      gameTypeId: gameType,
      bots,
      count: queue.bots.length,
      required: queue.requiredPlayers,
      matchActive: orchestrator.hasActiveMatch(gameType),
    },
  } as ApiResponse<any>);
});

// Get all queue statuses
router.get('/queues', (req, res) => {
  const queues = queueManager.getAllQueueStates().map(q => ({
    gameTypeId: q.gameTypeId,
    count: q.bots.length,
    required: q.requiredPlayers,
    matchActive: orchestrator.hasActiveMatch(q.gameTypeId),
  }));

  res.json({ success: true, data: queues } as ApiResponse<any[]>);
});

// Join queue
router.post('/queue/:gameType/join', (req, res) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ success: false, error: 'API key required' } as ApiResponse<null>);
  }

  const bot = getAllBots().find(b => b.apiKey === apiKey);
  if (!bot) {
    return res.status(401).json({ success: false, error: 'Invalid API key' } as ApiResponse<null>);
  }

  const { gameType } = req.params;
  const result = queueManager.joinQueue(bot.id, gameType);

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error } as ApiResponse<null>);
  }

  res.json({ success: true, data: { position: result.position } } as ApiResponse<{ position: number }>);
});

// Leave queue
router.post('/queue/:gameType/leave', (req, res) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({ success: false, error: 'API key required' } as ApiResponse<null>);
  }

  const bot = getAllBots().find(b => b.apiKey === apiKey);
  if (!bot) {
    return res.status(401).json({ success: false, error: 'Invalid API key' } as ApiResponse<null>);
  }

  const { gameType } = req.params;
  const result = queueManager.leaveQueue(bot.id, gameType);

  res.json({ success: result.success, error: result.error } as ApiResponse<null>);
});

// ============ MATCHES ============

// Get live matches
router.get('/matches/live', (req, res) => {
  const gameTypeId = req.query.gameType as string | undefined;
  const activeMatches = orchestrator.getActiveMatches();

  let matches = activeMatches.map(am => ({
    id: am.dbMatch.id,
    gameTypeId: am.dbMatch.gameTypeId,
    bots: Array.from(am.bots.values()),
    startedAt: am.dbMatch.startedAt,
    state: am.gameMatch.getPublicState(),
  }));

  if (gameTypeId) {
    matches = matches.filter(m => m.gameTypeId === gameTypeId);
  }

  res.json({ success: true, data: matches } as ApiResponse<any[]>);
});

// Get recent matches (history)
router.get('/matches', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const gameTypeId = req.query.gameType as string | undefined;
  
  const matches = getRecentMatches(limit, gameTypeId).map(m => ({
    id: m.id,
    gameTypeId: m.gameTypeId,
    winner: m.winner,
    botIds: m.botIds,
    placements: m.placements,
    prizePool: m.prizePool,
    startedAt: m.startedAt,
    endedAt: m.endedAt,
  }));

  res.json({ success: true, data: matches } as ApiResponse<any[]>);
});

// Get specific match
router.get('/matches/:id', (req, res) => {
  const { id } = req.params;

  // Check if it's a live match
  const active = orchestrator.getActiveMatch(id);
  if (active) {
    return res.json({
      success: true,
      data: {
        ...active.dbMatch,
        bots: Array.from(active.bots.values()),
        state: active.gameMatch.getPublicState(),
        isLive: true,
      },
    } as ApiResponse<any>);
  }

  // Get from history
  const match = getMatch(id);
  if (!match) {
    return res.status(404).json({ success: false, error: 'Match not found' } as ApiResponse<null>);
  }

  // Enrich with bot details
  const bots = match.botIds.map(botId => {
    const bot = getBot(botId);
    return bot ? botToPublic(bot) : { id: botId, name: 'Unknown', avatar: '❓' };
  });

  res.json({
    success: true,
    data: {
      ...match,
      bots,
      isLive: false,
    },
  } as ApiResponse<any>);
});

// ============ STATUS ============

router.get('/status', (req, res) => {
  const wsStats = wsManager.getStats();
  const gameTypes = gameRegistry.getAll();

  const games = gameTypes.map(gt => ({
    id: gt.id,
    name: gt.name,
    queueCount: queueManager.getQueueState(gt.id)?.bots.length || 0,
    liveMatches: orchestrator.getMatchCount(gt.id),
  }));

  res.json({
    success: true,
    data: {
      games,
      totalLiveMatches: orchestrator.getActiveMatches().length,
      spectators: wsStats.spectators,
      connectedBots: wsStats.bots,
      timestamp: Date.now(),
    },
  } as ApiResponse<any>);
});

// ============ ADMIN (for demo) ============

// Start a demo match
router.post('/admin/start-demo/:gameType', async (req, res) => {
  const { gameType } = req.params;
  const gameTypeInfo = gameRegistry.get(gameType);
  
  if (!gameTypeInfo) {
    return res.status(404).json({ success: false, error: 'Unknown game type' } as ApiResponse<null>);
  }

  // Check if match already active for this game
  if (orchestrator.hasActiveMatch(gameType)) {
    return res.status(400).json({ 
      success: false, 
      error: `${gameTypeInfo.name} match already in progress` 
    } as ApiResponse<null>);
  }

  // Get test bots
  const allBots = getAllBots();
  if (allBots.length < gameTypeInfo.minPlayers) {
    return res.status(400).json({
      success: false,
      error: `Need at least ${gameTypeInfo.minPlayers} bots registered`,
    } as ApiResponse<null>);
  }

  const botIds = allBots.slice(0, gameTypeInfo.minPlayers).map(b => b.id);

  // Start match directly (bypass queue for demo)
  await orchestrator.startMatch(gameType, botIds);

  res.json({ 
    success: true, 
    data: { message: `Starting ${gameTypeInfo.name} demo match with ${botIds.length} bots` } 
  } as ApiResponse<any>);
});

export default router;
