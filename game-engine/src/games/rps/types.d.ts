/**
 * Rock Paper Scissors Game Types
 */
export type RPSChoice = 'rock' | 'paper' | 'scissors';
export type RPSPhase = 'throwing' | 'reveal' | 'between_rounds';
export interface RPSThrow {
    playerId: string;
    choice: RPSChoice;
    timestamp: number;
}
export interface RPSRound {
    roundNumber: number;
    throws: {
        [playerId: string]: RPSChoice;
    };
    winner: string | null;
    isDraw: boolean;
    startedAt: number;
    endedAt: number;
}
export interface RPSConfig {
    roundsToWin?: number;
    throwDurationMs?: number;
    revealDurationMs?: number;
    betweenRoundsDurationMs?: number;
}
export interface RPSThrowAction {
    type: 'throw';
    choice: RPSChoice;
}
export interface RPSChatAction {
    type: 'chat';
    message: string;
}
export type RPSAction = RPSThrowAction | RPSChatAction;
export interface RPSPublicState {
    phase: RPSPhase;
    currentRound: number;
    roundsToWin: number;
    scores: {
        [playerId: string]: number;
    };
    currentThrows: {
        [playerId: string]: {
            hasThrown: boolean;
            choice: RPSChoice | null;
        };
    };
    lastRoundWinner: string | null;
    lastRoundDraw: boolean;
    roundEndsAt: number | null;
}
export declare function getWinner(choice1: RPSChoice, choice2: RPSChoice): 'player1' | 'player2' | 'draw';
