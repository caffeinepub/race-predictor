import { type Contender } from '@/features/entries/types';
import { type LearnedState } from '@/storage/localMemoryStore';
import { type StrategyProfile, type SignalContribution } from '@/features/entries/types';

interface PredictionResult {
    predictedWinner: string;
    confidence: number;
    probabilities: Record<string, number>;
    impliedProbabilities: Record<string, number>;
    skipRace: boolean;
    skipReason?: string;
    signalAgreement?: number;
    signalAgreementLabel?: string;
    signalBreakdown?: SignalContribution[];
    hotStreakBoost?: {
        contenderId: string;
        streakLength: number;
        boostFactor: number;
    };
    uncertaintyFlag?: boolean;
}

const HOT_STREAK_THRESHOLD = 4;
const HOT_STREAK_BOOST = 1.3;

export function predictWinner(
    contenders: Contender[],
    learnedState: LearnedState | null,
    strategy: StrategyProfile = 'Balanced'
): PredictionResult {
    const impliedProbabilities: Record<string, number> = {};
    const rawScores: Record<string, number> = {};
    const signalContributions: Record<string, SignalContribution[]> = {};

    // Calculate implied probabilities from odds
    contenders.forEach(c => {
        impliedProbabilities[c.number] = c.impliedProbability;
    });

    // Check for hot streak (Win Streak only)
    let hotStreakBoost: PredictionResult['hotStreakBoost'] = undefined;
    if (learnedState) {
        contenders.forEach(c => {
            const stats = learnedState.contenderStats[c.contenderId];
            if (stats && stats.winStreak >= HOT_STREAK_THRESHOLD) {
                hotStreakBoost = {
                    contenderId: c.contenderId,
                    streakLength: stats.winStreak,
                    boostFactor: HOT_STREAK_BOOST
                };
            }
        });
    }

    // Calculate weighted scores for each contender
    contenders.forEach(c => {
        const signals: SignalContribution[] = [];
        let score = 0;

        // Odds signal (lower odds = higher probability)
        const oddsSignal = (1 - c.impliedProbability) * 0.5;
        const oddsWeight = learnedState?.signalWeights.oddsWeight || 1.0;
        score += oddsSignal * oddsWeight;
        signals.push({ signal: 'Odds', value: oddsSignal * oddsWeight });

        if (learnedState) {
            const stats = learnedState.contenderStats[c.contenderId];
            
            if (stats) {
                // Historical win rate
                const winRate = stats.appearances > 0 ? stats.wins / stats.appearances : 0;
                const winRateSignal = winRate * 0.3;
                const winRateWeight = learnedState.signalWeights.historicalWinRateWeight || 0.8;
                score += winRateSignal * winRateWeight;
                signals.push({ signal: 'Win Rate', value: winRateSignal * winRateWeight });

                // Recent form
                const recentFormScore = stats.recentForm.length > 0
                    ? stats.recentForm.reduce((sum, f) => sum + (f.position === 1 ? 0.3 : f.position <= 3 ? 0.15 : 0), 0) / stats.recentForm.length
                    : 0;
                const formWeight = learnedState.signalWeights.recentFormWeight || 1.2;
                score += recentFormScore * formWeight;
                signals.push({ signal: 'Recent Form', value: recentFormScore * formWeight });

                // Win Streak (1st place only)
                const winStreakSignal = stats.winStreak * 0.05;
                const winStreakWeight = learnedState.signalWeights.winStreakWeight || 0.8;
                score += winStreakSignal * winStreakWeight;
                signals.push({ signal: 'Win Streak', value: winStreakSignal * winStreakWeight });

                // Placer Streak (2nd-3rd place)
                const placerStreakSignal = stats.placerStreak * 0.03;
                const placerStreakWeight = learnedState.signalWeights.placerStreakWeight || 0.5;
                score += placerStreakSignal * placerStreakWeight;
                signals.push({ signal: 'Placer Streak', value: placerStreakSignal * placerStreakWeight });

                // Lower Streak (4th-6th place) - negative signal
                const lowerStreakSignal = stats.lowerStreak * -0.04;
                const lowerStreakWeight = learnedState.signalWeights.lowerStreakWeight || -0.3;
                score += lowerStreakSignal * lowerStreakWeight;
                signals.push({ signal: 'Lower Streak', value: lowerStreakSignal * lowerStreakWeight });

                // Odds Movement
                if (stats.oddsMovement !== null) {
                    // Falling odds (negative movement) = positive signal
                    // Rising odds (positive movement) = negative signal
                    const oddsMovementSignal = -stats.oddsMovement * 0.1;
                    const oddsMovementWeight = learnedState.signalWeights.oddsMovementWeight || 0.4;
                    score += oddsMovementSignal * oddsMovementWeight;
                    signals.push({ signal: 'Odds Movement', value: oddsMovementSignal * oddsMovementWeight });
                }

                // Momentum Score
                const momentumSignal = stats.momentumScore * 0.2;
                const momentumWeight = learnedState.signalWeights.momentumWeight || 0.9;
                score += momentumSignal * momentumWeight;
                signals.push({ signal: 'Momentum', value: momentumSignal * momentumWeight });

                // Hot streak boost (Win Streak >= 4)
                if (hotStreakBoost && hotStreakBoost.contenderId === c.contenderId) {
                    score *= hotStreakBoost.boostFactor;
                }
            }
        }

        rawScores[c.number] = score;
        signalContributions[c.number] = signals;
    });

    // Apply strategy adjustments
    const strategyMultipliers: Record<StrategyProfile, { favorite: number; underdog: number }> = {
        'Aggressive': { favorite: 0.8, underdog: 1.3 },
        'Balanced': { favorite: 1.0, underdog: 1.0 },
        'Conservative': { favorite: 1.2, underdog: 0.8 }
    };

    const multipliers = strategyMultipliers[strategy];
    Object.keys(rawScores).forEach(num => {
        const isFavorite = impliedProbabilities[num] > 0.25;
        rawScores[num] *= isFavorite ? multipliers.favorite : multipliers.underdog;
    });

    // Normalize to probabilities
    const totalScore = Object.values(rawScores).reduce((sum, s) => sum + Math.max(0, s), 0);
    const probabilities: Record<string, number> = {};
    
    if (totalScore > 0) {
        Object.keys(rawScores).forEach(num => {
            probabilities[num] = Math.max(0, rawScores[num]) / totalScore;
        });
    } else {
        // Fallback to implied probabilities
        contenders.forEach(c => {
            probabilities[c.number] = c.impliedProbability;
        });
    }

    // Find predicted winner
    const predictedWinner = Object.entries(probabilities)
        .sort(([, a], [, b]) => b - a)[0][0];

    const confidence = probabilities[predictedWinner] * 100;

    // Calculate signal agreement (ensemble diversity)
    const topContenderSignals = signalContributions[predictedWinner] || [];
    const signalValues = topContenderSignals.map(s => s.value);
    
    let signalAgreement = 1.0;
    let uncertaintyFlag = false;
    
    if (signalValues.length > 0) {
        const mean = signalValues.reduce((a, b) => a + b, 0) / signalValues.length;
        const variance = signalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / signalValues.length;
        const stdDev = Math.sqrt(variance);
        
        // High standard deviation = low agreement
        if (stdDev > 0.15) {
            signalAgreement = 0.5;
            uncertaintyFlag = true;
        } else if (stdDev > 0.08) {
            signalAgreement = 0.75;
        }
    }

    const signalAgreementLabel = signalAgreement >= 0.9 ? 'High Agreement' :
                                 signalAgreement >= 0.7 ? 'Moderate Agreement' :
                                 'Mixed Signals';

    // Skip race logic
    let skipRace = false;
    let skipReason = '';

    if (confidence < 25) {
        skipRace = true;
        skipReason = 'Low confidence prediction - no clear favorite';
    } else if (signalAgreement < 0.7) {
        skipRace = true;
        skipReason = 'Signals are mixed - uncertain prediction';
    }

    return {
        predictedWinner,
        confidence,
        probabilities,
        impliedProbabilities,
        skipRace,
        skipReason: skipRace ? skipReason : undefined,
        signalAgreement,
        signalAgreementLabel,
        signalBreakdown: signalContributions[predictedWinner],
        hotStreakBoost,
        uncertaintyFlag
    };
}
