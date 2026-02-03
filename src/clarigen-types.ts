
import type { TypedAbiArg, TypedAbiFunction, TypedAbiMap, TypedAbiVariable, Response } from '@clarigen/core';

export const contracts = {
  agentArena: {
  "functions": {
    closeRegistration: {"name":"close-registration","access":"public","args":[],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[], Response<boolean, bigint>>,
    register: {"name":"register","access":"public","args":[{"name":"name","type":{"string-utf8":{"length":50}}},{"name":"agent-type","type":{"string-utf8":{"length":30}}}],"outputs":{"type":{"response":{"ok":{"tuple":[{"name":"index","type":"uint128"},{"name":"total","type":"uint128"}]},"error":"uint128"}}}} as TypedAbiFunction<[name: TypedAbiArg<string, "name">, agentType: TypedAbiArg<string, "agentType">], Response<{
  "index": bigint;
  "total": bigint;
}, bigint>>,
    resetArena: {"name":"reset-arena","access":"public","args":[],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[], Response<boolean, bigint>>,
    startRound: {"name":"start-round","access":"public","args":[],"outputs":{"type":{"response":{"ok":"uint128","error":"uint128"}}}} as TypedAbiFunction<[], Response<bigint, bigint>>,
    unregister: {"name":"unregister","access":"public","args":[],"outputs":{"type":{"response":{"ok":"bool","error":"uint128"}}}} as TypedAbiFunction<[], Response<boolean, bigint>>,
    getAgent: {"name":"get-agent","access":"read_only","args":[{"name":"who","type":"principal"}],"outputs":{"type":{"response":{"ok":{"optional":{"tuple":[{"name":"agent-type","type":{"string-utf8":{"length":30}}},{"name":"is-active","type":"bool"},{"name":"name","type":{"string-utf8":{"length":50}}},{"name":"registered-at","type":"uint128"}]}},"error":"none"}}}} as TypedAbiFunction<[who: TypedAbiArg<string, "who">], Response<{
  "agentType": string;
  "isActive": boolean;
  "name": string;
  "registeredAt": bigint;
} | null, null>>,
    getAgentByIndex: {"name":"get-agent-by-index","access":"read_only","args":[{"name":"index","type":"uint128"}],"outputs":{"type":{"response":{"ok":{"optional":"principal"},"error":"none"}}}} as TypedAbiFunction<[index: TypedAbiArg<number | bigint, "index">], Response<string | null, null>>,
    getAgentCount: {"name":"get-agent-count","access":"read_only","args":[],"outputs":{"type":{"response":{"ok":"uint128","error":"none"}}}} as TypedAbiFunction<[], Response<bigint, null>>,
    getAllAgents: {"name":"get-all-agents","access":"read_only","args":[],"outputs":{"type":{"response":{"ok":{"tuple":[{"name":"count","type":"uint128"},{"name":"is-open","type":"bool"},{"name":"round","type":"uint128"}]},"error":"none"}}}} as TypedAbiFunction<[], Response<{
  "count": bigint;
  "isOpen": boolean;
  "round": bigint;
}, null>>,
    getCurrentRound: {"name":"get-current-round","access":"read_only","args":[],"outputs":{"type":{"response":{"ok":"uint128","error":"none"}}}} as TypedAbiFunction<[], Response<bigint, null>>,
    isArenaOpen: {"name":"is-arena-open","access":"read_only","args":[],"outputs":{"type":{"response":{"ok":"bool","error":"none"}}}} as TypedAbiFunction<[], Response<boolean, null>>,
    isRegistered: {"name":"is-registered","access":"read_only","args":[{"name":"who","type":"principal"}],"outputs":{"type":"bool"}} as TypedAbiFunction<[who: TypedAbiArg<string, "who">], boolean>
  },
  "maps": {
    agentByIndex: {"name":"agent-by-index","key":"uint128","value":"principal"} as TypedAbiMap<number | bigint, string>,
    agents: {"name":"agents","key":"principal","value":{"tuple":[{"name":"agent-type","type":{"string-utf8":{"length":30}}},{"name":"is-active","type":"bool"},{"name":"name","type":{"string-utf8":{"length":50}}},{"name":"registered-at","type":"uint128"}]}} as TypedAbiMap<string, {
  "agentType": string;
  "isActive": boolean;
  "name": string;
  "registeredAt": bigint;
}>
  },
  "variables": {
    CONTRACT_OWNER: {
  name: 'CONTRACT_OWNER',
  type: 'principal',
  access: 'constant'
} as TypedAbiVariable<string>,
    ERR_ALREADY_REGISTERED: {
  name: 'ERR_ALREADY_REGISTERED',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_ARENA_FULL: {
  name: 'ERR_ARENA_FULL',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_INVALID_NAME: {
  name: 'ERR_INVALID_NAME',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    ERR_NOT_REGISTERED: {
  name: 'ERR_NOT_REGISTERED',
  type: {
    response: {
      ok: 'none',
      error: 'uint128'
    }
  },
  access: 'constant'
} as TypedAbiVariable<Response<null, bigint>>,
    MAX_AGENTS: {
  name: 'MAX_AGENTS',
  type: 'uint128',
  access: 'constant'
} as TypedAbiVariable<bigint>,
    agentCount: {
  name: 'agent-count',
  type: 'uint128',
  access: 'variable'
} as TypedAbiVariable<bigint>,
    arenaOpen: {
  name: 'arena-open',
  type: 'bool',
  access: 'variable'
} as TypedAbiVariable<boolean>,
    currentRound: {
  name: 'current-round',
  type: 'uint128',
  access: 'variable'
} as TypedAbiVariable<bigint>
  },
  constants: {
  CONTRACT_OWNER: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  ERR_ALREADY_REGISTERED: {
    isOk: false,
    value: 100n
  },
  ERR_ARENA_FULL: {
    isOk: false,
    value: 102n
  },
  ERR_INVALID_NAME: {
    isOk: false,
    value: 103n
  },
  ERR_NOT_REGISTERED: {
    isOk: false,
    value: 101n
  },
  MAX_AGENTS: 8n,
  agentCount: 0n,
  arenaOpen: true,
  currentRound: 0n
},
  "non_fungible_tokens": [
    
  ],
  "fungible_tokens":[],"epoch":"Epoch33","clarity_version":"Clarity4",
  contractName: 'agent-arena',
  }
} as const;

export const accounts = {"deployer":{"address":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM","balance":"100000000000000"},"faucet":{"address":"STNHKEPYEPJ8ET55ZZ0M5A34J0R3N5FM2CMMMAZ6","balance":"100000000000000"},"wallet_1":{"address":"ST1SJ3DTE5DN7X54YDH5D64R3BCB6A2AG2ZQ8YPD5","balance":"100000000000000"},"wallet_2":{"address":"ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG","balance":"100000000000000"},"wallet_3":{"address":"ST2JHG361ZXG51QTKY2NQCVBPPRRE2KZB1HR05NNC","balance":"100000000000000"},"wallet_4":{"address":"ST2NEB84ASENDXKYGJPQW86YXQCEFEX2ZQPG87ND","balance":"100000000000000"},"wallet_5":{"address":"ST2REHHS5J3CERCRBEPMGH7921Q6PYKAADT7JP2VB","balance":"100000000000000"},"wallet_6":{"address":"ST3AM1A56AK2C1XAFJ4115ZSV26EB49BVQ10MGCS0","balance":"100000000000000"},"wallet_7":{"address":"ST3PF13W7Z0RRM42A8VZRVFQ75SV1K26RXEP8YGKJ","balance":"100000000000000"},"wallet_8":{"address":"ST3NBRSFKX28FQ2ZJ1MAKX58HKHSDGNV5N7R21XCP","balance":"100000000000000"}} as const;

export const identifiers = {"agentArena":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.agent-arena"} as const

export const simnet = {
  accounts,
  contracts,
  identifiers,
} as const;


export const deployments = {"agentArena":{"devnet":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.agent-arena","simnet":"ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.agent-arena","testnet":null,"mainnet":null}} as const;

export const project = {
  contracts,
  deployments,
} as const;
  