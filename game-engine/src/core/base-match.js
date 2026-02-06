/**
 * Base Match Class
 *
 * Common functionality for all game matches.
 */
import { v4 as uuid } from 'uuid';
export class BaseMatch {
    id;
    gameTypeId;
    players;
    prizePool;
    phase = 'waiting';
    eventHandlers = [];
    chatHistory = [];
    playerStates;
    startedAt = null;
    endedAt = null;
    constructor(gameTypeId, players, prizePool = 0) {
        this.id = uuid();
        this.gameTypeId = gameTypeId;
        this.players = players;
        this.prizePool = prizePool;
        // Initialize player states
        this.playerStates = new Map();
        for (const player of players) {
            this.playerStates.set(player.id, {
                playerId: player.id,
                isActive: true,
            });
        }
    }
    // ============ PHASE ============
    getPhase() {
        return this.phase;
    }
    isFinished() {
        return this.phase === 'finished';
    }
    getPlayerState(playerId) {
        return this.playerStates.get(playerId) || {
            playerId,
            isActive: false,
        };
    }
    getWinner() {
        const placements = this.getPlacements();
        if (placements.length === 0)
            return null;
        const winnerId = placements.find(p => p.place === 1)?.playerId;
        return this.players.find(p => p.id === winnerId) || null;
    }
    // ============ ACTIVE PLAYERS ============
    getActivePlayers() {
        return this.players.filter(p => {
            const state = this.playerStates.get(p.id);
            return state?.isActive ?? false;
        });
    }
    getActivePlayerIds() {
        return this.getActivePlayers().map(p => p.id);
    }
    eliminatePlayer(playerId, round) {
        const state = this.playerStates.get(playerId);
        if (state) {
            state.isActive = false;
            state.eliminatedRound = round;
        }
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            this.emit({
                type: 'player_eliminated',
                playerId,
                playerName: player.name,
                round,
            });
        }
    }
    // ============ CHAT ============
    handleChat(playerId, message) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            return { success: false, error: 'Player not found' };
        }
        const state = this.playerStates.get(playerId);
        if (!state?.isActive) {
            return { success: false, error: 'Player is not active' };
        }
        const chatMsg = {
            playerId,
            playerName: player.name,
            message: message.slice(0, 200), // Limit length
            timestamp: Date.now(),
        };
        this.chatHistory.push(chatMsg);
        this.emit({
            type: 'chat_message',
            playerId,
            playerName: player.name,
            message: chatMsg.message,
        });
        return { success: true };
    }
    getChatHistory() {
        return [...this.chatHistory];
    }
    // ============ EVENTS ============
    on(handler) {
        this.eventHandlers.push(handler);
        return () => {
            this.eventHandlers = this.eventHandlers.filter(h => h !== handler);
        };
    }
    emit(event) {
        for (const handler of this.eventHandlers) {
            try {
                handler(event);
            }
            catch (e) {
                console.error('Match event handler error:', e);
            }
        }
    }
    // ============ PLACEMENTS HELPER ============
    calculatePlacements(eliminationOrder) {
        const totalPlayers = this.players.length;
        const placements = [];
        // Winner (last one standing)
        const activePlayers = this.getActivePlayers();
        if (activePlayers.length > 0) {
            const winner = activePlayers[0];
            placements.push({
                playerId: winner.id,
                playerName: winner.name,
                place: 1,
                points: totalPlayers - 1, // Beat everyone else
            });
        }
        // Eliminated players in reverse order (last eliminated = 2nd place)
        const reversedElims = [...eliminationOrder].reverse();
        for (let i = 0; i < reversedElims.length; i++) {
            const playerId = reversedElims[i];
            const player = this.players.find(p => p.id === playerId);
            if (player) {
                const place = 2 + i;
                const points = totalPlayers - place; // Opponents beaten
                placements.push({
                    playerId,
                    playerName: player.name,
                    place,
                    points: Math.max(0, points),
                });
            }
        }
        return placements.sort((a, b) => a.place - b.place);
    }
    // ============ FINISH ============
    finishMatch() {
        this.phase = 'finished';
        this.endedAt = Date.now();
        const placements = this.getPlacements();
        const winner = this.getWinner();
        this.emit({
            type: 'match_finished',
            winner,
            placements,
        });
    }
}
