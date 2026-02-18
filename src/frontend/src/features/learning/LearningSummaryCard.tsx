import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Award, DollarSign, Activity } from 'lucide-react';
import { type RaceEntry } from '@/features/entries/types';
import { type LearnedState } from '@/storage/localMemoryStore';
import { calculateMetrics } from './metrics';
import { getAccuracyVisuals } from './accuracyVisuals';

interface LearningSummaryCardProps {
    entries: RaceEntry[];
    learnedState: LearnedState;
}

export function LearningSummaryCard({ entries, learnedState }: LearningSummaryCardProps) {
    const metrics = calculateMetrics(entries, learnedState.totalBetAmount, learnedState.totalPayout);

    if (metrics.totalRaces === 0) {
        return (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Learning Status
                    </CardTitle>
                    <CardDescription>
                        The predictor learns from saved race results and improves over time
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No data yet. Start by entering race contenders and recording results to train the prediction
                        model.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const accuracyVisuals = getAccuracyVisuals(metrics.accuracy);

    return (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Learning Status
                </CardTitle>
                <CardDescription>
                    Trained on {metrics.totalRaces} race{metrics.totalRaces !== 1 ? 's' : ''} • Model adapts from
                    recorded outcomes
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Overall Accuracy</span>
                        </div>
                        <span className="font-bold text-lg flex items-center gap-1.5">
                            <span className="text-xl" role="img" aria-label="accuracy indicator">
                                {accuracyVisuals.emoji}
                            </span>
                            {metrics.accuracy}%
                        </span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full transition-all duration-500 ease-out"
                            style={{
                                width: `${metrics.accuracy}%`,
                                backgroundColor: accuracyVisuals.color
                            }}
                        />
                    </div>
                </div>

                {metrics.totalRaces >= 10 && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Award className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Recent Accuracy (Last 10)</span>
                            </div>
                            <span className="font-bold text-lg">{metrics.recentAccuracy}%</span>
                        </div>
                        <Progress value={metrics.recentAccuracy} className="h-2" />
                    </div>
                )}

                {metrics.totalBetAmount > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Overall ROI</span>
                            </div>
                            <span className={`font-bold text-lg ${metrics.overallROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {metrics.overallROI >= 0 ? '+' : ''}{metrics.overallROI}%
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            ${metrics.totalPayout.toLocaleString()} returned on ${metrics.totalBetAmount.toLocaleString()} wagered
                        </div>
                    </div>
                )}

                {metrics.brierScore > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Calibration Score</span>
                            </div>
                            <span className="font-bold text-lg">{(1 - metrics.brierScore).toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Higher is better (probability accuracy)
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">{metrics.correctPredictions}</div>
                        <div className="text-xs text-muted-foreground">Correct</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-foreground">
                            {metrics.totalRaces - metrics.correctPredictions}
                        </div>
                        <div className="text-xs text-muted-foreground">Incorrect</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
