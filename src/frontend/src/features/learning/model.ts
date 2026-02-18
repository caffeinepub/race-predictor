import { type Contender } from '@/features/entries/types';
import { type LearnedState } from '@/storage/localMemoryStore';

export interface PredictionResult {
    winner: string;
    confidence: number;
    impliedProbabilities: Record<string, number>;
    strategyId: string;
}

export function makePrediction(
    contenders: Contender[],
    learnedState: LearnedState
): PredictionResult {
    const scores: Record<string, number> = {};
    const weights = learnedState.signalWeights;

    contenders.forEach((contender) => {
        let score = 0;

        // Signal 1: Odds-based (lower odds = higher probability)
        const oddsScore = 1 / (contender.odds + 1);
        score += oddsScore * weights.oddsWeight;

        // Signal 2: Historical win rate
        const stats = learnedState.contenderStats[contender.number];
        if (stats && stats.appearances > 0) {
            const winRate = stats.wins / stats.appearances;
            score += winRate * weights.historicalWinRateWeight;
        }

        // Signal 3: Recent form (last 5 races)
        if (stats && stats.recentForm.length > 0) {
            const recentScore = stats.recentForm.reduce((sum, race) => {
                if (race.position === 1) return sum + 1.0;
                if (race.position === 2) return sum + 0.6;
                if (race.position === 3) return sum + 0.3;
                return sum;
            }, 0) / stats.recentForm.length;
            score += recentScore * weights.recentFormWeight;
        }

        // Signal 4: Streak/momentum
        const streak = learnedState.streakData[contender.number];
        if (streak) {
            let streakBonus = 0;
            if (streak.type === 'win' && streak.currentStreak > 0) {
                streakBonus = Math.min(streak.currentStreak * 0.1, 0.5);
            } else if (streak.type === 'podium' && streak.currentStreak > 0) {
                streakBonus = Math.min(streak.currentStreak * 0.05, 0.3);
            } else if (streak.type === 'loss' && streak.currentStreak < 0) {
                streakBonus = Math.max(streak.currentStreak * 0.05, -0.3);
            }
            score += streakBonus * weights.streakWeight;
        }

        scores[contender.number] = Math.max(score, 0);
    });

    // Convert scores to probabilities
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const impliedProbabilities: Record<string, number> = {};
    
    if (totalScore > 0) {
        Object.keys(scores).forEach(num => {
            impliedProbabilities[num] = Math.round((scores[num] / totalScore) * 100);
        });
    } else {
        // Fallback: equal probabilities
        contenders.forEach(c => {
            impliedProbabilities[c.number] = Math.round(100 / contenders.length);
        });
    }

    // Find winner (highest probability)
    let bestContender = contenders[0];
    let bestProb = impliedProbabilities[contenders[0].number] || 0;

    contenders.forEach((contender) => {
        const prob = impliedProbabilities[contender.number] || 0;
        if (prob > bestProb) {
            bestProb = prob;
            bestContender = contender;
        }
    });

    // Calculate confidence based on probability spread and variance
    let confidence = bestProb;

    // Adjust confidence based on variance (if available)
    const variance = learnedState.varianceData[bestContender.number];
    if (variance && variance.consistency !== 'unknown') {
        if (variance.consistency === 'low') {
            // High variance = less confidence
            confidence *= 0.85;
        } else if (variance.consistency === 'high') {
            // Low variance = more confidence
            confidence *= 1.1;
        }
    }

    // Ensure confidence is reasonable
    confidence = Math.max(20, Math.min(confidence, 95));

    return {
        winner: bestContender.number,
        confidence: Math.round(confidence),
        impliedProbabilities,
        strategyId: 'adaptive-ensemble-v1'
    };
}
