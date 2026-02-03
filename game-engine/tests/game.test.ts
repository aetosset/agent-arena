/**
 * Agent Arena Game Engine Tests
 * 
 * Simulates full games with mock agents making random guesses.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  GameEngine,
  formatPrice,
  distancePercentage,
  createMockAgents,
  MockAgent,
  SAMPLE_ITEMS,
  getRandomItems,
  GameEvent,
  GameItem,
  Agent
} from '../src/index.js';

describe('GameEngine', () => {
  let mockAgents: MockAgent[];
  let items: GameItem[];

  beforeEach(() => {
    mockAgents = createMockAgents(8);
    items = getRandomItems(4); // 4 rounds = 3 eliminations (6 agents) + 1 final
  });

  describe('initialization', () => {
    it('should create a game with 8 agents', () => {
      const engine = new GameEngine({
        agents: mockAgents.map(m => m.agent),
        items,
        roundDurationMs: 100 // Fast for testing
      });

      const state = engine.getState();
      expect(state.agents).toHaveLength(8);
      expect(state.phase).toBe('waiting');
      expect(state.currentRound).toBe(0);
    });

    it('should reject fewer than 2 agents', () => {
      expect(() => new GameEngine({
        agents: [mockAgents[0].agent],
        items
      })).toThrow('Need at least 2 agents');
    });

    it('should reject no items', () => {
      expect(() => new GameEngine({
        agents: mockAgents.map(m => m.agent),
        items: []
      })).toThrow('Need at least 1 item');
    });
  });

  describe('game flow', () => {
    it('should start and emit game_started event', () => {
      const engine = new GameEngine({
        agents: mockAgents.map(m => m.agent),
        items,
        roundDurationMs: 100
      });

      const events: GameEvent[] = [];
      engine.on(e => events.push(e));

      engine.start();

      expect(events[0].type).toBe('game_started');
      expect(events[1].type).toBe('round_started');
    });

    it('should hide actual price during guessing', () => {
      const engine = new GameEngine({
        agents: mockAgents.map(m => m.agent),
        items,
        roundDurationMs: 100
      });

      const events: GameEvent[] = [];
      engine.on(e => events.push(e));

      engine.start();

      const roundStarted = events.find(e => e.type === 'round_started') as any;
      expect(roundStarted.item.price).toBe(0); // Price hidden
    });

    it('should accept guesses during guessing phase', () => {
      const engine = new GameEngine({
        agents: mockAgents.map(m => m.agent),
        items,
        roundDurationMs: 5000
      });

      engine.start();

      const result = engine.submitGuess(mockAgents[0].agent.id, 15000);
      expect(result).toBe(true);

      const state = engine.getState();
      expect(state.guesses[mockAgents[0].agent.id]).toBeDefined();
      expect(state.guesses[mockAgents[0].agent.id].price).toBe(15000);
    });

    it('should accept chat during guessing phase', () => {
      const engine = new GameEngine({
        agents: mockAgents.map(m => m.agent),
        items,
        roundDurationMs: 5000
      });

      engine.start();

      const result = engine.chat(mockAgents[0].agent.id, 'Hello everyone!');
      expect(result).toBe(true);

      const events: GameEvent[] = [];
      engine.on(e => events.push(e));

      engine.chat(mockAgents[1].agent.id, 'Good luck!');

      expect(events.some(e => e.type === 'chat_message')).toBe(true);
    });

    it('should reject guesses from inactive agents', () => {
      const engine = new GameEngine({
        agents: mockAgents.map(m => m.agent),
        items,
        roundDurationMs: 5000
      });

      engine.start();

      // Manually deactivate an agent
      (engine as any).state.agents[0].isActive = false;

      const result = engine.submitGuess(mockAgents[0].agent.id, 15000);
      expect(result).toBe(false);
    });
  });

  describe('round ending and elimination', () => {
    it('should eliminate 2 agents with worst guesses', async () => {
      const engine = new GameEngine({
        agents: mockAgents.map(m => m.agent),
        items,
        roundDurationMs: 50,
        eliminatePerRound: 2
      });

      const events: GameEvent[] = [];
      engine.on(e => events.push(e));

      engine.start();

      // Submit guesses - some close, some far
      const actualPrice = items[0].price;
      engine.submitGuess(mockAgents[0].agent.id, actualPrice); // Perfect
      engine.submitGuess(mockAgents[1].agent.id, actualPrice + 100); // Very close
      engine.submitGuess(mockAgents[2].agent.id, actualPrice + 500);
      engine.submitGuess(mockAgents[3].agent.id, actualPrice + 1000);
      engine.submitGuess(mockAgents[4].agent.id, actualPrice + 5000);
      engine.submitGuess(mockAgents[5].agent.id, actualPrice + 10000);
      engine.submitGuess(mockAgents[6].agent.id, actualPrice + 50000); // Far
      engine.submitGuess(mockAgents[7].agent.id, actualPrice + 100000); // Furthest

      // Wait for round to end
      await new Promise(resolve => setTimeout(resolve, 200));

      const eliminatedEvent = events.find(e => e.type === 'agents_eliminated') as any;
      expect(eliminatedEvent).toBeDefined();
      expect(eliminatedEvent.eliminated).toHaveLength(2);
      expect(eliminatedEvent.remaining).toHaveLength(6);

      // The two furthest should be eliminated
      const eliminatedIds = eliminatedEvent.eliminated.map((a: Agent) => a.id);
      expect(eliminatedIds).toContain(mockAgents[7].agent.id);
      expect(eliminatedIds).toContain(mockAgents[6].agent.id);
    });

    it('should penalize agents who dont guess', async () => {
      const engine = new GameEngine({
        agents: mockAgents.map(m => m.agent),
        items,
        roundDurationMs: 50,
        eliminatePerRound: 2
      });

      const events: GameEvent[] = [];
      engine.on(e => events.push(e));

      engine.start();

      // Only some agents guess
      const actualPrice = items[0].price;
      engine.submitGuess(mockAgents[0].agent.id, actualPrice);
      engine.submitGuess(mockAgents[1].agent.id, actualPrice + 1000);
      engine.submitGuess(mockAgents[2].agent.id, actualPrice + 2000);
      engine.submitGuess(mockAgents[3].agent.id, actualPrice + 3000);
      engine.submitGuess(mockAgents[4].agent.id, actualPrice + 4000);
      engine.submitGuess(mockAgents[5].agent.id, actualPrice + 5000);
      // mockAgents[6] and [7] don't guess

      await new Promise(resolve => setTimeout(resolve, 200));

      const eliminatedEvent = events.find(e => e.type === 'agents_eliminated') as any;
      const eliminatedIds = eliminatedEvent.eliminated.map((a: Agent) => a.id);

      // Non-guessers should be eliminated (infinite distance)
      expect(eliminatedIds).toContain(mockAgents[6].agent.id);
      expect(eliminatedIds).toContain(mockAgents[7].agent.id);
    });
  });

  describe('full game simulation', () => {
    it('should run a complete game until one winner', async () => {
      const testItems = getRandomItems(4);
      const engine = new GameEngine({
        agents: mockAgents.map(m => m.agent),
        items: testItems,
        roundDurationMs: 30,
        eliminatePerRound: 2
      });

      const events: GameEvent[] = [];
      engine.on(e => events.push(e));

      engine.start();

      // Simulate agents guessing each round
      const simulateRound = () => {
        const activeAgents = engine.getActiveAgents();
        const state = engine.getState();
        
        if (state.phase !== 'guessing') return;

        for (const mockAgent of mockAgents) {
          if (activeAgents.find(a => a.id === mockAgent.agent.id)) {
            const guess = mockAgent.generateGuess(state.currentItem!);
            engine.submitGuess(mockAgent.agent.id, guess);

            const chat = mockAgent.maybeChat();
            if (chat) {
              engine.chat(mockAgent.agent.id, chat);
            }
          }
        }
      };

      // Run simulation
      for (let i = 0; i < 10; i++) {
        simulateRound();
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Wait for game to finish
      await new Promise(resolve => setTimeout(resolve, 500));

      const finishedEvent = events.find(e => e.type === 'game_finished') as any;
      expect(finishedEvent).toBeDefined();
      expect(finishedEvent.winner).toBeDefined();
      expect(finishedEvent.rounds.length).toBeGreaterThan(0);

      console.log('\n🏆 GAME RESULTS:');
      console.log(`Winner: ${finishedEvent.winner.name} (${finishedEvent.winner.type})`);
      console.log(`Total rounds: ${finishedEvent.rounds.length}`);
      
      for (const round of finishedEvent.rounds) {
        console.log(`\n📦 Round ${round.roundNumber}: ${round.item.title}`);
        console.log(`   Actual price: ${formatPrice(round.item.price)}`);
        console.log(`   Eliminated: ${round.eliminated.join(', ')}`);
      }
    });

    it('should track round results correctly', async () => {
      const testItems = [SAMPLE_ITEMS[0]]; // Just one round
      const engine = new GameEngine({
        agents: mockAgents.slice(0, 4).map(m => m.agent), // 4 agents
        items: testItems,
        roundDurationMs: 30,
        eliminatePerRound: 2
      });

      engine.start();

      // All agents guess
      engine.submitGuess(mockAgents[0].agent.id, 20000);
      engine.submitGuess(mockAgents[1].agent.id, 25000);
      engine.submitGuess(mockAgents[2].agent.id, 30000);
      engine.submitGuess(mockAgents[3].agent.id, 35000);

      // Some chat
      engine.chat(mockAgents[0].agent.id, 'I think its around $200');
      engine.chat(mockAgents[2].agent.id, 'No way, at least $300');

      await new Promise(resolve => setTimeout(resolve, 200));

      const state = engine.getState();
      expect(state.roundResults).toHaveLength(1);
      
      const round = state.roundResults[0];
      expect(round.guesses).toHaveLength(4);
      expect(round.chat).toHaveLength(2);
      expect(round.eliminated).toHaveLength(2);
    });
  });

  describe('utility functions', () => {
    it('formatPrice should format cents to dollars', () => {
      expect(formatPrice(100)).toBe('$1.00');
      expect(formatPrice(9999)).toBe('$99.99');
      expect(formatPrice(24999)).toBe('$249.99');
      expect(formatPrice(1015000)).toBe('$10150.00');
    });

    it('distancePercentage should calculate correctly', () => {
      expect(distancePercentage(100, 100)).toBe(0);
      expect(distancePercentage(110, 100)).toBe(10);
      expect(distancePercentage(90, 100)).toBe(10);
      expect(distancePercentage(200, 100)).toBe(100);
    });
  });

  describe('mock agents', () => {
    it('should generate reasonable guesses', () => {
      const agent = new MockAgent('test', 'TestBot');
      
      // Electronics should guess in hundreds
      const airpodsGuess = agent.generateGuess(SAMPLE_ITEMS.find(i => i.title.includes('AirPods'))!);
      expect(airpodsGuess).toBeGreaterThan(5000);
      expect(airpodsGuess).toBeLessThan(80000);

      // Food should guess in tens
      const latteGuess = agent.generateGuess(SAMPLE_ITEMS.find(i => i.title.includes('Latte'))!);
      expect(latteGuess).toBeGreaterThan(100);
      expect(latteGuess).toBeLessThan(5000);

      // Luxury should guess in thousands
      const rolexGuess = agent.generateGuess(SAMPLE_ITEMS.find(i => i.title.includes('Rolex'))!);
      expect(rolexGuess).toBeGreaterThan(100000);
      expect(rolexGuess).toBeLessThan(3000000);
    });

    it('should sometimes chat', () => {
      const chattyAgent = new MockAgent('test', 'Chatty', 'mock', 1.0); // 100% chat
      const silentAgent = new MockAgent('test', 'Silent', 'mock', 0.0); // 0% chat

      // Chatty should always chat
      expect(chattyAgent.maybeChat()).not.toBeNull();
      
      // Silent should never chat
      expect(silentAgent.maybeChat()).toBeNull();
    });
  });
});

describe('Full Game Simulation (Console Output)', () => {
  it('should simulate a complete 8-agent game with commentary', async () => {
    console.log('\n' + '='.repeat(60));
    console.log('🏟️  AGENT ARENA - FULL GAME SIMULATION');
    console.log('='.repeat(60));

    const mockAgents = createMockAgents(8);
    const items = getRandomItems(4);

    console.log('\n📋 REGISTERED AGENTS:');
    mockAgents.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.agent.name} (${m.agent.type})`);
    });

    console.log('\n📦 ITEMS FOR THIS GAME:');
    items.forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.title} - ${formatPrice(item.price)}`);
    });

    const engine = new GameEngine({
      agents: mockAgents.map(m => m.agent),
      items,
      roundDurationMs: 100,
      eliminatePerRound: 2
    });

    // Event logging
    engine.on(event => {
      switch (event.type) {
        case 'round_started':
          console.log(`\n${'─'.repeat(50)}`);
          console.log(`🔔 ROUND ${event.round} STARTED`);
          console.log(`   Item: ${event.item.title}`);
          console.log(`   (Price hidden - agents guessing...)`);
          break;

        case 'chat_message':
          const agent = mockAgents.find(m => m.agent.id === event.agentId);
          console.log(`   💬 ${agent?.agent.name}: "${event.message}"`);
          break;

        case 'round_ended':
          console.log(`\n   💰 ACTUAL PRICE: ${formatPrice(event.item.price)}`);
          console.log(`   📊 GUESSES:`);
          event.guesses.forEach(g => {
            const agent = mockAgents.find(m => m.agent.id === g.agentId);
            const diff = g.price === -1 ? 'NO GUESS' : formatPrice(Math.abs(g.price - event.item.price));
            console.log(`      ${agent?.agent.name}: ${g.price === -1 ? 'NO GUESS' : formatPrice(g.price)} (off by ${diff})`);
          });
          break;

        case 'agents_eliminated':
          console.log(`\n   ❌ ELIMINATED:`);
          event.eliminated.forEach(a => {
            console.log(`      - ${a.name}`);
          });
          console.log(`   ✅ REMAINING: ${event.remaining.map(a => a.name).join(', ')}`);
          break;

        case 'game_finished':
          console.log(`\n${'='.repeat(50)}`);
          console.log(`🏆 WINNER: ${event.winner.name} (${event.winner.type})`);
          console.log(`${'='.repeat(50)}`);
          break;
      }
    });

    engine.start();

    // Simulate agents playing
    const playRound = () => {
      const activeAgents = engine.getActiveAgents();
      const state = engine.getState();

      if (state.phase !== 'guessing' || !state.currentItem) return;

      // Small delay then all agents guess
      setTimeout(() => {
        for (const mockAgent of mockAgents) {
          if (activeAgents.find(a => a.id === mockAgent.agent.id)) {
            const guess = mockAgent.generateGuess(state.currentItem!);
            engine.submitGuess(mockAgent.agent.id, guess);

            const chat = mockAgent.maybeChat();
            if (chat) {
              engine.chat(mockAgent.agent.id, chat);
            }
          }
        }
      }, 20);
    };

    // Keep playing rounds
    for (let i = 0; i < 10; i++) {
      playRound();
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    // Wait for game to definitely finish
    await new Promise(resolve => setTimeout(resolve, 500));

    const finalState = engine.getState();
    expect(finalState.phase).toBe('finished');
    expect(finalState.winner).toBeDefined();
  });
});
