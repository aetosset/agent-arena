/**
 * Floor is Lava - Match Logic
 */

import { GameMatch, Player, GameEvent } from '../../core/types';
import {
  FloorLavaState,
  FloorLavaConfig,
  FloorLavaPhase,
  DEFAULT_CONFIG,
  GridState,
  BotPosition,
  MoveCommit,
  RoundResult,
  Collision,
  TileState,
  getPrizeDistribution,
} from './types';

export class FloorLavaMatch implements GameMatch {
  public id: string;
  public gameTypeId = 'floorlava';
  public players: Player[] = [];
  public state: FloorLavaState;
  public config: FloorLavaConfig;
  public events: GameEvent[] = [];
  public startedAt?: Date;
  public endedAt?: Date;

  private phaseTimer?: NodeJS.Timeout;
  private eliminationOrder: string[] = []; // Track order of elimination

  constructor(id: string, config: Partial<FloorLavaConfig> = {}) {
    this.id = id;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.state = this.createInitialState();
  }

  private createInitialState(): FloorLavaState {
    return {
      phase: 'waiting',
      round: 0,
      grid: this.createEmptyGrid(),
      botPositions: [],
      commits: [],
      roundHistory: [],
    };
  }

  private createEmptyGrid(): GridState {
    const tiles: TileState[][] = [];
    for (let y = 0; y < this.config.gridHeight; y++) {
      tiles[y] = [];
      for (let x = 0; x < this.config.gridWidth; x++) {
        tiles[y][x] = 'safe';
      }
    }
    return {
      width: this.config.gridWidth,
      height: this.config.gridHeight,
      tiles,
    };
  }

  addPlayer(player: Player): boolean {
    if (this.players.length >= this.config.maxPlayers) return false;
    if (this.state.phase !== 'waiting') return false;
    if (this.players.find(p => p.id === player.id)) return false;

    this.players.push(player);
    this.addEvent('player_joined', { playerId: player.id, name: player.name });

    // Auto-start if we hit max players
    if (this.players.length === this.config.maxPlayers) {
      this.start();
    }

    return true;
  }

  removePlayer(playerId: string): boolean {
    const idx = this.players.findIndex(p => p.id === playerId);
    if (idx === -1) return false;

    this.players.splice(idx, 1);
    this.addEvent('player_left', { playerId });
    return true;
  }

  canStart(): boolean {
    return (
      this.state.phase === 'waiting' &&
      this.players.length >= this.config.minPlayers
    );
  }

  start(): void {
    if (!this.canStart()) return;

    this.startedAt = new Date();
    this.state.phase = 'starting';
    this.addEvent('match_starting', { playerCount: this.players.length });

    // Initialize grid based on player count
    this.initializeGrid();

    // Spawn bots on random safe tiles
    this.spawnBots();

    // Start first round after brief delay
    setTimeout(() => this.startRound(), 2000);
  }

  private initializeGrid(): void {
    const totalTiles = this.config.gridWidth * this.config.gridHeight;
    const safeTileCount = Math.floor((this.players.length / this.config.maxPlayers) * totalTiles);
    const lavaTileCount = totalTiles - safeTileCount;

    // Start with all safe
    this.state.grid = this.createEmptyGrid();

    // Randomly convert tiles to lava
    const allCoords: { x: number; y: number }[] = [];
    for (let y = 0; y < this.config.gridHeight; y++) {
      for (let x = 0; x < this.config.gridWidth; x++) {
        allCoords.push({ x, y });
      }
    }

    // Shuffle and pick lava tiles
    this.shuffle(allCoords);
    for (let i = 0; i < lavaTileCount; i++) {
      const { x, y } = allCoords[i];
      this.state.grid.tiles[y][x] = 'lava';
    }

    this.addEvent('grid_initialized', {
      safeTiles: safeTileCount,
      lavaTiles: lavaTileCount,
    });
  }

  private spawnBots(): void {
    const safeTiles = this.getSafeTiles();
    this.shuffle(safeTiles);

    this.state.botPositions = this.players.map((player, idx) => ({
      odId: player.id,
      x: safeTiles[idx].x,
      y: safeTiles[idx].y,
      eliminated: false,
    }));

    this.addEvent('bots_spawned', {
      positions: this.state.botPositions.map(b => ({
        botId: b.odId,
        x: b.x,
        y: b.y,
      })),
    });
  }

  private getSafeTiles(): { x: number; y: number }[] {
    const safe: { x: number; y: number }[] = [];
    for (let y = 0; y < this.config.gridHeight; y++) {
      for (let x = 0; x < this.config.gridWidth; x++) {
        if (this.state.grid.tiles[y][x] === 'safe') {
          safe.push({ x, y });
        }
      }
    }
    return safe;
  }

  private getAliveBots(): BotPosition[] {
    return this.state.botPositions.filter(b => !b.eliminated);
  }

  private startRound(): void {
    this.state.round++;
    this.state.commits = [];
    this.addEvent('round_start', { round: this.state.round });

    // Phase 1: Lava Spread
    this.startLavaSpread();
  }

