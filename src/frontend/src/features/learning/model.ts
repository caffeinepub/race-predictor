import { type Contender } from '@/features/entries/types';
import { type LearnedState } from '@/storage/localMemoryStore';

export function makePrediction(
    contenders: Contender[],
    learnedState: LearnedState
): { winner: string; confidence: number } {
    let bestContender: Contender = contenders[0];
    let bestScore = -1;

    contenders.forEach((contender) => {
        // Base score from odds (lower odds = higher probability)
        let score = 1 / contender.odds;

        // Apply learned bias from historical data
        const stats = learnedState.contenderStats[contender.number];
        if (stats) {
            const winRate = stats.appearances > 0 ? stats.wins / stats.appearances : 0;
            // Boost score based on historical win rate
            score = score * (1 + winRate * 2);
        }

        if (score > bestScore) {
            bestScore = score;
            bestContender = contender;
        }
    });

    // Calculate confidence based on score and historical accuracy
    const baseConfidence = Math.min(bestScore * 30, 85);
    const accuracyBoost = learnedState.totalRaces > 0 ? (learnedState.correctPredictions / learnedState.totalRaces) * 15 : 0;
    const confidence = Math.min(Math.round(baseConfidence + accuracyBoost), 95);

    return {
        winner: bestContender.number,
        confidence
    };
}
