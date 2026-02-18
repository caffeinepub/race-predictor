interface BetSizeRecommendation {
    amount: number;
    explanation: string;
}

const MIN_BET = 0;
const MAX_BET = 10000;
const BANKROLL = 10000;

export function calculateBetSize(
    confidence: number,
    impliedProbability: number,
    baseAmount: number,
    skipRace: boolean,
    signalAgreement: number = 1.0
): BetSizeRecommendation {
    // If skip race is recommended, suggest $0
    if (skipRace) {
        return {
            amount: 0,
            explanation: 'Skip this race - conditions are not favorable for betting'
        };
    }

    // Calculate edge
    const edge = confidence - impliedProbability;

    // If no edge or negative edge, suggest $0
    if (edge <= 0) {
        return {
            amount: 0,
            explanation: 'No betting edge detected - the odds do not favor a bet'
        };
    }

    // Fractional Kelly Criterion (use 25% of Kelly for safety)
    const kellyFraction = 0.25;
    const kellyBet = (edge / (1 - confidence)) * BANKROLL * kellyFraction;

    // Adjust for signal agreement
    let adjustedBet = kellyBet * signalAgreement;

    // Apply bounds
    adjustedBet = Math.max(MIN_BET, Math.min(MAX_BET, adjustedBet));

    // Round to nearest 100
    const roundedBet = Math.round(adjustedBet / 100) * 100;

    // Generate explanation
    let explanation = '';
    if (roundedBet === 0) {
        explanation = 'No bet recommended - edge is too small or signals are uncertain';
    } else if (signalAgreement < 0.8) {
        explanation = `Reduced bet due to mixed signals. Original Kelly: $${Math.round(kellyBet)}, adjusted to $${roundedBet}`;
    } else {
        explanation = `Kelly Criterion suggests $${roundedBet} based on ${(edge * 100).toFixed(1)}% edge and ${(confidence * 100).toFixed(1)}% confidence`;
    }

    return {
        amount: roundedBet,
        explanation
    };
}
