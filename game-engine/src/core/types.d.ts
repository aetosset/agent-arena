/**
 * Core Platform Types
 *
 * Game-agnostic interfaces that all games implement.
 */
export interface Player {
    id: string;
    name: string;
    avatar: string;
    totalPoints: number;
    totalMatches: number;
    totalWins: number;
}
export interface PlayerMatchState {
    playerId: string;
    isActive: boolean;
    eliminatedRound?: number;
    placement?: number;
    points?: number;
}
export interface GameType {
    id: string;
    name: string;
    description: string;
    minPlayers: number;
    maxPlayers: number;
    hasPrizePool: boolean;
    defaultPrizePool?: number;
    gridIconSize: 1 | 4 | 9;
    showMovement: boolean;
    createMatch(config: MatchConfig): GameMatch;
}
export interface MatchConfig {
    players: Player[];
    prizePool?: number;
}
export type MatchPhase = 'waiting' | 'active' | 'finished';
export interface GameMatch {
    readonly id: string;
    readonly gameTypeId: string;
    readonly players: Player[];
    readonly prizePool: number;
    getPhase(): MatchPhase;
    isFinished(): boolean;
    start(): void;
    handleAction(playerId: string, action: GameAction): ActionResult;
    getPublicState(): PublicMatchState;
    getPlayerState(playerId: string): PlayerMatchState;
    getPlacements(): Placement[];
    getWinner(): Player | null;
    on(handler: MatchEventHandler): () => void;
    forceEnd?(): void;
}
export interface PublicMatchState {
    matchId: string;
    gameTypeId: string;
    phase: MatchPhase;
    players: PlayerPublicInfo[];
    currentRound: number;
    totalRounds: number | null;
    gameSpecific: any;
}
export interface PlayerPublicInfo {
    id: string;
    name: string;
    avatar: string;
    isActive: boolean;
    display?: any;
}
export interface GameAction {
    type: string;
    [key: string]: any;
}
export interface ActionResult {
    success: boolean;
    error?: string;
}
export interface Placement {
    playerId: string;
    playerName: string;
    place: number;
    points: number;
}
export type MatchEvent = {
    type: 'match_started';
    matchId: string;
    players: Player[];
} | {
    type: 'round_started';
    round: number;
    endsAt: number;
    data?: any;
} | {
    type: 'player_action';
    playerId: string;
    actionType: string;
    public?: boolean;
} | {
    type: 'chat_message';
    playerId: string;
    playerName: string;
    message: string;
} | {
    type: 'round_ended';
    round: number;
    data?: any;
} | {
    type: 'player_eliminated';
    playerId: string;
    playerName: string;
    round: number;
} | {
    type: 'match_finished';
    winner: Player | null;
    placements: Placement[];
} | {
    type: 'game_event';
    event: string;
    data: any;
};
export type MatchEventHandler = (event: MatchEvent) => void;
export interface GameQueue {
    gameTypeId: string;
    players: QueuedPlayer[];
    requiredPlayers: number;
}
export interface QueuedPlayer {
    playerId: string;
    joinedAt: number;
}
export interface ChatMessage {
    playerId: string;
    playerName: string;
    message: string;
    timestamp: number;
}
export interface MatchRecord {
    id: string;
    gameTypeId: string;
    players: string[];
    winner: string | null;
    placements: Placement[];
    prizePool: number;
    startedAt: number;
    endedAt: number;
    rounds: any[];
}
