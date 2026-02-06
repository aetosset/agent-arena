/**
 * PRICEWARS Match Implementation
 */
import { BaseMatch } from '../../core/base-match.js';
const DEFAULT_ROUND_DURATION = 15000;
const DEFAULT_REVEAL_DURATION = 4000;
const DEFAULT_ELIMINATION_DURATION = 4000;
const DEFAULT_ELIMINATE_PER_ROUND = 2;
export class PriceWarsMatch extends BaseMatch {
    items;
    currentRound = 0;
    gamePhase = 'deliberation';
    currentItem = null;
    bids = new Map();
    roundResults = [];
    eliminationOrder = [];
    roundStartedAt = 0;
    roundTimer = null;
    // Config
    roundDurationMs;
    revealDurationMs;
    eliminationDurationMs;
    eliminatePerRound;
    constructor(players, prizePool, config) {
        super('pricewars', players, prizePool);
        if (config.items.length < 1) {
            throw new Error('PRICEWARS requires at least 1 item');
        }
        this.items = [...config.items];
        this.roundDurationMs = config.roundDurationMs ?? DEFAULT_ROUND_DURATION;
        this.revealDurationMs = config.revealDurationMs ?? DEFAULT_REVEAL_DURATION;
        this.eliminationDurationMs = config.eliminationDurationMs ?? DEFAULT_ELIMINATION_DURATION;
        this.eliminatePerRound = config.eliminatePerRound ?? DEFAULT_ELIMINATE_PER_ROUND;
    }
    // ============ LIFECYCLE ============
    start() {
        if (this.phase !== 'waiting') {
            throw new Error('Match already started');
        }
        this.phase = 'active';
        this.startedAt = Date.now();
        this.emit({
            type: 'match_started',
            matchId: this.id,
            players: this.players,
        });
        this.startNextRound();
    }
    startNextRound() {
        const activePlayers = this.getActivePlayers();
        // Win condition: 1 or fewer players left
        if (activePlayers.length <= 1) {
            this.finishMatch();
            return;
        }
        // No more items
        if (this.currentRound >= this.items.length) {
            this.finishMatch();
            return;
        }
        this.currentRound++;
        this.currentItem = this.items[this.currentRound - 1];
        this.bids = new Map();
        this.chatHistory = []; // Clear chat for new round
        this.roundStartedAt = Date.now();
        this.gamePhase = 'deliberation';
        const endsAt = this.roundStartedAt + this.roundDurationMs;
        this.emit({
            type: 'round_started',
            round: this.currentRound,
            endsAt,
            data: {
                item: this.getPublicItem(),
            },
        });
        // Timer to end deliberation
        this.roundTimer = setTimeout(() => {
            this.endDeliberation();
        }, this.roundDurationMs);
    }
    endDeliberation() {
        if (this.gamePhase !== 'deliberation')
            return;
        this.clearTimer();
        this.gamePhase = 'reveal';
        const item = this.currentItem;
        const activePlayers = this.getActivePlayers();
        // Calculate distances
        const bidsArray = activePlayers.map(player => {
            const bid = this.bids.get(player.id);
            if (bid) {
                return { ...bid, distance: Math.abs(bid.price - item.price) };
            }
            // No bid = infinite distance
            return {
                playerId: player.id,
                price: -1,
                timestamp: 0,
                distance: Infinity,
            };
        });
        // Sort by distance (worst first)
        bidsArray.sort((a, b) => (b.distance ?? Infinity) - (a.distance ?? Infinity));
        // Emit reveal event
        this.emit({
            type: 'game_event',
            event: 'bids_reveal',
            data: {
                bids: bidsArray.map(b => ({
                    playerId: b.playerId,
                    price: b.price,
                    distance: b.distance,
                })),
                actualPrice: item.price,
            },
        });
        // After reveal duration, do elimination
        this.roundTimer = setTimeout(() => {
            this.doElimination(bidsArray);
        }, this.revealDurationMs);
    }
    doElimination(sortedBids) {
        this.gamePhase = 'elimination';
        const activePlayers = this.getActivePlayers();
        const toEliminate = Math.min(this.eliminatePerRound, activePlayers.length - 1);
        const eliminatedIds = [];
        for (let i = 0; i < toEliminate; i++) {
            const worstBid = sortedBids[i];
            eliminatedIds.push(worstBid.playerId);
            this.eliminatePlayer(worstBid.playerId, this.currentRound);
            this.eliminationOrder.push(worstBid.playerId);
        }
        // Record round result
        const roundResult = {
            roundNumber: this.currentRound,
            item: this.currentItem,
            bids: sortedBids,
            eliminated: eliminatedIds,
            startedAt: this.roundStartedAt,
            endedAt: Date.now(),
        };
        this.roundResults.push(roundResult);
        this.emit({
            type: 'round_ended',
            round: this.currentRound,
            data: {
                eliminated: eliminatedIds,
                remaining: this.getActivePlayerIds(),
            },
        });
        // After elimination duration, start next round
        this.roundTimer = setTimeout(() => {
            this.startNextRound();
        }, this.eliminationDurationMs);
    }
    // ============ ACTIONS ============
    handleAction(playerId, action) {
        const pwAction = action;
        if (pwAction.type === 'chat') {
            return this.handleChat(playerId, pwAction.message);
        }
        if (pwAction.type === 'bid') {
            return this.handleBid(playerId, pwAction.price);
        }
        return { success: false, error: 'Unknown action type' };
    }
    handleBid(playerId, price) {
        if (this.gamePhase !== 'deliberation') {
            return { success: false, error: 'Not in deliberation phase' };
        }
        const state = this.playerStates.get(playerId);
        if (!state?.isActive) {
            return { success: false, error: 'Player is not active' };
        }
        this.bids.set(playerId, {
            playerId,
            price: Math.round(price),
            timestamp: Date.now(),
        });
        this.emit({
            type: 'player_action',
            playerId,
            actionType: 'bid',
            public: false, // Don't reveal bid yet
        });
        return { success: true };
    }
    // ============ STATE QUERIES ============
    getPublicState() {
        const gameSpecific = {
            phase: this.gamePhase,
            currentRound: this.currentRound,
            totalRounds: this.items.length,
            currentItem: this.getPublicItem(),
            revealedPrice: this.gamePhase === 'reveal' || this.gamePhase === 'elimination'
                ? this.currentItem?.price ?? null
                : null,
            bids: this.getPublicBids(),
            eliminated: this.roundResults[this.currentRound - 1]?.eliminated ?? [],
            roundEndsAt: this.gamePhase === 'deliberation'
                ? this.roundStartedAt + this.roundDurationMs
                : null,
        };
        const players = this.players.map(p => {
            const state = this.playerStates.get(p.id);
            const bid = this.bids.get(p.id);
            return {
                id: p.id,
                name: p.name,
                avatar: p.avatar,
                isActive: state?.isActive ?? false,
                display: {
                    hasBid: !!bid,
                    bidPrice: this.gamePhase !== 'deliberation' ? bid?.price : undefined,
                },
            };
        });
        return {
            matchId: this.id,
            gameTypeId: this.gameTypeId,
            phase: this.phase,
            players,
            currentRound: this.currentRound,
            totalRounds: this.items.length,
            gameSpecific,
        };
    }
    getPublicItem() {
        if (!this.currentItem)
            return null;
        const { price, ...publicItem } = this.currentItem;
        return publicItem;
    }
    getPublicBids() {
        const showPrices = this.gamePhase !== 'deliberation';
        return this.getActivePlayers().map(p => {
            const bid = this.bids.get(p.id);
            return {
                playerId: p.id,
                price: showPrices && bid ? bid.price : null,
                locked: !!bid,
            };
        });
    }
    getPlacements() {
        return this.calculatePlacements(this.eliminationOrder);
    }
    getRoundResults() {
        return [...this.roundResults];
    }
    // ============ HELPERS ============
    clearTimer() {
        if (this.roundTimer) {
            clearTimeout(this.roundTimer);
            this.roundTimer = null;
        }
    }
    forceEnd() {
        this.clearTimer();
        this.finishMatch();
    }
    // For testing
    forceEndRound() {
        this.endDeliberation();
    }
}
