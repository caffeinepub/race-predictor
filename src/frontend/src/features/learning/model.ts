import { type Contender, type StrategyProfile, type SignalContribution } from '@/features/entries/types';
import { type LearnedState, type ContenderStats } from '@/storage/localMemoryStore';
import { calculateImpliedProbability } from '@/lib/oddsFormat';

export interface StrategyProfileConfig {
    name: StrategyProfile;
    oddsWeight: number;
    historicalWinRateWeight: number;
    recentFormWeight: number;
    consistencyWeight: number;
    winStreakWeight: number;
    placerStreakWeight: number;
    lowerStreakWeight: number;
    momentumWeight: number;
    oddsMovementWeight: number;
    hotStreakBoost: number;
    valueThreshold: number; // Minimum edge required to recommend bet
}

const STRATEGY_PROFILES: Record<StrategyProfile, StrategyProfileConfig> = {
    Safe: {
        name: 'Safe',
        oddsWeight: 1.5,
        historicalWinRateWeight: 0.8,
        recentFormWeight: 0.4,
        consistencyWeight: 0.6,
        winStreakWeight: 0.3,
        placerStreakWeight: 0.15,
        lowerStreakWeight: -0.1,
        momentumWeight: 0.4,
        oddsMovementWeight: -0.2,
        hotStreakBoost: 1.15,
        valueThreshold: 0.15
    },
    Value: {
        name: 'Value',
        oddsWeight: 0.6,
        historicalWinRateWeight: 1.2,
        recentFormWeight: 0.8,
        consistencyWeight: 0.3,
        winStreakWeight: 0.5,
        placerStreakWeight: 0.25,
        lowerStreakWeight: -0.15,
        momentumWeight: 0.7,
        oddsMovementWeight: -0.4,
        hotStreakBoost: 1.25,
        valueThreshold: 0.20
    },
    Balanced: {
        name: 'Balanced',
        oddsWeight: 1.0,
        historicalWinRateWeight: 0.7,
        recentFormWeight: 0.5,
        consistencyWeight: 0.4,
        winStreakWeight: 0.4,
        placerStreakWeight: 0.2,
        lowerStreakWeight: -0.12,
        momentumWeight: 0.5,
        oddsMovementWeight: -0.3,
        hotStreakBoost: 1.20,
        valueThreshold: 0.10
    },
    Aggressive: {
        name: 'Aggressive',
        oddsWeight: 0.8,
        historicalWinRateWeight: 0.5,
        recentFormWeight: 1.0,
        consistencyWeight: 0.2,
        winStreakWeight: 0.6,
        placerStreakWeight: 0.3,
        lowerStreakWeight: -0.2,
        momentumWeight: 0.9,
        oddsMovementWeight: -0.5,
        hotStreakBoost: 1.30,
        valueThreshold: 0.05
    }
};

export interface PredictionResult {
    predictedWinner: string;
    confidence: number;
    probabilities: Record<string, number>;
    impliedProbabilities: Record<string, number>;
    skipRace: boolean;
    skipReason?: string;
    hotStreakBoost?: {
        contenderId: string;
        streakLength: number;
        boostFactor: number;
    };
    signalBreakdown?: SignalContribution[];
    signalAgreement?: number;
    signalAgreementLabel?: string;
}

