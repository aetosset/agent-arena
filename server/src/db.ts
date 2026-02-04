/**
 * Database Layer - JSON file storage for simplicity
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { v4 as uuid } from 'uuid';
import type { Bot, BotPublic, Match } from './types.js';

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
      data.bots = JSON.parse(readFileSync(BOTS_FILE, 'utf-8'));
    } catch { data.bots = []; }
  }
  
  if (existsSync(MATCHES_FILE)) {
    try {
      data.matches = JSON.parse(readFileSync(MATCHES_FILE, 'utf-8'));
    } catch { data.matches = []; }
  }
  
  console.log(`📁 Loaded ${data.bots.length} bots, ${data.matches.length} matches`);
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
    matchesPlayed: 0,
    wins: 0,
    totalEarnings: 0,
    avgPlacement: 0
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

export function getLeaderboard(limit = 20): BotPublic[] {
  return data.bots
    .filter(b => b.matchesPlayed >= 1)
    .sort((a, b) => b.wins - a.wins || a.avgPlacement - b.avgPlacement)
    .slice(0, limit)
    .map(botToPublic);
}

export function updateBotStats(botId: string, placement: number, won: boolean): void {
  const bot = data.bots.find(b => b.id === botId);
  if (!bot) return;

  const newMatchesPlayed = bot.matchesPlayed + 1;
  const newWins = bot.wins + (won ? 1 : 0);
  const newAvgPlacement = ((bot.avgPlacement * bot.matchesPlayed) + placement) / newMatchesPlayed;

  bot.matchesPlayed = newMatchesPlayed;
  bot.wins = newWins;
  bot.avgPlacement = newAvgPlacement;
  
  saveBots();
}

export function botToPublic(bot: Bot): BotPublic {
  return {
    id: bot.id,
    name: bot.name,
    avatar: bot.avatar,
    matchesPlayed: bot.matchesPlayed,
    wins: bot.wins,
    winRate: bot.matchesPlayed > 0 ? bot.wins / bot.matchesPlayed : 0,
    avgPlacement: bot.avgPlacement
  };
}

// ============ MATCHES ============

export function createMatch(botIds: string[]): Match {
  const match: Match = {
    id: uuid(),
    status: 'queued',
    bots: botIds,
    rounds: [],
    winner: null,
    startedAt: null,
    endedAt: null,
    createdAt: Date.now()
  };

  data.matches.push(match);
  saveMatches();
  return match;
}

export function getMatch(id: string): Match | null {
  return data.matches.find(m => m.id === id) || null;
}

export function getLiveMatch(): Match | null {
  return data.matches.find(m => m.status === 'live') || null;
}

export function getRecentMatches(limit = 20): Match[] {
  return data.matches
    .filter(m => m.status === 'finished')
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

export function closeDb(): void {
  saveBots();
  saveMatches();
}
