export interface BetSizeRecommendation {
    amount: number;
    explanation: string;
}

export function calculateBetSize(
    predictedProbability: number,
    impliedProbability: number,
    bankroll: number = 100,
    skipMode: boolean = false,
    signalAgreement: number = 1.0
): BetSizeRecommendation {
    // If skip mode is active, recommend $0
    if (skipMode) {
        return {
            amount: 0,
            explanation: 'No value edge detected. Model recommends skipping this race.'
        };
    }

    // Calculate edge
    const edge = predictedProbability - impliedProbability;

    // If no edge or negative edge, recommend $0
    if (edge <= 0) {
        return {
            amount: 0,
            explanation: 'No positive edge detected. Odds do not favor this bet.'
        };
    }

    // Kelly Criterion: f = (bp - q) / b
    // where b = decimal odds - 1, p = win probability, q = 1 - p
    const decimalOdds = 1 / impliedProbability;
    const b = decimalOdds - 1;
    const p = predictedProbability;
    const q = 1 - p;

    let kellyFraction = (b * p - q) / b;

    // Apply fractional Kelly (25% of full Kelly for safety)
    kellyFraction = kellyFraction * 0.25;

    // Adjust for signal agreement
    if (signalAgreement < 0.4) {
        kellyFraction *= 0.5; // Reduce bet size by 50% when signals are mixed
    } else if (signalAgreement < 0.6) {
        kellyFraction *= 0.7; // Reduce bet size by 30% when signals are moderate
    }

    // Calculate bet amount
    let betAmount = Math.max(0, kellyFraction * bankroll);

    // Cap at reasonable limits
    betAmount = Math.min(betAmount, bankroll * 0.1); // Never bet more than 10% of bankroll
    betAmount = Math.min(betAmount, 10000); // Hard cap at $10,000

    // Round to nearest dollar
    betAmount = Math.round(betAmount);

    // Generate explanation
    let explanation = '';
    if (betAmount === 0) {
        explanation = 'Edge is too small to justify a bet. Consider skipping.';
    } else if (betAmount < 10) {
        explanation = `Small edge detected (${(edge * 100).toFixed(1)}%). Conservative bet recommended.`;
    } else if (betAmount < 50) {
        explanation = `Moderate edge detected (${(edge * 100).toFixed(1)}%). Standard bet size.`;
    } else {
        explanation = `Strong edge detected (${(edge * 100).toFixed(1)}%). Larger bet justified.`;
    }

    if (signalAgreement < 0.4) {
        explanation += ' Bet reduced due to mixed signals.';
    }

    return {
        amount: betAmount,
        explanation
    };
}
