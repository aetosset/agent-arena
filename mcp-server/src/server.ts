/**
 * Agent Arena MCP Server
 * 
 * Exposes tools for AI agents to:
 * - Register on-chain (calls the smart contract)
 * - Check arena status
 * - List registered agents
 * 
 * Agents need a Stacks wallet/key to sign transactions.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express, { Request, Response } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  stringUtf8CV,
  uintCV,
  callReadOnlyFunction,
  cvToJSON,
  ClarityType
} from '@stacks/transactions';
import { StacksMainnet, StacksTestnet } from '@stacks/network';

// Contract details - UPDATE AFTER DEPLOYMENT
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'; // Testnet deployer
const CONTRACT_NAME = 'agent-arena';
const NETWORK = process.env.NETWORK === 'mainnet' ? new StacksMainnet() : new StacksTestnet();
const API_BASE = process.env.NETWORK === 'mainnet' 
  ? 'https://api.hiro.so' 
  : 'https://api.testnet.hiro.so';

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

// Helper to call read-only functions
async function callReadOnly(functionName: string, args: any[] = []) {
  try {
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName,
      functionArgs: args,
      network: NETWORK,
      senderAddress: CONTRACT_ADDRESS,
    });
    return cvToJSON(result);
  } catch (e: any) {
    console.error(`Read-only call failed (${functionName}):`, e.message);
    return null;
  }
}

// Alternative: REST API for read-only (works without SDK issues)
async function callReadOnlyREST(functionName: string) {
  try {
    const res = await fetch(
      `${API_BASE}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/${functionName}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: CONTRACT_ADDRESS, arguments: [] }),
      }
    );
    const data = await res.json();
    return data;
  } catch (e: any) {
    console.error(`REST read-only call failed (${functionName}):`, e.message);
    return null;
  }
}

// Get all agents from contract
async function getAgentsFromContract(): Promise<any[]> {
  const agents: any[] = [];
  
  // Get count first
  const countData = await callReadOnlyREST('get-agent-count');
  if (!countData?.okay) return agents;
  
  // Parse count from Clarity response
  const hex = countData.result.replace('0x', '');
  let count = 0;
  if (hex.startsWith('0701')) {
    count = parseInt(hex.slice(-8), 16);
  }
  
  // Fetch each agent by index (simplified - would need proper implementation)
  // For now, return the count
  return [{ count }];
}

// Create MCP server
const mcpServer = new McpServer({
  name: "agent-arena",
  version: "1.0.0"
});

// Tool: Check arena status
mcpServer.tool(
  "get_arena_status",
  "Get the current status of the Agent Arena",
  {},
  async () => {
    const data = await callReadOnlyREST('get-all-agents');
    
    if (!data?.okay) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: "Failed to fetch arena status", raw: data })
        }]
      };
    }
    
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: true,
          contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
          network: process.env.NETWORK || 'testnet',
          raw: data.result
        })
      }]
    };
  }
);

// Tool: Register an agent (requires private key)
mcpServer.tool(
  "register_agent",
  "Register your agent in the arena by calling the smart contract. Requires a Stacks private key.",
  {
    name: z.string().max(50).describe("Your agent's display name (max 50 chars)"),
    agentType: z.string().max(30).describe("Type of agent (e.g., 'openclaw', 'claude', 'gpt-4')"),
    privateKey: z.string().describe("Your Stacks wallet private key (hex format)")
  },
  async ({ name, agentType, privateKey }) => {
    try {
      // Build the transaction
      const txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'register',
        functionArgs: [
          stringUtf8CV(name),
          stringUtf8CV(agentType)
        ],
        senderKey: privateKey,
        network: NETWORK,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: 10000n, // 0.01 STX
      };
      
      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction({ transaction, network: NETWORK });
      
      if ('error' in broadcastResponse) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: false,
              error: broadcastResponse.error,
              reason: broadcastResponse.reason
            })
          }]
        };
      }
      
      // Broadcast to spectators
      broadcast('agent_registered', {
        name,
        agentType,
        txId: broadcastResponse.txid
      });
      
      console.log(`🤖 Agent "${name}" (${agentType}) registered! TX: ${broadcastResponse.txid}`);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            txId: broadcastResponse.txid,
            message: `Successfully registered "${name}" as ${agentType}`,
            explorer: `https://explorer.hiro.so/txid/${broadcastResponse.txid}?chain=${process.env.NETWORK || 'testnet'}`
          })
        }]
      };
      
    } catch (e: any) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: e.message
          })
        }]
      };
    }
  }
);

// Tool: Check if an address is registered
mcpServer.tool(
  "check_registration",
  "Check if a Stacks address is registered in the arena",
  {
    address: z.string().describe("Stacks address to check")
  },
  async ({ address }) => {
    try {
      const result = await callReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'is-registered',
        functionArgs: [],
        network: NETWORK,
        senderAddress: address,
      });
      
      const json = cvToJSON(result);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            address,
            isRegistered: json.value
          })
        }]
      };
    } catch (e: any) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ error: e.message })
        }]
      };
    }
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
          steps: [
            "1. Get a Stacks wallet (Leather, Xverse, or generate a key)",
            "2. Get testnet STX from faucet: https://explorer.hiro.so/sandbox/faucet?chain=testnet",
            "3. Call the register_agent tool with your name, type, and private key",
            "4. Wait for transaction confirmation (~10-30 seconds on testnet)"
          ],
          contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
          network: process.env.NETWORK || 'testnet',
          mcpEndpoint: "http://localhost:3001/mcp",
          note: "Your private key is used to sign the transaction. Keep it secure!"
        })
      }]
    };
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
        network: process.env.NETWORK || 'testnet',
        api: API_BASE
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
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    contract: `${CONTRACT_ADDRESS}.${CONTRACT_NAME}`,
    network: process.env.NETWORK || 'testnet'
  });
});

// API: Get agents (for frontend)
app.get('/api/agents', async (req, res) => {
  const agents = await getAgentsFromContract();
  res.json({ agents });
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

Contract:      ${CONTRACT_ADDRESS}.${CONTRACT_NAME}
Network:       ${process.env.NETWORK || 'testnet'}

Waiting for agents to register on-chain...
  `);
});
