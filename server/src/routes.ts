/**
 * REST API Routes
 */

import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import {
  createBot,
  getBot,
  getBotByName,
  getAllBots,
  getLeaderboard,
  getMatch,
  getLiveMatch,
  getRecentMatches,
  botToPublic
} from './db.js';
import { queueManager } from './queue.js';
import { orchestrator } from './orchestrator.js';
import { wsManager } from './websocket.js';
import type { ApiResponse, BotPublic, LeaderboardEntry } from './types.js';

const router = Router();

// ============ BOTS ============

// Register new bot
router.post('/bots', (req, res) => {
  const { name, avatar } = req.body;

  if (!name || typeof name !== 'string' || name.length < 3 || name.length > 20) {
    return res.status(400).json({
      success: false,
      error: 'Name must be 3-20 characters'
    } as ApiResponse<null>);
  }

  // Check if name is taken
  const existing = getBotByName(name);
  if (existing) {
    return res.status(400).json({
      success: false,
      error: 'Bot name already taken'
    } as ApiResponse<null>);
  }

  const bot = createBot(name, avatar || 'robot-1');

  res.json({
    success: true,
    data: {
      id: bot.id,
      name: bot.name,
      avatar: bot.avatar,
      apiKey: bot.apiKey  // Only returned on creation!
    }
  } as ApiResponse<any>);
});

// Get bot by ID (public info)
router.get('/bots/:id', (req, res) => {
  const bot = getBot(req.params.id);
  if (!bot) {
    return res.status(404).json({
      success: false,
      error: 'Bot not found'
    } as ApiResponse<null>);
  }

  res.json({
    success: true,
    data: botToPublic(bot)
  } as ApiResponse<BotPublic>);
});

// Get leaderboard
router.get('/bots', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const bots = getLeaderboard(limit);

  const leaderboard: LeaderboardEntry[] = bots.map((bot, i) => ({
    rank: i + 1,
    bot
  }));

  res.json({
    success: true,
    data: leaderboard
  } as ApiResponse<LeaderboardEntry[]>);
});

// ============ QUEUE ============

// Get queue status
router.get('/queue', (req, res) => {
  const queue = queueManager.getQueueWithDetails();
  const state = queueManager.getState();

  res.json({
    success: true,
    data: {
      bots: queue,
      count: queue.length,
      required: state.matchStartsWhen,
      matchActive: orchestrator.isMatchActive()
    }
  } as ApiResponse<any>);
});

// Join queue (requires API key in header)
router.post('/queue/join', (req, res) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required in X-API-Key header'
    } as ApiResponse<null>);
  }

  // Get bot by API key
  const bot = getAllBots().find(b => b.apiKey === apiKey);
  if (!bot) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    } as ApiResponse<null>);
  }

  const result = queueManager.joinQueue(bot.id);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: result.error
    } as ApiResponse<null>);
  }

  res.json({
    success: true,
    data: { position: result.position }
  } as ApiResponse<{ position: number }>);
});

// Leave queue
router.post('/queue/leave', (req, res) => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required'
    } as ApiResponse<null>);
  }

  const bot = getAllBots().find(b => b.apiKey === apiKey);
  if (!bot) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    } as ApiResponse<null>);
  }

  const result = queueManager.leaveQueue(bot.id);
  res.json({
    success: result.success,
    error: result.error
  } as ApiResponse<null>);
});

// ============ MATCHES ============

// Get live match
router.get('/matches/live', (req, res) => {
  const match = orchestrator.getActiveMatch();
  if (!match) {
    return res.json({
      success: true,
      data: null
    } as ApiResponse<null>);
  }

  res.json({
    success: true,
    data: {
      id: match.match.id,
      round: match.currentRound,
      activeBots: match.activeBotIds,
      bots: Array.from(match.bots.values()),
      startedAt: match.match.startedAt
    }
  } as ApiResponse<any>);
});

// Get recent matches
router.get('/matches', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
  const matches = getRecentMatches(limit);

  const data = matches.map(m => ({
    id: m.id,
    winner: m.winner,
    bots: m.bots,
    rounds: m.rounds.length,
    endedAt: m.endedAt
  }));

  res.json({
    success: true,
    data
  } as ApiResponse<any[]>);
});

// Get specific match (for replay)
router.get('/matches/:id', (req, res) => {
  const match = getMatch(req.params.id);
  if (!match) {
    return res.status(404).json({
      success: false,
      error: 'Match not found'
    } as ApiResponse<null>);
  }

  // Enrich with bot details
  const bots = match.bots.map(botId => {
    const bot = getBot(botId);
    return bot ? botToPublic(bot) : { id: botId, name: 'Unknown', avatar: 'default', matchesPlayed: 0, wins: 0, winRate: 0, avgPlacement: 0 };
  });

  res.json({
    success: true,
    data: {
      ...match,
      botsDetails: bots
    }
  } as ApiResponse<any>);
});

// ============ STATUS ============

router.get('/status', (req, res) => {
  const wsStats = wsManager.getStats();

  res.json({
    success: true,
    data: {
      matchActive: orchestrator.isMatchActive(),
      queueSize: queueManager.getState().bots.length,
      spectators: wsStats.spectators,
      connectedBots: wsStats.bots,
      timestamp: Date.now()
    }
  } as ApiResponse<any>);
});

export default router;
