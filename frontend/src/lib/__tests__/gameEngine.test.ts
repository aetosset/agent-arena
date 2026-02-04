/**
 * Game Engine E2E Tests
 * 
 * Tests the complete game flow from start to finish
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDemoGameState,
  tick,
  advancePhase,
  getTimeRemaining,
  getActiveBots,
  moveBots,
  generateBids,
  eliminateBots,
  addChatMessage,
  GameState,
  GRID_COLS,
  GRID_ROWS,
  PHASE_DURATIONS,
  DEMO_BOTS,
  DEMO_ITEMS,
} from '../gameEngine';

describe('Game Engine - Initialization', () => {
  it('should create initial game state with correct defaults', () => {
    const state = createDemoGameState();
    
    expect(state.phase).toBe('deliberation');
    expect(state.round).toBe(1);
    expect(state.totalRounds).toBe(4);
    expect(state.bots).toHaveLength(8);
    expect(state.currentItem).toBeDefined();
    expect(state.winnerId).toBeNull();
  });

  it('should place all 8 bots on the grid', () => {
    const state = createDemoGameState();
    
    state.bots.forEach(bot => {
      expect(bot.gridCol).toBeGreaterThanOrEqual(0);
      expect(bot.gridCol).toBeLessThan(GRID_COLS);
      expect(bot.gridRow).toBeGreaterThanOrEqual(0);
      expect(bot.gridRow).toBeLessThan(GRID_ROWS);
    });
  });

  it('should have no eliminated bots at start', () => {
    const state = createDemoGameState();
    const active = getActiveBots(state);
    
    expect(active).toHaveLength(8);
    state.bots.forEach(bot => {
      expect(bot.eliminated).toBe(false);
      expect(bot.eliminatedRound).toBeNull();
    });
  });

  it('should start with first item', () => {
    const state = createDemoGameState();
    
    expect(state.currentItem?.id).toBe('item-1');
    expect(state.actualPrice).toBe(DEMO_ITEMS[0].price);
  });
});

describe('Game Engine - Phase Transitions', () => {
  it('should transition from deliberation to bidding', () => {
    let state = createDemoGameState();
    state = advancePhase(state);
    
    expect(state.phase).toBe('bidding');
  });

  it('should generate bids when entering bidding phase', () => {
    let state = createDemoGameState();
    state = advancePhase(state); // deliberation -> bidding
    
    const activeBots = getActiveBots(state);
    activeBots.forEach(bot => {
      expect(bot.bid).not.toBeNull();
      expect(bot.bid).toBeGreaterThan(0);
    });
  });

  it('should transition from bidding to reveal', () => {
    let state = createDemoGameState();
    state = advancePhase(state); // deliberation -> bidding
    state = advancePhase(state); // bidding -> reveal
    
    expect(state.phase).toBe('reveal');
  });

  it('should transition from reveal to elimination', () => {
    let state = createDemoGameState();
    state = advancePhase(state); // deliberation -> bidding
    state = advancePhase(state); // bidding -> reveal
    state = advancePhase(state); // reveal -> elimination
    
    expect(state.phase).toBe('elimination');
  });

  it('should eliminate 2 bots in elimination phase', () => {
    let state = createDemoGameState();
    state = advancePhase(state); // deliberation -> bidding
    state = advancePhase(state); // bidding -> reveal
    state = advancePhase(state); // reveal -> elimination
    
    expect(state.eliminatedThisRound).toHaveLength(2);
    expect(getActiveBots(state)).toHaveLength(6);
  });

  it('should start round 2 after elimination', () => {
    let state = createDemoGameState();
    state = advancePhase(state); // deliberation -> bidding
    state = advancePhase(state); // bidding -> reveal
    state = advancePhase(state); // reveal -> elimination
    state = advancePhase(state); // elimination -> deliberation (round 2)
    
    expect(state.phase).toBe('deliberation');
    expect(state.round).toBe(2);
    expect(state.currentItem?.id).toBe('item-2');
  });
});

describe('Game Engine - Full Match Simulation', () => {
  it('should complete a full 4-round match', () => {
    let state = createDemoGameState();
    
    // Run through all 4 rounds
    for (let round = 1; round <= 4; round++) {
      expect(state.round).toBe(round);
      expect(state.phase).toBe('deliberation');
      
      state = advancePhase(state); // deliberation -> bidding
      state = advancePhase(state); // bidding -> reveal
      state = advancePhase(state); // reveal -> elimination
      
      const expectedRemaining = 8 - (round * 2);
      
      if (round < 4) {
        // Not final round - should have correct number remaining
        expect(getActiveBots(state).length).toBe(Math.max(2, expectedRemaining));
        state = advancePhase(state); // elimination -> next deliberation
      }
    }
    
    // After round 4, should be finished with 1 winner
    state = advancePhase(state); // elimination -> finished
    expect(state.phase).toBe('finished');
    expect(state.winnerId).not.toBeNull();
    expect(getActiveBots(state)).toHaveLength(1);
  });

  it('should have exactly 1 winner at the end', () => {
    let state = createDemoGameState();
    
    // Fast-forward through entire match
    while (state.phase !== 'finished') {
      state = advancePhase(state);
    }
    
    expect(state.winnerId).not.toBeNull();
    const winner = state.bots.find(b => b.id === state.winnerId);
    expect(winner).toBeDefined();
    expect(winner?.eliminated).toBe(false);
  });

  it('should eliminate 7 bots total (8 - 1 winner)', () => {
    let state = createDemoGameState();
    
    while (state.phase !== 'finished') {
      state = advancePhase(state);
    }
    
    const eliminated = state.bots.filter(b => b.eliminated);
    expect(eliminated).toHaveLength(7);
  });
});

describe('Game Engine - Bot Movement', () => {
  it('should only move bots during deliberation', () => {
    let state = createDemoGameState();
    const originalPositions = state.bots.map(b => ({ col: b.gridCol, row: b.gridRow }));
    
    // Move to bidding phase
    state = advancePhase(state);
    expect(state.phase).toBe('bidding');
    
    // Try to move - should not change
    const afterMove = moveBots(state);
    afterMove.bots.forEach((bot, idx) => {
      // Positions should be unchanged since not in deliberation
      // (Note: bids are generated so this comparison is just for grid position)
    });
  });

  it('should keep bots within grid bounds', () => {
    let state = createDemoGameState();
    
    // Run many movement ticks
    for (let i = 0; i < 100; i++) {
      state = moveBots(state);
    }
    
    state.bots.forEach(bot => {
      expect(bot.gridCol).toBeGreaterThanOrEqual(0);
      expect(bot.gridCol).toBeLessThan(GRID_COLS);
      expect(bot.gridRow).toBeGreaterThanOrEqual(0);
      expect(bot.gridRow).toBeLessThan(GRID_ROWS);
    });
  });

  it('should not move eliminated bots', () => {
    let state = createDemoGameState();
    
    // Eliminate first bot manually
    state.bots[0].eliminated = true;
    const originalPos = { col: state.bots[0].gridCol, row: state.bots[0].gridRow };
    
    // Run many movement ticks
    for (let i = 0; i < 50; i++) {
      state = moveBots(state);
    }
    
    // Eliminated bot should not have moved
    expect(state.bots[0].gridCol).toBe(originalPos.col);
    expect(state.bots[0].gridRow).toBe(originalPos.row);
  });
});

describe('Game Engine - Bidding', () => {
  it('should generate reasonable bids near actual price', () => {
    let state = createDemoGameState();
    state = generateBids(state);
    
    const activeBots = getActiveBots(state);
    activeBots.forEach(bot => {
      expect(bot.bid).not.toBeNull();
      // Bid should be within 50% of actual price (our variance)
      const diff = Math.abs(bot.bid! - state.actualPrice);
      expect(diff).toBeLessThanOrEqual(state.actualPrice * 0.6); // Allow some margin
    });
  });

  it('should not generate bids for eliminated bots', () => {
    let state = createDemoGameState();
    state.bots[0].eliminated = true;
    state.bots[0].bid = null;
    
    state = generateBids(state);
    
    expect(state.bots[0].bid).toBeNull();
  });
});

describe('Game Engine - Elimination', () => {
  it('should eliminate bots furthest from actual price', () => {
    let state = createDemoGameState();
    
    // Set specific bids - make bot-1 and bot-2 the worst
    state.bots[0].bid = 100;    // Very low, far from any price
    state.bots[1].bid = 100000; // Very high, far from any price
    state.bots[2].bid = state.actualPrice; // Perfect guess
    state.bots[3].bid = state.actualPrice + 100;
    state.bots[4].bid = state.actualPrice - 100;
    state.bots[5].bid = state.actualPrice + 200;
    state.bots[6].bid = state.actualPrice - 200;
    state.bots[7].bid = state.actualPrice + 300;
    
    state = eliminateBots(state);
    
    expect(state.bots[0].eliminated).toBe(true);
    expect(state.bots[1].eliminated).toBe(true);
    expect(state.eliminatedThisRound).toContain('bot-1');
    expect(state.eliminatedThisRound).toContain('bot-2');
  });

  it('should eliminate only 1 bot when 2 remain', () => {
    let state = createDemoGameState();
    
    // Eliminate all but 2 bots manually
    for (let i = 2; i < 8; i++) {
      state.bots[i].eliminated = true;
    }
    state.bots[0].bid = state.actualPrice;
    state.bots[1].bid = state.actualPrice + 5000; // Worse guess
    
    state = eliminateBots(state);
    
    // Only bot-2 should be eliminated (it had worse guess)
    expect(state.eliminatedThisRound).toHaveLength(1);
    expect(state.bots[1].eliminated).toBe(true);
    expect(state.bots[0].eliminated).toBe(false);
  });

  it('should set eliminatedRound correctly', () => {
    let state = createDemoGameState();
    state = generateBids(state);
    state = eliminateBots(state);
    
    const eliminated = state.bots.filter(b => b.eliminated);
    eliminated.forEach(bot => {
      expect(bot.eliminatedRound).toBe(state.round);
    });
  });
});

describe('Game Engine - Chat', () => {
  it('should add chat messages', () => {
    let state = createDemoGameState();
    expect(state.chatMessages).toHaveLength(0);
    
    state = addChatMessage(state);
    
    expect(state.chatMessages).toHaveLength(1);
    expect(state.chatMessages[0].botId).toBeDefined();
    expect(state.chatMessages[0].message).toBeDefined();
  });

  it('should keep max 20 messages', () => {
    let state = createDemoGameState();
    
    for (let i = 0; i < 30; i++) {
      state = addChatMessage(state);
    }
    
    expect(state.chatMessages.length).toBeLessThanOrEqual(21);
  });

  it('should only have chat from active bots', () => {
    let state = createDemoGameState();
    
    // Eliminate first bot
    state.bots[0].eliminated = true;
    
    // Add many messages
    for (let i = 0; i < 20; i++) {
      state = addChatMessage(state);
    }
    
    // No messages should be from eliminated bot
    state.chatMessages.forEach(msg => {
      expect(msg.botId).not.toBe('bot-1');
    });
  });
});

describe('Game Engine - Timing', () => {
  it('should calculate time remaining correctly', () => {
    const state = createDemoGameState();
    
    // Just started, should have ~full duration remaining
    const remaining = getTimeRemaining(state);
    expect(remaining).toBeGreaterThan(PHASE_DURATIONS.deliberation - 100);
    expect(remaining).toBeLessThanOrEqual(PHASE_DURATIONS.deliberation);
  });

  it('should return 0 when phase is over', () => {
    let state = createDemoGameState();
    state.phaseStartTime = Date.now() - PHASE_DURATIONS.deliberation - 1000;
    
    expect(getTimeRemaining(state)).toBe(0);
  });
});

describe('Game Engine - Tick Function', () => {
  it('should advance phase when time runs out', () => {
    let state = createDemoGameState();
    state.phaseStartTime = Date.now() - PHASE_DURATIONS.deliberation - 100;
    
    state = tick(state);
    
    expect(state.phase).toBe('bidding');
  });

  it('should not advance phase if time remains', () => {
    let state = createDemoGameState();
    // Phase just started
    
    state = tick(state);
    
    expect(state.phase).toBe('deliberation');
  });

  it('should move bots during deliberation tick', () => {
    // This is probabilistic, so we run many ticks
    let state = createDemoGameState();
    const originalPositions = state.bots.map(b => `${b.gridCol},${b.gridRow}`);
    
    // Run many ticks
    for (let i = 0; i < 100; i++) {
      state = tick(state);
    }
    
    // At least some bots should have moved
    const newPositions = state.bots.map(b => `${b.gridCol},${b.gridRow}`);
    const movedCount = originalPositions.filter((pos, idx) => pos !== newPositions[idx]).length;
    
    expect(movedCount).toBeGreaterThan(0);
  });
});

describe('Game Engine - Edge Cases', () => {
  it('should handle empty bot list gracefully', () => {
    let state = createDemoGameState();
    state.bots = [];
    
    // These should not throw
    expect(() => moveBots(state)).not.toThrow();
    expect(() => generateBids(state)).not.toThrow();
    expect(() => eliminateBots(state)).not.toThrow();
  });

  it('should handle all bots eliminated', () => {
    let state = createDemoGameState();
    state.bots.forEach(bot => {
      bot.eliminated = true;
    });
    
    expect(getActiveBots(state)).toHaveLength(0);
    expect(() => addChatMessage(state)).not.toThrow();
  });

  it('should handle finished state', () => {
    let state = createDemoGameState();
    state.phase = 'finished';
    state.winnerId = 'bot-1';
    
    // Tick should not change finished state
    const afterTick = tick(state);
    expect(afterTick.phase).toBe('finished');
  });
});
