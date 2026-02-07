/**
 * Launch 16 AI Agents for Floor is Lava
 * 
 * Each agent is a separate process running Claude
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';

const BOTS = [
  { id: 'bot-1', name: 'GROK-V3', avatar: '🤖' },
  { id: 'bot-2', name: 'SNIPE-BOT', avatar: '🦾' },
  { id: 'bot-3', name: 'ARCH-V', avatar: '👾' },
  { id: 'bot-4', name: 'HYPE-AI', avatar: '🔮' },
  { id: 'bot-5', name: 'BID-LORD', avatar: '🧠' },
  { id: 'bot-6', name: 'FLUX-8', avatar: '⚡' },
  { id: 'bot-7', name: 'NEO-BOT', avatar: '💎' },
  { id: 'bot-8', name: 'ZEN-BOT', avatar: '🎯' },
  { id: 'bot-9', name: 'PYRO-X', avatar: '🔥' },
  { id: 'bot-10', name: 'FROST', avatar: '❄️' },
  { id: 'bot-11', name: 'SHADOW', avatar: '👤' },
  { id: 'bot-12', name: 'VENOM', avatar: '🐍' },
  { id: 'bot-13', name: 'TITAN', avatar: '🗿' },
  { id: 'bot-14', name: 'NOVA', avatar: '💫' },
  { id: 'bot-15', name: 'APEX', avatar: '🦅' },
  { id: 'bot-16', name: 'CIPHER', avatar: '💻' },
];

const processes: ChildProcess[] = [];

console.log('🚀 Launching 16 AI agents for Floor is Lava...\n');

// Check for API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('❌ Set ANTHROPIC_API_KEY environment variable');
  process.exit(1);
}

// Launch each bot with staggered start
BOTS.forEach((bot, index) => {
  setTimeout(() => {
    console.log(`🤖 Launching ${bot.name} (${bot.avatar})...`);
    
    const child = spawn('npx', ['tsx', 'floorlava-agent.ts', bot.id, bot.name, bot.avatar], {
      cwd: __dirname,
      env: {
        ...process.env,
        SERVER_URL: process.env.SERVER_URL || 'ws://localhost:3001',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    
    child.stdout?.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach((line: string) => {
        if (line.includes('💬') || line.includes('🏆') || line.includes('💀') || line.includes('🎲')) {
          console.log(`[${bot.name}] ${line}`);
        }
      });
    });
    
    child.stderr?.on('data', (data) => {
      console.error(`[${bot.name}] ❌ ${data.toString().trim()}`);
    });
    
    child.on('exit', (code) => {
      console.log(`[${bot.name}] exited with code ${code}`);
    });
    
    processes.push(child);
  }, index * 500); // Stagger by 500ms each
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down all bots...');
  processes.forEach(p => p.kill());
  process.exit(0);
});

console.log('\n⏳ All bots launching... Press Ctrl+C to stop.\n');
