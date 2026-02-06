/**
 * Rock Paper Scissors Game Types
 */
// Helper
export function getWinner(choice1, choice2) {
    if (choice1 === choice2)
        return 'draw';
    const wins = {
        rock: 'scissors',
        paper: 'rock',
        scissors: 'paper',
    };
    return wins[choice1] === choice2 ? 'player1' : 'player2';
}