  private startLavaSpread(): void {
    this.state.phase = 'lava_spread';
    this.state.phaseEndsAt = Date.now() + this.config.lavaSpreadDuration;

    const aliveBots = this.getAliveBots();
    const newLavaTiles: { x: number; y: number }[] = [];

    // All bot positions become lava
    for (const bot of aliveBots) {
      if (this.state.grid.tiles[bot.y][bot.x] === 'safe') {
        this.state.grid.tiles[bot.y][bot.x] = 'lava';
        newLavaTiles.push({ x: bot.x, y: bot.y });
      }
    }

    // 50% of remaining safe tiles become lava
    let safeTiles = this.getSafeTiles();
    const tilesToConvert = Math.max(1, Math.floor(safeTiles.length * this.config.lavaShrinkRate));

    this.shuffle(safeTiles);
    for (let i = 0; i < tilesToConvert && i < safeTiles.length; i++) {
      const { x, y } = safeTiles[i];
      this.state.grid.tiles[y][x] = 'lava';
      newLavaTiles.push({ x, y });
    }

    this.addEvent('lava_spread', {
      round: this.state.round,
      newLavaTiles,
      safeTilesRemaining: this.getSafeTiles().length,
    });

    // Check if any bots are now standing on lava (edge case - shouldn't happen normally)
    this.checkForLavaDeaths();

    this.phaseTimer = setTimeout(() => this.startDeliberation(), this.config.lavaSpreadDuration);
  }

  private checkForLavaDeaths(): void {
    for (const bot of this.getAliveBots()) {
      if (this.state.grid.tiles[bot.y][bot.x] === 'lava') {
        this.eliminateBot(bot.odId, 'lava');
      }
    }
  }

  private startDeliberation(): void {
    // Check win condition before deliberation
    if (this.checkWinCondition()) return;

    this.state.phase = 'deliberation';
    this.state.phaseEndsAt = Date.now() + this.config.deliberationDuration;

    this.addEvent('deliberation_start', {
      round: this.state.round,
      duration: this.config.deliberationDuration,
      safeTiles: this.getSafeTiles().length,
      aliveBots: this.getAliveBots().length,
    });

    this.phaseTimer = setTimeout(() => this.startCommit(), this.config.deliberationDuration);
  }

  private startCommit(): void {
    this.state.phase = 'commit';
    this.state.phaseEndsAt = Date.now() + this.config.commitDuration;

    this.addEvent('commit_start', {
      round: this.state.round,
      duration: this.config.commitDuration,
    });

    this.phaseTimer = setTimeout(() => this.resolveRound(), this.config.commitDuration);
  }

  // Called by bots to submit their move
  submitMove(botId: string, targetX: number, targetY: number): boolean {
    if (this.state.phase !== 'commit' && this.state.phase !== 'deliberation') {
      return false;
    }

    const bot = this.state.botPositions.find(b => b.odId === botId);
    if (!bot || bot.eliminated) return false;

    // Remove any existing commit for this bot
    this.state.commits = this.state.commits.filter(c => c.visiblebotId !== botId);

    // Add new commit
    this.state.commits.push({
      visiblebotId: botId,
      targetX,
      targetY,
      timestamp: Date.now(),
    });

    this.addEvent('move_committed', { botId, targetX, targetY });
    return true;
  }

  private resolveRound(): void {
    this.state.phase = 'resolve';
    this.state.phaseEndsAt = Date.now() + this.config.resolveDuration;

    const aliveBots = this.getAliveBots();
    const safeTiles = this.getSafeTiles();
    const moves: Record<string, { from: { x: number; y: number }; to: { x: number; y: number } }> = {};
    const eliminations: { botId: string; reason: 'collision' | 'lava' | 'invalid_move' }[] = [];
    const collisions: Collision[] = [];

    // Assign random moves to bots that didn't commit
    for (const bot of aliveBots) {
      const commit = this.state.commits.find(c => c.visiblebotId === bot.odId);
      if (!commit && safeTiles.length > 0) {
        const randomTile = safeTiles[Math.floor(Math.random() * safeTiles.length)];
        this.state.commits.push({
          visiblebotId: bot.odId,
          targetX: randomTile.x,
          targetY: randomTile.y,
          timestamp: Date.now(),
        });
      }
    }

    // Group commits by destination tile
    const tileCommits: Record<string, MoveCommit[]> = {};
    for (const commit of this.state.commits) {
      const bot = this.state.botPositions.find(b => b.odId === commit.visiblebotId);
      if (!bot || bot.eliminated) continue;

      const key = `${commit.targetX},${commit.targetY}`;
      if (!tileCommits[key]) tileCommits[key] = [];
      tileCommits[key].push(commit);

      // Record the move
      moves[commit.visiblebotId] = {
        from: { x: bot.x, y: bot.y },
        to: { x: commit.targetX, y: commit.targetY },
      };
    }

    // Process each destination tile
    for (const [key, commits] of Object.entries(tileCommits)) {
      const [xStr, yStr] = key.split(',');
      const x = parseInt(xStr);
      const y = parseInt(yStr);

      // Check if tile is lava (invalid move)
      if (this.state.grid.tiles[y]?.[x] !== 'safe') {
        for (const commit of commits) {
          this.eliminateBot(commit.visiblebotId, 'invalid_move');
          eliminations.push({ botId: commit.visiblebotId, reason: 'invalid_move' });
        }
        continue;
      }

      // Single bot - safe move
      if (commits.length === 1) {
        const bot = this.state.botPositions.find(b => b.odId === commits[0].visiblebotId);
        if (bot) {
          bot.x = x;
          bot.y = y;
        }
        continue;
      }

      // Multiple bots - collision!
      const collision = this.resolveCollision(commits, x, y);
      collisions.push(collision);

      // Move winner to tile
      const winner = this.state.botPositions.find(b => b.odId === collision.winner);
      if (winner) {
        winner.x = x;
        winner.y = y;
      }

      // Eliminate losers
      for (const loserId of collision.losers) {
        this.eliminateBot(loserId, 'collision');
        eliminations.push({ botId: loserId, reason: 'collision' });
      }
    }

    // Record round result
    const roundResult: RoundResult = {
      round: this.state.round,
      lavaSpread: [], // Already recorded in lava_spread event
      moves,
      collisions,
      eliminations,
      survivingBots: this.getAliveBots().map(b => b.odId),
      safeTilesRemaining: this.getSafeTiles().length,
    };
    this.state.roundHistory.push(roundResult);

    this.addEvent('round_resolved', roundResult);

    // Check win condition
    this.phaseTimer = setTimeout(() => {
      if (!this.checkWinCondition()) {
        this.startRound();
      }
    }, this.config.resolveDuration);
  }

