export interface BetSuggestion {
    amount: number;
    explanation: string;
}

/**
 * Calculate suggested bet size based on implied probability vs odds
 * Uses a simplified Kelly Criterion approach with conservative sizing
 * 
 * @param impliedProbability - Predicted win probability (0-100)
 * @param fractionalOdds - Fractional odds (e.g., 5 for 5/1)
 * @returns Suggested bet amount between 100-10000
 */
export function calculateBetSize(impliedProbability: number, fractionalOdds: number): BetSuggestion {
    // Convert to decimal probability
    const p = impliedProbability / 100;
    
    // Convert fractional odds to decimal odds
    const decimalOdds = fractionalOdds + 1;
    
    // Market implied probability from odds
    const marketProb = 1 / decimalOdds;
    
    // Calculate edge (our probability - market probability)
    const edge = p - marketProb;
    
    // Base bet sizing on edge and confidence
    let betFraction = 0;
    
    if (edge > 0.2) {
        // Strong edge: larger bet
        betFraction = 0.9;
    } else if (edge > 0.1) {
        // Good edge: medium-high bet
        betFraction = 0.7;
    } else if (edge > 0.05) {
        // Slight edge: medium bet
        betFraction = 0.5;
    } else if (edge > 0) {
        // Minimal edge: smaller bet
        betFraction = 0.3;
    } else {
        // No edge or negative edge: minimum bet
        betFraction = 0.1;
    }
    
    // Also factor in confidence level
    if (impliedProbability > 70) {
        betFraction *= 1.2;
    } else if (impliedProbability < 40) {
        betFraction *= 0.7;
    }
    
    // Calculate raw amount (scale 100-10000)
    const rawAmount = 100 + (betFraction * 9900);
    
    // Round to nearest 100
    const amount = Math.max(100, Math.min(10000, Math.round(rawAmount / 100) * 100));
    
    // Generate explanation
    let explanation = '';
    if (edge > 0.15) {
        explanation = 'Strong value detected based on predicted probability vs odds';
    } else if (edge > 0.05) {
        explanation = 'Moderate value opportunity identified';
    } else if (edge > 0) {
        explanation = 'Slight edge detected, conservative sizing recommended';
    } else {
        explanation = 'Limited value detected, minimum bet suggested';
    }
    
    return {
        amount,
        explanation
    };
}
