/**
 * Platform Tests - Core functionality + both games
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  gameRegistry,
  PriceWarsGameType,
  PriceWarsMatch,
  RPSGameType,
  RPSMatch,
  SAMPLE_ITEMS,
} from '../src/index.js';
import type { Player, MatchEvent } from '../src/core/types.js';

// Test players
const createPlayers = (count: number): Player[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    avatar: '🤖',
    totalPoints: 0,
    totalMatches: 0,
    totalWins: 0,
  }));
};

describe('Game Registry', () => {
  it('should have both games registered', () => {
    expect(gameRegistry.has('pricewars')).toBe(true);
    expect(gameRegistry.has('rps')).toBe(true);
  });

  it('should return game type info', () => {
    const pw = gameRegistry.getGameTypeInfo('pricewars');
    expect(pw?.name).toBe('PRICEWARS');
    expect(pw?.minPlayers).toBe(8);
    expect(pw?.maxPlayers).toBe(8);
    expect(pw?.gridIconSize).toBe(1);
    expect(pw?.showMovement).toBe(true);

    const rps = gameRegistry.getGameTypeInfo('rps');
    expect(rps?.name).toBe('ROCK PAPER SCISSORS');
    expect(rps?.minPlayers).toBe(2);
    expect(rps?.maxPlayers).toBe(2);
    expect(rps?.gridIconSize).toBe(9);
    expect(rps?.showMovement).toBe(false);
  });

  it('should create matches via registry', () => {
    const players8 = createPlayers(8);
    const match = gameRegistry.createMatch('pricewars', { players: players8 });
    expect(match.gameTypeId).toBe('pricewars');
    expect(match.players.length).toBe(8);
  });

  it('should reject wrong player count', () => {
    const players2 = createPlayers(2);
    expect(() => {
      gameRegistry.createMatch('pricewars', { players: players2 });
    }).toThrow('requires at least 8 players');
  });
});

describe('PRICEWARS', () => {
  let match: PriceWarsMatch;
  let players: Player[];
  let events: MatchEvent[];

  beforeEach(() => {
    players = createPlayers(8);
    match = new PriceWarsMatch(players, 100, { items: SAMPLE_ITEMS });
    events = [];
    match.on(e => events.push(e));
  });

  it('should start in waiting phase', () => {
    expect(match.getPhase()).toBe('waiting');
    expect(match.isFinished()).toBe(false);
  });

  it('should emit match_started on start', () => {
    match.start();
    expect(events.some(e => e.type === 'match_started')).toBe(true);
    expect(match.getPhase()).toBe('active');
  });

  it('should emit round_started after start', () => {
    match.start();
    const roundStart = events.find(e => e.type === 'round_started');
    expect(roundStart).toBeDefined();
    expect(roundStart?.round).toBe(1);
  });

  it('should accept bids during deliberation', () => {
    match.start();
    
    const result = match.handleAction('player-1', { type: 'bid', price: 3000 });
    expect(result.success).toBe(true);

    const state = match.getPublicState();
    const player1Display = state.players.find(p => p.id === 'player-1')?.display;
    expect(player1Display?.hasBid).toBe(true);
  });

  it('should accept chat during deliberation', () => {
    match.start();
    
    const result = match.handleAction('player-1', { type: 'chat', message: 'Hello!' });
    expect(result.success).toBe(true);

    const chatEvent = events.find(e => e.type === 'chat_message');
    expect(chatEvent).toBeDefined();
  });

  it('should calculate placements correctly', () => {
    match.start();
    
    // Simulate all players bidding
    for (let i = 0; i < 8; i++) {
      match.handleAction(`player-${i + 1}`, { type: 'bid', price: 1000 * (i + 1) });
    }

    // Force end match for testing
    match.forceEnd();

    const placements = match.getPlacements();
    expect(placements.length).toBeGreaterThan(0);
    expect(placements[0].place).toBe(1);
    expect(placements[0].points).toBe(7); // Beat 7 opponents
  });
});

describe('RPS', () => {
  let match: RPSMatch;
  let players: Player[];
  let events: MatchEvent[];

  beforeEach(() => {
    players = createPlayers(2);
    match = new RPSMatch(players, 0, { roundsToWin: 2 });
    events = [];
    match.on(e => events.push(e));
  });

  it('should start in waiting phase', () => {
    expect(match.getPhase()).toBe('waiting');
  });

  it('should emit match_started on start', () => {
    match.start();
    expect(events.some(e => e.type === 'match_started')).toBe(true);
  });

  it('should accept throws during throwing phase', () => {
    match.start();
    
    const result = match.handleAction('player-1', { type: 'throw', choice: 'rock' });
    expect(result.success).toBe(true);
  });

  it('should reject invalid throws', () => {
    match.start();
    
    const result = match.handleAction('player-1', { type: 'throw', choice: 'invalid' as any });
    expect(result.success).toBe(false);
  });

  it('should resolve round when both throw', async () => {
    match.start();
    
    match.handleAction('player-1', { type: 'throw', choice: 'rock' });
    match.handleAction('player-2', { type: 'throw', choice: 'scissors' });

    // Wait for reveal event
    await new Promise(r => setTimeout(r, 100));

    const revealEvent = events.find(e => e.type === 'game_event' && e.event === 'rps_reveal');
    expect(revealEvent).toBeDefined();
    expect(revealEvent?.data.winner).toBe('player-1'); // Rock beats scissors
  });

  it('should handle draws', async () => {
    match.start();
    
    match.handleAction('player-1', { type: 'throw', choice: 'rock' });
    match.handleAction('player-2', { type: 'throw', choice: 'rock' });

    await new Promise(r => setTimeout(r, 100));

    const revealEvent = events.find(e => e.type === 'game_event' && e.event === 'rps_reveal');
    expect(revealEvent?.data.isDraw).toBe(true);
    expect(revealEvent?.data.winner).toBeNull();
  });

  it('should calculate placements correctly', () => {
    match.start();
    
    // Simulate player 1 winning 2 rounds
    match.handleAction('player-1', { type: 'throw', choice: 'rock' });
    match.handleAction('player-2', { type: 'throw', choice: 'scissors' });

    // Force end for testing
    match.forceEnd();

    const placements = match.getPlacements();
    expect(placements[0].playerId).toBe('player-1');
    expect(placements[0].points).toBe(1);
    expect(placements[1].points).toBe(0);
  });

  it('should accept chat', () => {
    match.start();
    
    const result = match.handleAction('player-1', { type: 'chat', message: 'Get ready!' });
    expect(result.success).toBe(true);
  });
});

describe('Points System', () => {
  it('PRICEWARS: points based on opponents beaten', () => {
    // Points formula: winner (1st) gets N-1 points, 2nd gets N-2, etc.
    // In an 8-player game: 1st=7, 2nd=6, 3rd=5, 4th=4, 5th=3, 6th=2, 7th=1, 8th=0
    const totalPlayers = 8;
    
    // 1st place beats 7 opponents
    expect(totalPlayers - 1).toBe(7);
    
    // 2nd place beats 6 opponents  
    expect(totalPlayers - 2).toBe(6);
    
    // 8th place beats 0 opponents
    expect(totalPlayers - 8).toBe(0);
  });

  it('RPS: winner gets 1 point, loser gets 0', async () => {
    const players = createPlayers(2);
    const match = new RPSMatch(players, 0, { 
      roundsToWin: 1,  // Single round for simplicity
      revealDurationMs: 50,
      betweenRoundsDurationMs: 50,
    });
    
    match.start();
    
    // Player 1 wins
    match.handleAction('player-1', { type: 'throw', choice: 'rock' });
    match.handleAction('player-2', { type: 'throw', choice: 'scissors' });
    
    // Wait for match to finish
    await new Promise(r => setTimeout(r, 200));
    
    expect(match.isFinished()).toBe(true);
    
    const placements = match.getPlacements();
    const winner = placements.find(p => p.place === 1);
    const loser = placements.find(p => p.place === 2);

    expect(winner?.playerId).toBe('player-1');
    expect(winner?.points).toBe(1);
    expect(loser?.points).toBe(0);
  });
});
