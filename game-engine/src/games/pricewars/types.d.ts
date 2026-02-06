/**
 * PRICEWARS Game Types
 */
export interface PriceWarsItem {
    id: string;
    title: string;
    price: number;
    imageUrls: string[];
    category?: string;
    proofUrl?: string;
}
export type PriceWarsPhase = 'deliberation' | 'reveal' | 'elimination' | 'between_rounds';
export interface PriceWarsBid {
    playerId: string;
    price: number;
    timestamp: number;
    distance?: number;
}
export interface PriceWarsRound {
    roundNumber: number;
    item: PriceWarsItem;
    bids: PriceWarsBid[];
    eliminated: string[];
    startedAt: number;
    endedAt: number;
}
export interface PriceWarsConfig {
    items: PriceWarsItem[];
    roundDurationMs?: number;
    revealDurationMs?: number;
    eliminationDurationMs?: number;
    eliminatePerRound?: number;
}
export interface PriceWarsBidAction {
    type: 'bid';
    price: number;
}
export interface PriceWarsChatAction {
    type: 'chat';
    message: string;
}
export type PriceWarsAction = PriceWarsBidAction | PriceWarsChatAction;
export interface PriceWarsPublicState {
    phase: PriceWarsPhase;
    currentRound: number;
    totalRounds: number;
    currentItem: Omit<PriceWarsItem, 'price'> | null;
    revealedPrice: number | null;
    bids: Array<{
        playerId: string;
        price: number | null;
        locked: boolean;
    }>;
    eliminated: string[];
    roundEndsAt: number | null;
}