function normalize(value: number, min: number = 0, max: number = 1): number {
    if (max === min) return 0;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function computeSignalScore(
    contender: Contender,
    stats: ContenderStats | undefined,
    profile: StrategyProfileConfig,
    allStats: ContenderStats[]
): { score: number; breakdown: SignalContribution[] } {
    const breakdown: SignalContribution[] = [];
    let totalScore = 0;

    // Odds signal
    const impliedProb = calculateImpliedProbability(contender.odds);
    const oddsSignal = impliedProb * profile.oddsWeight;
    totalScore += oddsSignal;
    breakdown.push({ signal: 'Odds', value: oddsSignal });

    if (!stats) {
        return { score: totalScore, breakdown };
    }

    // Historical win rate signal
    const winRate = stats.appearances > 0 ? stats.wins / stats.appearances : 0;
    const winRateSignal = winRate * profile.historicalWinRateWeight;
    totalScore += winRateSignal;
    breakdown.push({ signal: 'Win Rate', value: winRateSignal });

    // Recent form signal
    const recentWins = stats.recentForm.filter(f => f.position === 1).length;
    const recentFormScore = stats.recentForm.length > 0 ? recentWins / stats.recentForm.length : 0;
    const recentFormSignal = recentFormScore * profile.recentFormWeight;
    totalScore += recentFormSignal;
    breakdown.push({ signal: 'Recent Form', value: recentFormSignal });

    // Consistency signal
    const podiumRate = stats.appearances > 0 
        ? (stats.wins + stats.places + stats.shows) / stats.appearances 
        : 0;
    const consistencySignal = podiumRate * profile.consistencyWeight;
    totalScore += consistencySignal;
    breakdown.push({ signal: 'Consistency', value: consistencySignal });

    // Win Streak signal
    const normalizedWinStreak = normalize(stats.winStreak, 0, 10);
    const winStreakSignal = normalizedWinStreak * profile.winStreakWeight;
    totalScore += winStreakSignal;
    if (stats.winStreak > 0) {
        breakdown.push({ signal: `Win Streak (🔥${stats.winStreak})`, value: winStreakSignal });
    }

    // Placer Streak signal
    const normalizedPlacerStreak = normalize(stats.placerStreak, 0, 10);
    const placerStreakSignal = normalizedPlacerStreak * profile.placerStreakWeight;
    totalScore += placerStreakSignal;
    if (stats.placerStreak > 0) {
        breakdown.push({ signal: `Placer Streak (📈${stats.placerStreak})`, value: placerStreakSignal });
    }

    // Lower Streak signal (negative)
    const normalizedLowerStreak = normalize(stats.lowerStreak, 0, 10);
    const lowerStreakSignal = normalizedLowerStreak * profile.lowerStreakWeight;
    totalScore += lowerStreakSignal;
    if (stats.lowerStreak > 0) {
        breakdown.push({ signal: `Lower Streak (📉${stats.lowerStreak})`, value: lowerStreakSignal });
    }

    // Momentum signal
    const momentumSignal = stats.momentumScore * profile.momentumWeight;
    totalScore += momentumSignal;
    breakdown.push({ signal: 'Momentum', value: momentumSignal });

    // Odds Movement signal
    if (stats.oddsMovement !== null) {
        const oddsMovementSignal = stats.oddsMovement * profile.oddsMovementWeight;
        totalScore += oddsMovementSignal;
        const movementLabel = stats.oddsMovement > 0.05 ? '⬆️' : stats.oddsMovement < -0.05 ? '⬇️' : '➡️';
        breakdown.push({ signal: `Odds Movement ${movementLabel}`, value: oddsMovementSignal });
    }

    return { score: totalScore, breakdown };
}

function calculateSignalAgreement(
    contenders: Contender[],
    learnedState: LearnedState
): { agreement: number; label: string } {
    // Calculate individual signal rankings
    const signalRankings: Record<string, number[]> = {
        odds: [],
        winStreak: [],
        momentum: [],
        consistency: [],
        oddsMovement: []
    };

    contenders.forEach((contender, index) => {
        const contenderId = contender.contenderId || contender.number;
        const stats = learnedState.contenderStats[contenderId];
        
        // Odds ranking
        const impliedProb = calculateImpliedProbability(contender.odds);
        signalRankings.odds.push(impliedProb);
        
        // Win streak ranking
        signalRankings.winStreak.push(stats?.winStreak || 0);
        
        // Momentum ranking
        signalRankings.momentum.push(stats?.momentumScore || 0);
        
        // Consistency ranking
        const podiumRate = stats && stats.appearances > 0 
            ? (stats.wins + stats.places + stats.shows) / stats.appearances 
            : 0;
        signalRankings.consistency.push(podiumRate);
        
        // Odds movement ranking (inverted - falling odds is good)
        signalRankings.oddsMovement.push(-(stats?.oddsMovement || 0));
    });

    // Find top contender for each signal
    const topContenders: number[] = [];
    Object.values(signalRankings).forEach(rankings => {
        const maxIndex = rankings.indexOf(Math.max(...rankings));
        topContenders.push(maxIndex);
    });

    // Calculate agreement as percentage of signals agreeing on same contender
    const mostCommonIndex = topContenders.sort((a, b) =>
        topContenders.filter(v => v === a).length - topContenders.filter(v => v === b).length
    ).pop() || 0;
    
    const agreementCount = topContenders.filter(i => i === mostCommonIndex).length;
    const agreement = agreementCount / topContenders.length;

    let label = 'Moderate';
    if (agreement >= 0.7) label = 'High Agreement';
    else if (agreement < 0.4) label = 'Mixed Signals';

    return { agreement, label };
}

export function predictWinner(
    contenders: Contender[],
    learnedState: LearnedState | null,
    strategyProfile: StrategyProfile = 'Balanced'
): PredictionResult {
    const profile = STRATEGY_PROFILES[strategyProfile];
    
    // Calculate implied probabilities from odds
    const impliedProbabilities: Record<string, number> = {};
    contenders.forEach(c => {
        impliedProbabilities[c.number] = calculateImpliedProbability(c.odds);
    });

    // If no learned state, use odds-only prediction
    if (!learnedState) {
        const sortedByOdds = [...contenders].sort((a, b) => {
            const aProb = calculateImpliedProbability(a.odds);
            const bProb = calculateImpliedProbability(b.odds);
            return bProb - aProb;
        });

        const winner = sortedByOdds[0];
        const winnerProb = calculateImpliedProbability(winner.odds);

        return {
            predictedWinner: winner.number,
            confidence: winnerProb * 100,
            probabilities: impliedProbabilities,
            impliedProbabilities,
            skipRace: false,
            signalBreakdown: [{ signal: 'Odds', value: winnerProb }],
            signalAgreement: 1.0,
            signalAgreementLabel: 'High Agreement'
        };
    }

    // Collect stats for all contenders
    const allStats: ContenderStats[] = contenders.map(c => {
        const contenderId = c.contenderId || c.number;
        return learnedState.contenderStats[contenderId] || {
            wins: 0,
            places: 0,
            shows: 0,
            appearances: 0,
            recentForm: [],
            winStreak: 0,
            placerStreak: 0,
            lowerStreak: 0,
            lastOddsNumerator: null,
            oddsMovement: null,
            momentumScore: 0
        };
    });

    // Compute signal scores for each contender
    const scores: Array<{ contender: Contender; score: number; breakdown: SignalContribution[] }> = [];
    
    contenders.forEach(contender => {
        const contenderId = contender.contenderId || contender.number;
        const stats = learnedState.contenderStats[contenderId];
        const { score, breakdown } = computeSignalScore(contender, stats, profile, allStats);
        scores.push({ contender, score, breakdown });
    });

    // Check for hot streak (Win Streak >= 4)
    let hotStreakBoost: PredictionResult['hotStreakBoost'] = undefined;
    scores.forEach(s => {
        const contenderId = s.contender.contenderId || s.contender.number;
        const stats = learnedState.contenderStats[contenderId];
        if (stats && stats.winStreak >= 4) {
            s.score *= profile.hotStreakBoost;
            hotStreakBoost = {
                contenderId,
                streakLength: stats.winStreak,
                boostFactor: profile.hotStreakBoost
            };
        }
    });

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    // Convert scores to probabilities using softmax
    const maxScore = Math.max(...scores.map(s => s.score));
    const expScores = scores.map(s => Math.exp(s.score - maxScore));
    const sumExpScores = expScores.reduce((a, b) => a + b, 0);
    
    const probabilities: Record<string, number> = {};
    scores.forEach((s, i) => {
        probabilities[s.contender.number] = expScores[i] / sumExpScores;
    });

    const winner = scores[0].contender;
    const winnerProb = probabilities[winner.number];
    const winnerImpliedProb = impliedProbabilities[winner.number];

    // Calculate signal agreement
    const { agreement, label } = calculateSignalAgreement(contenders, learnedState);

    // Adjust confidence based on signal agreement
    const adjustedConfidence = winnerProb * (0.7 + 0.3 * agreement);

    // Check if we should skip this race (no value edge)
    const edge = winnerProb - winnerImpliedProb;
    const skipRace = edge < profile.valueThreshold;
    const skipReason = skipRace 
        ? `No sufficient value edge detected (edge: ${(edge * 100).toFixed(1)}%, threshold: ${(profile.valueThreshold * 100).toFixed(1)}%)`
        : undefined;

    return {
        predictedWinner: winner.number,
        confidence: adjustedConfidence * 100,
        probabilities,
        impliedProbabilities,
        skipRace,
        skipReason,
        hotStreakBoost,
        signalBreakdown: scores[0].breakdown,
        signalAgreement: agreement,
        signalAgreementLabel: label
    };
}
