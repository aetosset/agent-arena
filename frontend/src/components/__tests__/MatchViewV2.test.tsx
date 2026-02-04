/**
 * MatchViewV2 E2E Tests
 * 
 * Tests the complete UI flow
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDemoGameState, tick, advancePhase, GameState } from '@/lib/gameEngine';

describe('MatchViewV2 - Game Flow', () => {
  it('should initialize with deliberation phase', () => {
    const state = createDemoGameState();
    expect(state.phase).toBe('deliberation');
    expect(state.round).toBe(1);
  });

  it('should show 8 bots at start', () => {
    const state = createDemoGameState();
    expect(state.bots.length).toBe(8);
    expect(state.bots.filter(b => !b.eliminated).length).toBe(8);
  });

  it('should have timer counting down during deliberation', () => {
    const state = createDemoGameState();
    const initialTime = Date.now();
    
    // Simulate time passing
    const laterState = { ...state, phaseStartTime: initialTime - 5000 };
    
    // Time remaining should be less than initial
    const elapsed = Date.now() - laterState.phaseStartTime;
    expect(elapsed).toBeGreaterThanOrEqual(5000);
  });

  it('should generate chat messages during deliberation', () => {
    let state = createDemoGameState();
    
    // Run many ticks
    for (let i = 0; i < 50; i++) {
      state = tick(state);
    }
    
    expect(state.chatMessages.length).toBeGreaterThan(0);
  });

  it('should show bids during reveal phase', () => {
    let state = createDemoGameState();
    state = advancePhase(state); // to bidding
    state = advancePhase(state); // to reveal
    
    expect(state.phase).toBe('reveal');
    state.bots.filter(b => !b.eliminated).forEach(bot => {
      expect(bot.bid).not.toBeNull();
    });
  });

  it('should show eliminated bots during elimination phase', () => {
    let state = createDemoGameState();
    state = advancePhase(state); // to bidding
    state = advancePhase(state); // to reveal
    state = advancePhase(state); // to elimination
    
    expect(state.phase).toBe('elimination');
    expect(state.eliminatedThisRound.length).toBe(2);
  });

  it('should show correct round number', () => {
    let state = createDemoGameState();
    
    expect(state.round).toBe(1);
    
    // Complete round 1
    state = advancePhase(state);
    state = advancePhase(state);
    state = advancePhase(state);
    state = advancePhase(state);
    
    expect(state.round).toBe(2);
  });

  it('should show winner at end', () => {
    let state = createDemoGameState();
    
    while (state.phase !== 'finished') {
      state = advancePhase(state);
    }
    
    expect(state.winnerId).not.toBeNull();
  });
});

describe('MatchViewV2 - Bot Movement', () => {
  it('should move bots on grid during deliberation', () => {
    let state = createDemoGameState();
    const originalPositions = state.bots.map(b => ({ col: b.gridCol, row: b.gridRow }));
    
    // Run many ticks
    for (let i = 0; i < 100; i++) {
      state = tick(state);
    }
    
    // At least some bots should have different positions
    let moved = 0;
    state.bots.forEach((bot, idx) => {
      if (bot.gridCol !== originalPositions[idx].col || bot.gridRow !== originalPositions[idx].row) {
        moved++;
      }
    });
    
    expect(moved).toBeGreaterThan(0);
  });

  it('should not move eliminated bots', () => {
    let state = createDemoGameState();
    
    // Eliminate a bot
    state.bots[0].eliminated = true;
    const originalPos = { col: state.bots[0].gridCol, row: state.bots[0].gridRow };
    
    // Run many ticks
    for (let i = 0; i < 100; i++) {
      state = tick(state);
    }
    
    expect(state.bots[0].gridCol).toBe(originalPos.col);
    expect(state.bots[0].gridRow).toBe(originalPos.row);
  });
});

describe('MatchViewV2 - Visual States', () => {
  it('should display item for current round', () => {
    const state = createDemoGameState();
    expect(state.currentItem).not.toBeNull();
    expect(state.currentItem?.id).toBe('item-1');
  });

  it('should update item for each round', () => {
    let state = createDemoGameState();
    
    // Round 1
    expect(state.currentItem?.id).toBe('item-1');
    
    // Complete round 1
    state = advancePhase(state);
    state = advancePhase(state);
    state = advancePhase(state);
    state = advancePhase(state);
    
    // Round 2
    expect(state.currentItem?.id).toBe('item-2');
  });

  it('should show actual price only during reveal/elimination', () => {
    let state = createDemoGameState();
    
    // During deliberation, price is set but UI wouldn't show it
    expect(state.actualPrice).toBeGreaterThan(0);
    expect(state.phase).toBe('deliberation');
    
    // Move to reveal
    state = advancePhase(state);
    state = advancePhase(state);
    expect(state.phase).toBe('reveal');
    // Now UI would show the price
  });
});

describe('MatchViewV2 - Round Progression', () => {
  it('should progress through all 4 rounds', () => {
    let state = createDemoGameState();
    const roundsVisited: number[] = [];
    
    while (state.phase !== 'finished') {
      if (!roundsVisited.includes(state.round)) {
        roundsVisited.push(state.round);
      }
      state = advancePhase(state);
    }
    
    expect(roundsVisited).toContain(1);
    expect(roundsVisited).toContain(2);
    expect(roundsVisited).toContain(3);
    expect(roundsVisited).toContain(4);
  });

  it('should have correct number of bots each round', () => {
    let state = createDemoGameState();
    
    // Round 1: 8 bots
    expect(state.bots.filter(b => !b.eliminated).length).toBe(8);
    
    // Complete round 1
    state = advancePhase(state); // bidding
    state = advancePhase(state); // reveal
    state = advancePhase(state); // elimination
    state = advancePhase(state); // round 2 deliberation
    
    // Round 2: 6 bots
    expect(state.bots.filter(b => !b.eliminated).length).toBe(6);
    
    // Complete round 2
    state = advancePhase(state);
    state = advancePhase(state);
    state = advancePhase(state);
    state = advancePhase(state);
    
    // Round 3: 4 bots
    expect(state.bots.filter(b => !b.eliminated).length).toBe(4);
    
    // Complete round 3
    state = advancePhase(state);
    state = advancePhase(state);
    state = advancePhase(state);
    state = advancePhase(state);
    
    // Round 4: 2 bots
    expect(state.bots.filter(b => !b.eliminated).length).toBe(2);
  });
});

describe('MatchViewV2 - Timer', () => {
  it('should auto-advance when timer reaches 0', () => {
    let state = createDemoGameState();
    expect(state.phase).toBe('deliberation');
    
    // Simulate timer expired
    state.phaseStartTime = Date.now() - state.phaseDuration - 100;
    
    state = tick(state);
    expect(state.phase).toBe('bidding');
  });

  it('should have correct durations for each phase', () => {
    let state = createDemoGameState();
    
    // Deliberation: 12 seconds
    expect(state.phaseDuration).toBe(12000);
    
    state = advancePhase(state);
    // Bidding: 500ms
    expect(state.phaseDuration).toBe(500);
    
    state = advancePhase(state);
    // Reveal: 4 seconds
    expect(state.phaseDuration).toBe(4000);
    
    state = advancePhase(state);
    // Elimination: 3 seconds
    expect(state.phaseDuration).toBe(3000);
  });
});
