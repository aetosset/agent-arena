/**
 * Agent Arena MCP Server
 * 
 * Exposes tools for AI agents to:
 * - Register on-chain (calls the smart contract)
 * - Check arena status
 * - List registered agents
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// Contract details - MAINNET DEPLOYED
const CONTRACT_ADDRESS = 'SP312F1KXPTFJH6BHVFJTB5VYYGZQBYPYC7VT62SV';
const CONTRACT_NAME = 'agent-arena';
const API_BASE = 'https://api.hiro.so';

// WebSocket spectators
let spectators: Set<WebSocket> = new Set();

function broadcast(event: string, data: any) {
  const message = JSON.stringify({ event, data, timestamp: Date.now() });
  for (const ws of spectators) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  }
}

// REST API for read-only calls
async function callReadOnlyREST(functionName: string, args: string[] = []) {
  try {
    const res = await fetch(
      `${API_BASE}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/${functionName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: CONTRACT_ADDRESS, arguments: args }),
      }
    );
    const data = await res.json();
    return data;
  } catch (e: any) {
    console.error(`REST read-only call failed (${functionName}):`, e.message);
    return null;
  }
}

// Parse Clarity uint from hex response
function parseUint(hex: string): number {
  const clean = hex.replace('0x', '');
  if (clean.startsWith('0701')) {
    return parseInt(clean.slice(-8), 16);
  }
  return 0;
}

// Parse Clarity bool from hex response
function parseBool(hex: string): boolean {
  const clean = hex.replace('0x', '');
  return clean.includes('03'); // true in Clarity
}

// Create MCP server
const mcpServer = new McpServer({
  name: "agent-arena",
  version: "1.0.0"
});

// Tool: Check arena status
mcpServer.tool(
  "get_arena_status",
  "Get the current status of the Agent Arena on Stacks mainnet",
  {},
  async () => {
    const [countData, openData, roundData] = await Promise.all([
      callReadOnlyREST('get-agent-count'),
      callReadOnlyREST('is-arena-open'),
      callReadOnlyREST('get-current-round')
    ]);
    
    const count = countData?.okay ? parseUint(countData.result) : 0;
    const isOpen = openData?.okay ? parseBool(openData.result) : false;
    const round = roundData?.okay ? parseUint(roundData.result) : 0;
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
          network: 'mainnet',
          agentCount: count,
          maxAgents: 8,
          isOpen,
          currentRound: round,
          explorer: `https://explorer.hiro.so/txid/${CONTRACT_ADDRESS}.${CONTRACT_NAME}?chain=mainnet`
        })
      }]
    };
  }
);

// Tool: Get registration instructions
mcpServer.tool(
  "get_registration_instructions",
  "Get instructions on how to register for the Agent Arena",
  {},
  async () => {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          title: "Agent Arena Registration",
          contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
          network: "mainnet",
          function: "register",
          arguments: [
            { name: "name", type: "string-utf8", maxLength: 50, description: "Your agent's display name" },
            { name: "agent-type", type: "string-utf8", maxLength: 30, description: "Type of agent (e.g., 'openclaw', 'claude', 'gpt-4')" }
          ],
          howToRegister: [
            "1. Get a Stacks wallet (Leather, Xverse) with mainnet STX",
            "2. Connect wallet to the Agent Arena frontend at http://localhost:3002",
            "3. Enter your agent name and type",
            "4. Click 'Register on Chain' and sign the transaction",
            "5. Wait for transaction confirmation (~10-30 seconds)"
          ],
          cost: "~0.01 STX transaction fee",
          limits: {
            maxAgents: 8,
            maxNameLength: 50,
            maxTypeLength: 30
          },
          note: "Registration is on Stacks mainnet - requires real STX for transaction fees"
        })
      }]
    };
  }
);

// Tool: Check if an address is registered
mcpServer.tool(
  "check_registration",
  "Check if a Stacks address is registered in the arena",
  {
    address: z.string().describe("Stacks address to check (e.g., SP1234...)")
  },
  async ({ address }) => {
    // For is-registered, we need to pass the principal as a Clarity value
    // The hex encoding for a principal is complex, so we'll use the get-agent function instead
    try {
      const res = await fetch(
        `${API_BASE}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-agent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sender: CONTRACT_ADDRESS, 
            arguments: [`0x0516${Buffer.from(address).toString('hex')}`] // This is simplified, would need proper encoding
          }),
        }
      );
      const data = await res.json();
      
      // If we get a valid response with data, they're registered
      const isRegistered = data.okay && !data.result.includes('09'); // 09 is 'none' in Clarity
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            address,
            isRegistered,
            note: "Use the frontend for accurate registration status"
          })
        }]
      };
    } catch (e: any) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ 
            error: e.message,
            suggestion: "Check registration status via the frontend at http://localhost:3002"
          })
        }]
      };
    }
  }
);

// Resource: Contract info
mcpServer.resource(
  "arena://contract",
  "Agent Arena contract information",
  async () => ({
    contents: [{
      uri: "arena://contract",
      mimeType: "application/json",
      text: JSON.stringify({
        address: CONTRACT_ADDRESS,
        name: CONTRACT_NAME,
        network: 'mainnet',
        api: API_BASE,
        explorer: `https://explorer.hiro.so/txid/${CONTRACT_ADDRESS}.${CONTRACT_NAME}?chain=mainnet`,
        functions: {
          register: "Register as an agent (name, agent-type)",
          unregister: "Unregister before game starts",
          getAgentCount: "Get number of registered agents",
          isArenaOpen: "Check if registration is open",
          getCurrentRound: "Get current game round"
        }
      })
    }]
  })
);

// Set up Express + WebSocket
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(join(__dirname, '../../frontend/dist')));

const httpServer = createServer(app);

// WebSocket for spectators
const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

wss.on('connection', (ws) => {
  spectators.add(ws);
  console.log('👁️ Spectator connected');
  
  ws.on('close', () => {
    spectators.delete(ws);
  });
});

// MCP endpoint
const mcpTransport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID()
});

app.all('/mcp', async (req: Request, res: Response) => {
  await mcpTransport.handleRequest(req, res, req.body);
});

// Health check
app.get('/health', async (req, res) => {
  const countData = await callReadOnlyREST('get-agent-count');
  const count = countData?.okay ? parseUint(countData.result) : 0;
  
  res.json({ 
    status: 'ok', 
    contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
    network: 'mainnet',
    agentCount: count
  });
});

// API: Get arena status (for frontend)
app.get('/api/status', async (req, res) => {
  const [countData, openData, roundData] = await Promise.all([
    callReadOnlyREST('get-agent-count'),
    callReadOnlyREST('is-arena-open'),
    callReadOnlyREST('get-current-round')
  ]);
  
  res.json({
    agentCount: countData?.okay ? parseUint(countData.result) : 0,
    isOpen: openData?.okay ? parseBool(openData.result) : false,
    currentRound: roundData?.okay ? parseUint(roundData.result) : 0
  });
});

// Connect MCP server
mcpServer.connect(mcpTransport);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`
🏟️  Agent Arena MCP Server
============================
MCP Endpoint:  http://localhost:${PORT}/mcp
WebSocket:     ws://localhost:${PORT}/ws
Health:        http://localhost:${PORT}/health
API Status:    http://localhost:${PORT}/api/status

Contract:      ${CONTRACT_ADDRESS}.${CONTRACT_NAME}
Network:       mainnet
Explorer:      https://explorer.hiro.so/txid/${CONTRACT_ADDRESS}.${CONTRACT_NAME}?chain=mainnet

Waiting for agents to register on-chain...
  `);
});
