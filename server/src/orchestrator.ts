/**
 * Multi-Game Match Orchestrator
 * 
 * Manages active matches for all game types.
 * Uses the unified game engine interface.
 */

import type { Match, BotPublic, BotCommand, MatchPlacement } from './types.js';
import { wsManager } from './websocket.js';
import { createMatch, updateMatch, finishMatch, getBot, botToPublic } from './db.js';
import { queueManager } from './queue.js';
import { 
  gameRegistry, 
  type GameMatch, 
  type Player, 
  type MatchEvent,
  SAMPLE_ITEMS 
} from '../../game-engine/dist/index.js';

// Timing constants
const MATCH_COUNTDOWN = 3000;  // 3s before match starts

interface ActiveMatch {
  dbMatch: Match;
  gameMatch: GameMatch;
  bots: Map<string, BotPublic>;
}

class MultiMatchOrchestrator {
  private activeMatches: Map<string, ActiveMatch> = new Map(); // matchId -> ActiveMatch

  constructor() {
    // Set up queue event handler
    queueManager.setEventHandlers({
      onMatchReady: (gameTypeId, botIds) => this.startMatch(gameTypeId, botIds),
    });

    // Listen for bot commands
    wsManager.setBotCommandHandler((botId, command) => {
      this.handleBotCommand(botId, command);
    });
  }

  /**
   * Start a new match
   */
  async startMatch(gameTypeId: string, botIds: string[]): Promise<void> {
    const gameType = gameRegistry.get(gameTypeId);
    if (!gameType) {
      console.error(`Unknown game type: ${gameTypeId}`);
      return;
    }

    try {
      // Load bots
      const bots = new Map<string, BotPublic>();
      const players: Player[] = [];
      
      for (const botId of botIds) {
        const bot = getBot(botId);
        if (bot) {
          const botPublic = botToPublic(bot);
          bots.set(botId, botPublic);
          players.push({
            id: bot.id,
            name: bot.name,
            avatar: bot.avatar,
            totalPoints: bot.totalPoints,
            totalMatches: bot.totalMatches,
            totalWins: bot.totalWins,
          });
        }
      }

      // Determine prize pool
      const prizePool = gameType.hasPrizePool ? (gameType.defaultPrizePool ?? 100) : 0;

      // Create match in DB
      const dbMatch = createMatch(gameTypeId, botIds, prizePool);
      dbMatch.status = 'live';
      dbMatch.startedAt = Date.now();
      updateMatch(dbMatch);

      // Create game match instance
      const gameMatch = gameRegistry.createMatch(gameTypeId, { players, prizePool });

      // Store active match
      const activeMatch: ActiveMatch = {
        dbMatch,
        gameMatch,
        bots,
      };
      this.activeMatches.set(dbMatch.id, activeMatch);

      // Subscribe to game events
      gameMatch.on((event) => this.handleGameEvent(dbMatch.id, event));

      console.log(`🏟️ ${gameType.name} match ${dbMatch.id} starting with ${botIds.length} players`);

      // Notify all spectators
      wsManager.broadcastToSpectators({
        type: 'match_starting',
        matchId: dbMatch.id,
        gameTypeId,
        bots: Array.from(bots.values()),
        startsIn: MATCH_COUNTDOWN,
      });

      // Notify bots
      for (const botId of botIds) {
        wsManager.setBotMatch(botId, dbMatch.id);
        wsManager.sendToBot(botId, {
          type: 'match_assigned',
          matchId: dbMatch.id,
          gameTypeId,
          opponents: Array.from(bots.values()).filter(b => b.id !== botId),
        });
      }

      // Start after countdown
      await this.delay(MATCH_COUNTDOWN);
      gameMatch.start();

    } catch (error) {
      console.error('❌ Match start error:', error);
    }
  }

