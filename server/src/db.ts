/**
 * Database Layer - JSON file storage
 * Multi-game platform support
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { v4 as uuid } from 'uuid';
import type { Bot, BotPublic, Match, MatchPlacement, GameStats } from './types.js';

const DATA_DIR = './data';
const BOTS_FILE = `${DATA_DIR}/bots.json`;
const MATCHES_FILE = `${DATA_DIR}/matches.json`;

interface DbData {
  bots: Bot[];
  matches: Match[];
}

let data: DbData = { bots: [], matches: [] };

export function initDb(): void {
  mkdirSync(DATA_DIR, { recursive: true });
  
  if (existsSync(BOTS_FILE)) {
    try {
      const loaded = JSON.parse(readFileSync(BOTS_FILE, 'utf-8'));
      // Migrate old bots to new format
      data.bots = loaded.map((b: any) => migrateBot(b));
    } catch { data.bots = []; }
  }
  
  if (existsSync(MATCHES_FILE)) {
    try {
      const loaded = JSON.parse(readFileSync(MATCHES_FILE, 'utf-8'));
      // Migrate old matches to new format
      data.matches = loaded.map((m: any) => migrateMatch(m));
    } catch { data.matches = []; }
  }
  
  console.log(`📁 Loaded ${data.bots.length} bots, ${data.matches.length} matches`);
}

// Migrate old bot format to new
function migrateBot(bot: any): Bot {
  return {
    id: bot.id,
    name: bot.name,
    avatar: bot.avatar,
    apiKey: bot.apiKey,
    createdAt: bot.createdAt,
    totalPoints: bot.totalPoints ?? (bot.wins ?? 0) * 7, // Estimate from old wins
    totalMatches: bot.totalMatches ?? bot.matchesPlayed ?? 0,
    totalWins: bot.totalWins ?? bot.wins ?? 0,
    gameStats: bot.gameStats ?? {},
  };
}

// Migrate old match format to new
function migrateMatch(match: any): Match {
  return {
    id: match.id,
    gameTypeId: match.gameTypeId ?? 'pricewars', // Default old matches to pricewars
    status: match.status,
    botIds: match.botIds ?? match.bots ?? [],
    winner: match.winner,
    placements: match.placements ?? [],
    prizePool: match.prizePool ?? 100,
    startedAt: match.startedAt,
    endedAt: match.endedAt,
    createdAt: match.createdAt,
    gameData: match.gameData ?? match.rounds,
  };
}

function saveBots(): void {
  writeFileSync(BOTS_FILE, JSON.stringify(data.bots, null, 2));
}

function saveMatches(): void {
  writeFileSync(MATCHES_FILE, JSON.stringify(data.matches, null, 2));
}

// ============ BOTS ============

export function createBot(name: string, avatar: string): Bot {
  const bot: Bot = {
    id: uuid(),
    name,
    avatar,
    apiKey: uuid().replace(/-/g, ''),
    createdAt: Date.now(),
    totalPoints: 0,
    totalMatches: 0,
    totalWins: 0,
    gameStats: {},
  };
  
  data.bots.push(bot);
  saveBots();
  return bot;
}

export function getBot(id: string): Bot | null {
  return data.bots.find(b => b.id === id) || null;
}

export function getBotByApiKey(apiKey: string): Bot | null {
  return data.bots.find(b => b.apiKey === apiKey) || null;
}

export function getBotByName(name: string): Bot | null {
  return data.bots.find(b => b.name.toLowerCase() === name.toLowerCase()) || null;
}

export function getAllBots(): Bot[] {
  return [...data.bots];
}

// Global leaderboard (all games combined)
export function getGlobalLeaderboard(limit = 20): BotPublic[] {
  return data.bots
    .filter(b => b.totalMatches >= 1)
    .sort((a, b) => b.totalPoints - a.totalPoints || b.totalWins - a.totalWins)
    .slice(0, limit)
    .map(botToPublic);
}

// Per-game leaderboard
export function getGameLeaderboard(gameTypeId: string, limit = 20): BotPublic[] {
  return data.bots
    .filter(b => (b.gameStats[gameTypeId]?.matchesPlayed ?? 0) >= 1)
    .sort((a, b) => {
      const aStats = a.gameStats[gameTypeId] ?? { points: 0, wins: 0 };
      const bStats = b.gameStats[gameTypeId] ?? { points: 0, wins: 0 };
      return bStats.points - aStats.points || bStats.wins - aStats.wins;
    })
    .slice(0, limit)
    .map(b => botToPublicWithGameStats(b, gameTypeId));
}

export function updateBotStats(
  botId: string, 
  gameTypeId: string, 
  placement: number, 
  points: number, 
  won: boolean
): void {
  const bot = data.bots.find(b => b.id === botId);
  if (!bot) return;

  // Update global stats
  bot.totalMatches++;
  bot.totalPoints += points;
  if (won) bot.totalWins++;

  // Update per-game stats
  if (!bot.gameStats[gameTypeId]) {
    bot.gameStats[gameTypeId] = {
      matchesPlayed: 0,
      wins: 0,
      points: 0,
      avgPlacement: 0,
    };
  }

  const gs = bot.gameStats[gameTypeId];
  const newMatchesPlayed = gs.matchesPlayed + 1;
  gs.avgPlacement = ((gs.avgPlacement * gs.matchesPlayed) + placement) / newMatchesPlayed;
  gs.matchesPlayed = newMatchesPlayed;
  gs.points += points;
  if (won) gs.wins++;
  
  saveBots();
}

export function botToPublic(bot: Bot): BotPublic {
  return {
    id: bot.id,
    name: bot.name,
    avatar: bot.avatar,
    totalPoints: bot.totalPoints,
    totalMatches: bot.totalMatches,
    totalWins: bot.totalWins,
    winRate: bot.totalMatches > 0 ? bot.totalWins / bot.totalMatches : 0,
  };
}

function botToPublicWithGameStats(bot: Bot, gameTypeId: string): BotPublic {
  const gs = bot.gameStats[gameTypeId];
  return {
    id: bot.id,
    name: bot.name,
    avatar: bot.avatar,
    totalPoints: gs?.points ?? 0,
    totalMatches: gs?.matchesPlayed ?? 0,
    totalWins: gs?.wins ?? 0,
    winRate: gs && gs.matchesPlayed > 0 ? gs.wins / gs.matchesPlayed : 0,
  };
}

// ============ MATCHES ============

export function createMatch(gameTypeId: string, botIds: string[], prizePool: number = 0): Match {
  const match: Match = {
    id: uuid(),
    gameTypeId,
    status: 'queued',
    botIds,
    winner: null,
    placements: [],
    prizePool,
    startedAt: null,
    endedAt: null,
    createdAt: Date.now(),
  };

  data.matches.push(match);
  saveMatches();
  return match;
}

export function getMatch(id: string): Match | null {
  return data.matches.find(m => m.id === id) || null;
}

export function getLiveMatches(): Match[] {
  return data.matches.filter(m => m.status === 'live');
}

export function getLiveMatchByGameType(gameTypeId: string): Match | null {
  return data.matches.find(m => m.status === 'live' && m.gameTypeId === gameTypeId) || null;
}

export function getRecentMatches(limit = 20, gameTypeId?: string): Match[] {
  let matches = data.matches.filter(m => m.status === 'finished');
  
  if (gameTypeId) {
    matches = matches.filter(m => m.gameTypeId === gameTypeId);
  }
  
  return matches
    .sort((a, b) => (b.endedAt || 0) - (a.endedAt || 0))
    .slice(0, limit);
}

export function updateMatch(match: Match): void {
  const idx = data.matches.findIndex(m => m.id === match.id);
  if (idx >= 0) {
    data.matches[idx] = match;
    saveMatches();
  }
}

export function finishMatch(
  matchId: string, 
  winnerId: string | null, 
  placements: MatchPlacement[]
): void {
  const match = data.matches.find(m => m.id === matchId);
  if (!match) return;

  match.status = 'finished';
  match.winner = winnerId;
  match.placements = placements;
  match.endedAt = Date.now();

  // Update bot stats
  for (const p of placements) {
    updateBotStats(p.botId, match.gameTypeId, p.place, p.points, p.place === 1);
  }

  saveMatches();
}

export function closeDb(): void {
  saveBots();
  saveMatches();
}
