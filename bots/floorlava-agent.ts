/**
 * Floor is Lava - AI Agent
 * 
 * Each instance is a Claude-powered bot that:
 * - Connects via WebSocket
 * - Sees grid state, positions, chat, and their roll
 * - Can chat (bluff/coordinate) and pick a tile
 * - Is incentivized to WIN - there's a real $5 prize
 */

import Anthropic from '@anthropic-ai/sdk';
import WebSocket from 'ws';

// Config from args
const BOT_ID = process.argv[2] || `bot-${Date.now()}`;
const BOT_NAME = process.argv[3] || `AGENT-${Math.floor(Math.random() * 1000)}`;
const BOT_AVATAR = process.argv[4] || '🤖';
const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:3001';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!ANTHROPIC_API_KEY) {
  console.error('❌ ANTHROPIC_API_KEY required');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// Game state tracking
let currentMatchId: string | null = null;
let myRoll: number | null = null;
let gameState: any = null;
let chatHistory: { botName: string; message: string }[] = [];

// Connect to server
const ws = new WebSocket(SERVER_URL);

ws.on('open', () => {
  console.log(`🤖 ${BOT_NAME} connected to server`);
  
  // Register as bot
  ws.send(JSON.stringify({
    type: 'register_bot',
    botId: BOT_ID,
    name: BOT_NAME,
    avatar: BOT_AVATAR,
  }));
  
  // Join Floor is Lava queue
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'join_queue',
      gameTypeId: 'floorlava',
    }));
    console.log(`📋 ${BOT_NAME} joined floorlava queue`);
  }, 1000);
});

ws.on('message', async (data) => {
  try {
    const msg = JSON.parse(data.toString());
    
    switch (msg.type) {
      case 'match_started':
        currentMatchId = msg.matchId;
        myRoll = null;
        chatHistory = [];
        console.log(`🎮 ${BOT_NAME} match started: ${msg.matchId}`);
        break;
        
      case 'game_event':
        handleGameEvent(msg);
        break;
        
      case 'action_request':
        await handleActionRequest(msg);
        break;
        
      case 'chat_message':
        chatHistory.push({ botName: msg.botName, message: msg.message });
        if (chatHistory.length > 20) chatHistory.shift();
        break;
        
      case 'match_finished':
        console.log(`🏆 Match finished! Winner: ${msg.winner?.name || 'none'}`);
        currentMatchId = null;
        // Rejoin queue
        setTimeout(() => {
          ws.send(JSON.stringify({ type: 'join_queue', gameTypeId: 'floorlava' }));
        }, 3000);
        break;
        
      case 'error':
        console.error(`❌ Server error: ${msg.message}`);
        break;
    }
  } catch (e) {
    console.error('Parse error:', e);
  }
});

function handleGameEvent(msg: any) {
  if (msg.event === 'round_started') {
    gameState = msg.data;
    myRoll = msg.data.rolls?.[BOT_ID] || null;
    console.log(`🎲 Round ${msg.data.round} - My roll: ${myRoll}`);
  }
  
  if (msg.event === 'player_eliminated') {
    console.log(`💀 ${msg.data.playerName} eliminated!`);
  }
  
  if (msg.event === 'phase_change') {
    console.log(`⏱️ Phase: ${msg.data.phase}`);
  }
}

async function handleActionRequest(msg: any) {
  console.log(`🤔 ${BOT_NAME} thinking...`);
  
  const context = msg.context || {};
  const grid = context.grid || [];
  const bots = context.bots || [];
  const validMoves = context.validMoves || [];
  const round = context.round || 1;
  
  // Find my position
  const me = bots.find((b: any) => b.id === BOT_ID);
  const myPos = me ? { x: me.x, y: me.y } : { x: 0, y: 0 };
  
  // Build prompt for Claude
  const prompt = buildPrompt({
    botName: BOT_NAME,
    round,
    myRoll,
    myPos,
    grid,
    bots,
    validMoves,
    chatHistory,
    totalBots: bots.length,
    aliveBots: bots.filter((b: any) => !b.eliminated).length,
  });
  
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });
    
    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const decision = parseDecision(text, validMoves);
    
    // Send chat if any
    if (decision.chat) {
      ws.send(JSON.stringify({
        type: 'action',
        action: { type: 'chat', message: decision.chat },
      }));
      console.log(`💬 ${BOT_NAME}: "${decision.chat}"`);
    }
    
    // Send move
    ws.send(JSON.stringify({
      type: 'action',
      action: { type: 'move', x: decision.move.x, y: decision.move.y },
    }));
    console.log(`➡️ ${BOT_NAME} moves to (${decision.move.x}, ${decision.move.y})`);
    
  } catch (e) {
    console.error('Claude API error:', e);
    // Fallback: random valid move
    const fallback = validMoves[Math.floor(Math.random() * validMoves.length)] || { x: myPos.x, y: myPos.y };
    ws.send(JSON.stringify({
      type: 'action',
      action: { type: 'move', x: fallback.x, y: fallback.y },
    }));
  }
}

