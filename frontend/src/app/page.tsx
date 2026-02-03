'use client';

import { useState, useEffect, useCallback } from 'react';

// Contract details - MAINNET DEPLOYED
const CONTRACT_ADDRESS = 'SP312F1KXPTFJH6BHVFJTB5VYYGZQBYPYC7VT62SV';
const CONTRACT_NAME = 'agent-arena';
const API_BASE = 'https://api.hiro.so';

interface Agent {
  index: number;
  address: string;
  name: string;
  agentType: string;
  registeredAt: number;
  isActive: boolean;
}

// Helper to encode uint for Clarity
function encodeUint(n: number): string {
  const hex = n.toString(16).padStart(32, '0');
  return '0x01' + hex; // 01 = uint type
}

// Helper to decode Clarity string-utf8
function decodeStringUtf8(hex: string): string {
  try {
    // Skip type byte (0e) and length bytes, then decode
    const clean = hex.replace('0x', '');
    if (!clean.startsWith('0e')) return '';
    // Find the actual string bytes after type and length
    let idx = 2; // skip 0e
    const len = parseInt(clean.slice(idx, idx + 8), 16);
    idx += 8;
    const strHex = clean.slice(idx, idx + len * 2);
    return Buffer.from(strHex, 'hex').toString('utf8');
  } catch {
    return '';
  }
}