  private resolveCollision(commits: MoveCommit[], x: number, y: number): Collision {
    const botIds = commits.map(c => c.visiblebotId);
    const n = botIds.length;

    // Assign random unique numbers 1 to N
    const numbers = Array.from({ length: n }, (_, i) => i + 1);
    this.shuffle(numbers);

    const rolls: Record<string, number> = {};
    botIds.forEach((id, idx) => {
      rolls[id] = numbers[idx];
    });

    // Highest number wins
    const winnerId = botIds.reduce((a, b) => (rolls[a] > rolls[b] ? a : b));
    const losers = botIds.filter(id => id !== winnerId);

    return {
      tile: { x, y },
      bots: botIds,
      winner: winnerId,
      losers,
      rolls,
    };
  }

  private eliminateBot(botId: string, reason: 'collision' | 'lava' | 'invalid_move'): void {
    const bot = this.state.botPositions.find(b => b.odId === botId);
    if (!bot || bot.eliminated) return;

    bot.eliminated = true;
    bot.eliminatedRound = this.state.round;
    bot.eliminationReason = reason;

    // Track elimination order (first eliminated = last place)
    this.eliminationOrder.push(botId);

    this.addEvent('bot_eliminated', {
      botId,
      reason,
      round: this.state.round,
    });
  }

  private checkWinCondition(): boolean {
    const aliveBots = this.getAliveBots();

    if (aliveBots.length <= 1) {
      this.state.phase = 'finished';
      this.endedAt = new Date();

      if (aliveBots.length === 1) {
        this.state.winner = aliveBots[0].odId;
      }

      // Calculate placements (reverse elimination order, add winner at front)
      const placements = [...this.eliminationOrder].reverse();
      if (this.state.winner) {
        placements.unshift(this.state.winner);
      }
      this.state.placements = placements;

      this.addEvent('match_finished', {
        winner: this.state.winner,
        placements: this.state.placements,
        rounds: this.state.round,
        prizeDistribution: getPrizeDistribution(this.players.length),
      });

      return true;
    }

    return false;
  }

  // Chat message from bot
  chat(botId: string, message: string): void {
    const bot = this.state.botPositions.find(b => b.odId === botId);
    if (!bot || bot.eliminated) return;

    const player = this.players.find(p => p.id === botId);

    this.addEvent('chat', {
      botId,
      name: player?.name || botId,
      message,
      round: this.state.round,
      phase: this.state.phase,
    });
  }

  private addEvent(type: string, data: Record<string, unknown>): void {
    this.events.push({
      type,
      data,
      timestamp: new Date(),
    });
  }

  private shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  getState(): FloorLavaState {
    // Return state with commits hidden during commit phase
    if (this.state.phase === 'commit') {
      return {
        ...this.state,
        commits: [], // Hide commits until resolve
      };
    }
    return this.state;
  }

  getPublicState(): FloorLavaState {
    return this.getState();
  }

  isFinished(): boolean {
    return this.state.phase === 'finished';
  }

  getWinner(): Player | null {
    if (!this.state.winner) return null;
    return this.players.find(p => p.id === this.state.winner) || null;
  }

  getPlacements(): Player[] {
    if (!this.state.placements) return [];
    return this.state.placements
      .map(id => this.players.find(p => p.id === id))
      .filter((p): p is Player => p !== undefined);
  }

  cleanup(): void {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
    }
  }
}
