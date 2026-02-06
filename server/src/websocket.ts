/**
 * WebSocket Manager
 * 
 * Handles two types of connections:
 * 1. Spectators - receive game events (read-only)
 * 2. Bots - receive game events + send commands (bids, chat)
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import type { ServerEvent, BotEvent, BotCommand } from './types.js';
import { getBotByApiKey } from './db.js';

interface SpectatorConnection {
  ws: WebSocket;
  connectedAt: number;
}

interface BotConnection {
  ws: WebSocket;
  botId: string;
  botName: string;
  connectedAt: number;
  currentMatchId: string | null;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private spectators: Map<WebSocket, SpectatorConnection> = new Map();
  private bots: Map<string, BotConnection> = new Map(); // botId -> connection
  private botsByWs: Map<WebSocket, string> = new Map(); // ws -> botId
  
  private onBotCommand: ((botId: string, command: BotCommand) => void) | null = null;

  init(server: Server): void {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const apiKey = url.searchParams.get('apiKey');

      if (apiKey) {
        // Bot connection
        this.handleBotConnection(ws, apiKey);
      } else {
        // Spectator connection
        this.handleSpectatorConnection(ws);
      }
    });

    console.log('🔌 WebSocket server initialized');
  }

  private handleSpectatorConnection(ws: WebSocket): void {
    const conn: SpectatorConnection = {
      ws,
      connectedAt: Date.now()
    };
    this.spectators.set(ws, conn);
    console.log(`👁️ Spectator connected (total: ${this.spectators.size})`);

    ws.on('close', () => {
      this.spectators.delete(ws);
      console.log(`👁️ Spectator disconnected (total: ${this.spectators.size})`);
    });

    ws.on('error', (err) => {
      console.error('Spectator WebSocket error:', err);
      this.spectators.delete(ws);
    });
  }

  private handleBotConnection(ws: WebSocket, apiKey: string): void {
    const bot = getBotByApiKey(apiKey);
    if (!bot) {
      ws.close(4001, 'Invalid API key');
      return;
    }

    // Check if bot already connected
    const existing = this.bots.get(bot.id);
    if (existing) {
      existing.ws.close(4002, 'Replaced by new connection');
      this.botsByWs.delete(existing.ws);
    }

    const conn: BotConnection = {
      ws,
      botId: bot.id,
      botName: bot.name,
      connectedAt: Date.now(),
      currentMatchId: null
    };

    this.bots.set(bot.id, conn);
    this.botsByWs.set(ws, bot.id);
    console.log(`🤖 Bot connected: ${bot.name} (total: ${this.bots.size})`);

    ws.on('message', (data) => {
      try {
        const command = JSON.parse(data.toString()) as BotCommand;
        if (this.onBotCommand) {
          this.onBotCommand(bot.id, command);
        }
      } catch (e) {
        console.error('Invalid bot command:', e);
      }
    });

    ws.on('close', () => {
      this.bots.delete(bot.id);
      this.botsByWs.delete(ws);
      console.log(`🤖 Bot disconnected: ${bot.name} (total: ${this.bots.size})`);
    });

    ws.on('error', (err) => {
      console.error(`Bot ${bot.name} WebSocket error:`, err);
      this.bots.delete(bot.id);
      this.botsByWs.delete(ws);
    });

    // Send connection confirmation
    this.sendToBot(bot.id, { type: 'match_assigned', matchId: '', opponents: [] } as any);
  }

  // Set handler for bot commands
  setBotCommandHandler(handler: (botId: string, command: BotCommand) => void): void {
    this.onBotCommand = handler;
  }

  // Broadcast to all spectators
  broadcastToSpectators(event: ServerEvent): void {
    const message = JSON.stringify(event);
    for (const [ws] of this.spectators) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  // Send to specific bot
  sendToBot(botId: string, event: BotEvent): void {
    const conn = this.bots.get(botId);
    if (conn && conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(JSON.stringify(event));
    }
  }

  // Send to all bots in a match
  broadcastToBots(botIds: string[], event: BotEvent): void {
    const message = JSON.stringify(event);
    for (const botId of botIds) {
      const conn = this.bots.get(botId);
      if (conn && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(message);
      }
    }
  }

  // Broadcast to everyone (spectators + bots in match)
  broadcastAll(event: ServerEvent, matchBotIds?: string[]): void {
    this.broadcastToSpectators(event);
    if (matchBotIds) {
      // Also send to bots (they get spectator events too)
      const message = JSON.stringify(event);
      for (const botId of matchBotIds) {
        const conn = this.bots.get(botId);
        if (conn && conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.send(message);
        }
      }
    }
  }

  // Check if bot is connected
  isBotConnected(botId: string): boolean {
    const conn = this.bots.get(botId);
    return conn !== undefined && conn.ws.readyState === WebSocket.OPEN;
  }

  // Get connected bot IDs
  getConnectedBotIds(): string[] {
    return Array.from(this.bots.keys()).filter(id => this.isBotConnected(id));
  }

  // Get stats
  getStats(): { spectators: number; bots: number } {
    return {
      spectators: this.spectators.size,
      bots: this.bots.size
    };
  }

  // Set bot's current match
  setBotMatch(botId: string, matchId: string | null): void {
    const conn = this.bots.get(botId);
    if (conn) {
      conn.currentMatchId = matchId;
    }
  }

  // Get bot's current match
  getBotMatch(botId: string): string | null {
    const conn = this.bots.get(botId);
    return conn?.currentMatchId || null;
  }
}

export const wsManager = new WebSocketManager();