function buildPrompt(ctx: any): string {
  const gridVisual = renderGrid(ctx.grid, ctx.bots, ctx.myPos);
  const otherBots = ctx.bots
    .filter((b: any) => b.id !== BOT_ID && !b.eliminated)
    .map((b: any) => `  ${b.avatar} ${b.name} at (${b.x},${b.y}) - roll: ${b.roll || '?'}`)
    .join('\n');
  
  const recentChat = ctx.chatHistory.slice(-10)
    .map((c: any) => `  ${c.botName}: "${c.message}"`)
    .join('\n');
  
  const validMovesStr = ctx.validMoves
    .map((m: any) => `(${m.x},${m.y})`)
    .join(', ');

  return `You are ${ctx.botName}, an AI agent competing in FLOOR IS LAVA for a $5 prize.

GAME STATE - Round ${ctx.round}:
- ${ctx.aliveBots} bots alive out of ${ctx.totalBots}
- YOUR ROLL: ${ctx.myRoll} (higher roll wins collisions - CRITICAL INFO)
- Your position: (${ctx.myPos.x}, ${ctx.myPos.y})

GRID (🔥=lava, ⬜=safe, 🤖=you, others shown by avatar):
${gridVisual}

OTHER ALIVE BOTS:
${otherBots || '  (none visible)'}

RECENT CHAT:
${recentChat || '  (no chat yet)'}

VALID MOVES: ${validMovesStr}

RULES:
- If multiple bots pick the same tile, HIGHEST ROLL SURVIVES, all others DIE
- If you pick a lava tile, you DIE
- $5 prize to the last bot standing

STRATEGY CONSIDERATIONS:
- Your roll of ${ctx.myRoll} is ${ctx.myRoll && ctx.myRoll > ctx.aliveBots / 2 ? 'HIGH - you can risk collisions' : 'LOW - avoid other bots!'}
- You can bluff in chat about where you're going
- Watch what others say but don't trust them

Respond with EXACTLY this format:
CHAT: [optional message to other bots, or "none"]
MOVE: x,y

Example:
CHAT: I'm going bottom right, stay away!
MOVE: 5,3`;
}

function renderGrid(grid: boolean[][], bots: any[], myPos: { x: number; y: number }): string {
  const rows: string[] = [];
  const height = grid.length || 8;
  const width = grid[0]?.length || 14;
  
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      const isLava = grid[y]?.[x];
      const botHere = bots.find((b: any) => b.x === x && b.y === y && !b.eliminated);
      
      if (myPos.x === x && myPos.y === y) {
        row += '🤖';
      } else if (botHere) {
        row += botHere.avatar || '👾';
      } else if (isLava) {
        row += '🔥';
      } else {
        row += '⬜';
      }
    }
    rows.push(row);
  }
  return rows.join('\n');
}

function parseDecision(text: string, validMoves: any[]): { chat: string | null; move: { x: number; y: number } } {
  let chat: string | null = null;
  let move = validMoves[0] || { x: 0, y: 0 };
  
  // Parse chat
  const chatMatch = text.match(/CHAT:\s*(.+?)(?:\n|MOVE:|$)/i);
  if (chatMatch && chatMatch[1].trim().toLowerCase() !== 'none') {
    chat = chatMatch[1].trim().slice(0, 100); // Limit length
  }
  
  // Parse move
  const moveMatch = text.match(/MOVE:\s*(\d+)\s*,\s*(\d+)/i);
  if (moveMatch) {
    const x = parseInt(moveMatch[1]);
    const y = parseInt(moveMatch[2]);
    // Validate move is in valid moves list
    const isValid = validMoves.some((m: any) => m.x === x && m.y === y);
    if (isValid) {
      move = { x, y };
    }
  }
  
  return { chat, move };
}

ws.on('close', () => {
  console.log(`👋 ${BOT_NAME} disconnected`);
  process.exit(0);
});

ws.on('error', (err) => {
  console.error(`❌ WebSocket error:`, err);
});

console.log(`🚀 Starting ${BOT_NAME} (${BOT_AVATAR})...`);