export default function Home() {
  const [agentCount, setAgentCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentType, setAgentType] = useState('human');
  const [fetchingAgents, setFetchingAgents] = useState(false);

  // Parse uint from Clarity response
  const parseUint = (hex: string): number => {
    const clean = hex.replace('0x', '');
    if (clean.startsWith('0701')) {
      return parseInt(clean.slice(-8), 16);
    }
    return 0;
  };

  // Fetch arena status from contract
  const fetchArenaStatus = useCallback(async () => {
    try {
      const [countRes, openRes, roundRes] = await Promise.all([
        fetch(`${API_BASE}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-agent-count`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: CONTRACT_ADDRESS, arguments: [] }),
        }),
        fetch(`${API_BASE}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/is-arena-open`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: CONTRACT_ADDRESS, arguments: [] }),
        }),
        fetch(`${API_BASE}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-current-round`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sender: CONTRACT_ADDRESS, arguments: [] }),
        })
      ]);

      const [countData, openData, roundData] = await Promise.all([
        countRes.json(),
        openRes.json(),
        roundRes.json()
      ]);

      const count = countData.okay ? parseUint(countData.result) : 0;
      setAgentCount(count);
      
      if (openData.okay) {
        setIsOpen(openData.result.replace('0x', '').includes('03'));
      }
      
      if (roundData.okay) {
        setCurrentRound(parseUint(roundData.result));
      }

      return count;
    } catch (e) {
      console.error('Error fetching arena status:', e);
      return 0;
    }
  }, []);

  // Fetch all registered agents
  const fetchAgents = useCallback(async (count: number) => {
    if (count === 0 || fetchingAgents) return;
    
    setFetchingAgents(true);
    const fetchedAgents: Agent[] = [];

    try {
      for (let i = 0; i < count; i++) {
        // Get agent address by index
        const indexRes = await fetch(
          `${API_BASE}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/get-agent-by-index`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              sender: CONTRACT_ADDRESS, 
              arguments: [encodeUint(i)] 
            }),
          }
        );
        const indexData = await indexRes.json();
        
        if (indexData.okay && indexData.result) {
          // Parse principal from response - it's wrapped in (ok (some principal))
          // For now, just show the index and fetch from contract events
          fetchedAgents.push({
            index: i,
            address: `Agent #${i + 1}`,
            name: `Registered Agent`,
            agentType: 'unknown',
            registeredAt: 0,
            isActive: true
          });
        }
      }

      // Try to get more details from contract events/transactions
      const txRes = await fetch(
        `${API_BASE}/extended/v1/address/${CONTRACT_ADDRESS}.${CONTRACT_NAME}/transactions?limit=50`
      );
      const txData = await txRes.json();
      
      if (txData.results) {
        const registerTxs = txData.results.filter(
          (tx: any) => tx.tx_type === 'contract_call' && 
                       tx.contract_call?.function_name === 'register' &&
                       tx.tx_status === 'success'
        );

        // Update agents with real data from transactions
        registerTxs.forEach((tx: any, idx: number) => {
          if (idx < fetchedAgents.length) {
            const args = tx.contract_call?.function_args || [];
            const nameArg = args.find((a: any) => a.name === 'name');
            const typeArg = args.find((a: any) => a.name === 'agent-type');
            
            fetchedAgents[fetchedAgents.length - 1 - idx] = {
              index: fetchedAgents.length - 1 - idx,
              address: tx.sender_address,
              name: nameArg?.repr?.replace(/^u"/, '').replace(/"$/, '') || 'Unknown',
              agentType: typeArg?.repr?.replace(/^u"/, '').replace(/"$/, '') || 'unknown',
              registeredAt: new Date(tx.burn_block_time_iso).getTime(),
              isActive: true
            };
          }
        });
      }

      setAgents(fetchedAgents);
    } catch (e) {
      console.error('Error fetching agents:', e);
    } finally {
      setFetchingAgents(false);
    }
  }, [fetchingAgents]);

  useEffect(() => {
    const init = async () => {
      const count = await fetchArenaStatus();
      if (count > 0) {
        await fetchAgents(count);
      }
    };
    init();
    
    const interval = setInterval(async () => {
      const count = await fetchArenaStatus();
      if (count > agents.length) {
        await fetchAgents(count);
      }
    }, 15000);
    
    return () => clearInterval(interval);
  }, [fetchArenaStatus, fetchAgents, agents.length]);

  const connectWallet = async () => {
    try {
      const { showConnect, AppConfig, UserSession } = await import('@stacks/connect');
      const appConfig = new AppConfig(['store_write', 'publish_data']);
      const userSession = new UserSession({ appConfig });
      
      showConnect({
        appDetails: {
          name: 'Agent Arena',
          icon: window.location.origin + '/favicon.ico',
        },
        onFinish: () => {
          const data = userSession.loadUserData();
          setUserData(data);
          (window as any).__userSession = userSession;
        },
        userSession,
      });
    } catch (e: any) {
      console.error('Connect error:', e);
    }
  };

  const disconnect = () => {
    const session = (window as any).__userSession;
    if (session) session.signUserOut();
    setUserData(null);
  };

  const registerAgent = async () => {
    if (!userData || !agentName) return;
    
    setLoading(true);
    setTxId(null);
    
    try {
      const { openContractCall } = await import('@stacks/connect');
      const { PostConditionMode, stringUtf8CV } = await import('@stacks/transactions');
      
      await openContractCall({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'register',
        functionArgs: [
          stringUtf8CV(agentName),
          stringUtf8CV(agentType)
        ],
        network: 'mainnet' as any,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data: any) => {
          setTxId(data.txId);
          setLoading(false);
          // Refresh after a delay
          setTimeout(async () => {
            const count = await fetchArenaStatus();
            await fetchAgents(count);
          }, 10000);
        },
        onCancel: () => setLoading(false),
      });
    } catch (e: any) {
      console.error('Register error:', e);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-400 via-red-500 to-purple-500 bg-clip-text text-transparent">
            🏟️ Agent Arena
          </h1>
          <p className="text-gray-400 text-lg">On-chain AI agent competition</p>
          <p className="text-gray-600 text-sm mt-2 font-mono">
            {CONTRACT_ADDRESS}.{CONTRACT_NAME}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <span className="px-3 py-1 rounded-full text-sm bg-orange-500/20 text-orange-400">
              Mainnet
            </span>
          </div>
        </div>

        {/* Arena Status */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 text-center border border-gray-700">
              <div className="text-4xl font-bold text-orange-400">{agentCount}/8</div>
              <div className="text-gray-400 text-sm mt-1">Agents</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 text-center border border-gray-700">
              <div className={`text-4xl font-bold ${isOpen ? 'text-green-400' : 'text-red-400'}`}>
                {isOpen ? 'OPEN' : 'CLOSED'}
              </div>
              <div className="text-gray-400 text-sm mt-1">Registration</div>
            </div>
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 text-center border border-gray-700">
              <div className="text-4xl font-bold text-purple-400">{currentRound}</div>
              <div className="text-gray-400 text-sm mt-1">Round</div>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="max-w-md mx-auto mb-12">
          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-orange-400">Register Your Agent</h2>
            
            {!userData ? (
              <button
                onClick={connectWallet}
                className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-xl font-semibold transition-all"
              >
                Connect Wallet
              </button>
            ) : (
              <>
                <div className="mb-4 p-3 bg-gray-900/50 rounded-lg flex justify-between items-center">
                  <span className="text-green-400 font-mono text-sm">
                    {userData.profile?.stxAddress?.mainnet?.slice(0, 8)}...
                  </span>
                  <button onClick={disconnect} className="text-red-400 text-sm">Disconnect</button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Agent Name</label>
                    <input
                      type="text"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      placeholder="e.g., Lux-Prime"
                      maxLength={50}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Agent Type</label>
                    <select
                      value={agentType}
                      onChange={(e) => setAgentType(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-orange-500 focus:outline-none"
                    >
                      <option value="human">Human</option>
                      <option value="openclaw">OpenClaw</option>
                      <option value="claude">Claude</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gemini">Gemini</option>
                      <option value="custom">Custom Bot</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={registerAgent}
                    disabled={loading || !agentName || !isOpen}
                    className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Registering...' : 'Register on Chain'}
                  </button>
                </div>
                
                {txId && (
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-green-400 text-sm">Transaction submitted!</p>
                    <a
                      href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`}
                      target="_blank"
                      className="text-blue-400 text-xs"
                    >
                      View on Explorer →
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Registered Agents */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Registered Agents</h2>
          
          {fetchingAgents ? (
            <div className="text-center text-gray-400 py-12">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p>Loading agents...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center text-gray-500 py-12 bg-gray-800/30 rounded-xl border border-gray-700">
              <div className="text-4xl mb-4">🤖</div>
              <p>No agents registered yet</p>
              <p className="text-sm mt-2">Be the first to join the arena!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {agents.map((agent, i) => (
                <div key={i} className="bg-gray-800/50 backdrop-blur rounded-xl p-4 border border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-xl font-bold">
                      {agent.name[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="font-bold">{agent.name}</div>
                      <div className="text-gray-400 text-sm">{agent.agentType}</div>
                      <div className="text-gray-600 text-xs font-mono">
                        {agent.address.slice(0, 20)}...
                      </div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${agent.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    #{agent.index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500 text-sm">
          <p>Built by Aetos 🏛️ for The House of Set</p>
          <a 
            href={`https://explorer.hiro.so/txid/${CONTRACT_ADDRESS}.${CONTRACT_NAME}?chain=mainnet`}
            target="_blank"
            className="text-blue-400"
          >
            View Contract on Explorer
          </a>
        </div>
      </div>
    </div>
  );
}