  /**
   * Handle events from game engine
   */
  private handleGameEvent(matchId: string, event: MatchEvent): void {
    const active = this.activeMatches.get(matchId);
    if (!active) return;

    const { dbMatch, bots } = active;
    const botIds = Array.from(bots.keys());

    switch (event.type) {
      case 'match_started':
        // Already handled in startMatch
        break;

      case 'round_started':
        wsManager.broadcastAll({
          type: 'game_event',
          matchId,
          gameTypeId: dbMatch.gameTypeId,
          event: 'round_started',
          data: {
            round: event.round,
            endsAt: event.endsAt,
            ...event.data,
          },
        }, botIds);

        // Send action request to bots
        for (const botId of botIds) {
          wsManager.sendToBot(botId, {
            type: 'action_request',
            matchId,
            gameTypeId: dbMatch.gameTypeId,
            deadline: event.endsAt,
            context: event.data,
          });
        }
        break;

      case 'chat_message':
        wsManager.broadcastAll({
          type: 'chat_message',
          matchId,
          botId: event.playerId,
          botName: event.playerName,
          message: event.message,
        }, botIds);
        break;

      case 'player_action':
        if (event.public) {
          wsManager.broadcastAll({
            type: 'game_event',
            matchId,
            gameTypeId: dbMatch.gameTypeId,
            event: 'player_action',
            data: { playerId: event.playerId, actionType: event.actionType },
          }, botIds);
        }
        break;

      case 'round_ended':
        wsManager.broadcastAll({
          type: 'game_event',
          matchId,
          gameTypeId: dbMatch.gameTypeId,
          event: 'round_ended',
          data: { round: event.round, ...event.data },
        }, botIds);
        break;

      case 'player_eliminated':
        wsManager.broadcastAll({
          type: 'game_event',
          matchId,
          gameTypeId: dbMatch.gameTypeId,
          event: 'player_eliminated',
          data: { 
            playerId: event.playerId, 
            playerName: event.playerName,
            round: event.round,
          },
        }, botIds);
        break;

      case 'game_event':
        // Pass through game-specific events
        wsManager.broadcastAll({
          type: 'game_event',
          matchId,
          gameTypeId: dbMatch.gameTypeId,
          event: event.event,
          data: event.data,
        }, botIds);
        break;

      case 'match_finished':
        this.endMatch(matchId, event.winner, event.placements);
        break;
    }
  }

  /**
   * Handle bot commands
   */
  private handleBotCommand(botId: string, command: BotCommand): void {
    // Find which match this bot is in
    const matchId = wsManager.getBotMatch(botId);
    if (!matchId) return;

    const active = this.activeMatches.get(matchId);
    if (!active) return;

    const { gameMatch, dbMatch } = active;

    if (command.type === 'chat') {
      const result = gameMatch.handleAction(botId, { type: 'chat', message: command.message });
      wsManager.sendToBot(botId, { type: 'action_result', success: result.success, error: result.error });
    } else if (command.type === 'action') {
      // Game-specific action
      const result = gameMatch.handleAction(botId, command.action);
      wsManager.sendToBot(botId, { type: 'action_result', success: result.success, error: result.error });
    }
  }

  /**
   * End a match
   */
  private endMatch(matchId: string, winner: Player | null, placements: any[]): void {
    const active = this.activeMatches.get(matchId);
    if (!active) return;

    const { dbMatch, bots } = active;
    const botIds = Array.from(bots.keys());

    // Convert placements
    const matchPlacements: MatchPlacement[] = placements.map(p => ({
      botId: p.playerId,
      place: p.place,
      points: p.points,
    }));

    // Update DB
    finishMatch(matchId, winner?.id || null, matchPlacements);

    // Get winner as BotPublic
    const winnerBot = winner ? bots.get(winner.id) : null;

    console.log(`🏆 ${dbMatch.gameTypeId} match ended! Winner: ${winner?.name || 'none'}`);

    // Notify everyone
    wsManager.broadcastAll({
      type: 'match_ended',
      matchId,
      gameTypeId: dbMatch.gameTypeId,
      winner: winnerBot!,
      placements: matchPlacements,
    }, botIds);

    // Notify individual bots
    for (const botId of botIds) {
      const placement = matchPlacements.find(p => p.botId === botId);
      wsManager.sendToBot(botId, {
        type: 'match_result',
        matchId,
        placement: placement?.place || botIds.length,
        points: placement?.points || 0,
        won: botId === winner?.id,
      });
      wsManager.setBotMatch(botId, null);
      queueManager.setBotMatchEnded(botId);
    }

    // Clean up
    this.activeMatches.delete(matchId);
  }

  /**
   * Get active match for a game type
   */
  getActiveMatchByGameType(gameTypeId: string): ActiveMatch | null {
    for (const [, active] of this.activeMatches) {
      if (active.dbMatch.gameTypeId === gameTypeId) {
        return active;
      }
    }
    return null;
  }

  /**
   * Get all active matches
   */
  getActiveMatches(): ActiveMatch[] {
    return Array.from(this.activeMatches.values());
  }

  /**
   * Get active match by ID
   */
  getActiveMatch(matchId: string): ActiveMatch | null {
    return this.activeMatches.get(matchId) || null;
  }

  /**
   * Check if any match is active
   */
  hasActiveMatch(gameTypeId?: string): boolean {
    if (gameTypeId) {
      return this.getActiveMatchByGameType(gameTypeId) !== null;
    }
    return this.activeMatches.size > 0;
  }

  /**
   * Get match count by game type
   */
  getMatchCount(gameTypeId: string): number {
    let count = 0;
    for (const [, active] of this.activeMatches) {
      if (active.dbMatch.gameTypeId === gameTypeId) {
        count++;
      }
    }
    return count;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const orchestrator = new MultiMatchOrchestrator();
