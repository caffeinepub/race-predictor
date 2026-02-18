import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Target, DollarSign, Trophy, Activity, Zap, BarChart3, RefreshCw } from 'lucide-react';
import { type RaceEntry } from '@/features/entries/types';
import { type LearnedState } from '@/storage/localMemoryStore';
import { calculateMetrics, calculateModelMood } from '@/features/learning/metrics';
import { getAccuracyVisuals, getROIVisuals, getMoodVisuals } from '@/features/learning/accuracyVisuals';
import { StatusEmoji } from '@/components/StatusEmoji';
import { ResetAppMemoryButton } from '@/features/reset/ResetAppMemoryButton';

interface InfoDashboardViewProps {
    entries: RaceEntry[];
    learnedState: LearnedState;
    onReset: () => void;
}

export function InfoDashboardView({ entries, learnedState, onReset }: InfoDashboardViewProps) {
    const metrics = calculateMetrics(entries, learnedState.totalBetAmount, learnedState.totalPayout);
    const modelMood = calculateModelMood(entries);
    const moodVisuals = getMoodVisuals(modelMood.mood);
    const accuracyVisuals = getAccuracyVisuals(metrics.accuracy);
    const roiVisuals = getROIVisuals(metrics.overallROI);

    // Calculate recent races (last 10)
    const recentRaces = entries.slice(-10);
    const recentCorrect = recentRaces.filter(e => e.predictedWinner === e.actualWinner).length;

    return (
        <div className="space-y-6">
            {/* Main Counters */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />
                        Performance Overview
                    </CardTitle>
                    <CardDescription>Key metrics from your race history</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Total Races Run */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Total Races Run</span>
                            <StatusEmoji emoji="🏁" label="Total races" />
                        </div>
                        <div className="text-4xl font-bold">{metrics.totalRaces}</div>
                    </div>

                    <Separator />

                    {/* Prediction Accuracy */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Prediction Accuracy</span>
                            <StatusEmoji emoji={accuracyVisuals.emoji} label={accuracyVisuals.label} />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">{metrics.accuracy}%</span>
                            <span className="text-sm text-muted-foreground">
                                ({metrics.correctPredictions}/{metrics.totalRaces})
                            </span>
                        </div>
                        <Progress value={metrics.accuracy} className="h-2" />
                        <p className="text-xs text-muted-foreground">{accuracyVisuals.label}</p>
                    </div>

                    <Separator />

                    {/* ROI */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Return on Investment (ROI)</span>
                            <StatusEmoji emoji={roiVisuals.emoji} label={roiVisuals.label} />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-4xl font-bold ${roiVisuals.color}`}>
                                {metrics.overallROI > 0 ? '+' : ''}{metrics.overallROI}%
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex justify-between">
                                <span>Total Bet:</span>
                                <span className="font-mono">${metrics.totalBetAmount.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total Payout:</span>
                                <span className="font-mono">${metrics.totalPayout.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                                <span>Net Profit:</span>
                                <span className={`font-mono ${metrics.overallROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${(metrics.totalPayout - metrics.totalBetAmount).toFixed(0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Model Mood */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Model Confidence
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold">{modelMood.mood} Confidence</div>
                            <p className="text-sm text-muted-foreground">{modelMood.label}</p>
                        </div>
                        <div className="text-5xl">
                            <StatusEmoji emoji={moodVisuals.emoji} label={moodVisuals.label} />
                        </div>
                    </div>
                    <Progress value={modelMood.confidence} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                        Based on recent accuracy and prediction calibration
                    </p>
                </CardContent>
            </Card>

            {/* Recent Performance */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Recent Performance
                    </CardTitle>
                    <CardDescription>Last 10 races</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Recent Accuracy</span>
                        <span className="text-2xl font-bold">{metrics.recentAccuracy}%</span>
                    </div>
                    <Progress value={metrics.recentAccuracy} className="h-2" />
                    
                    <div className="space-y-2">
                        <div className="text-sm font-medium">Last 10 Results:</div>
                        <div className="flex flex-wrap gap-2">
                            {recentRaces.map((race, i) => {
                                const isCorrect = race.predictedWinner === race.actualWinner;
                                return (
                                    <Badge
                                        key={i}
                                        variant={isCorrect ? 'default' : 'destructive'}
                                    >
                                        {isCorrect ? '✓' : '✗'}
                                    </Badge>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Strategy Performance */}
            {Object.keys(metrics.strategyROI).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Strategy Performance
                        </CardTitle>
                        <CardDescription>ROI by betting strategy</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {Object.entries(metrics.strategyROI).map(([strategy, roi]) => (
                            <div key={strategy} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{strategy}</span>
                                    <span className={`text-lg font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {roi > 0 ? '+' : ''}{roi}%
                                    </span>
                                </div>
                                <Progress 
                                    value={Math.min(100, Math.max(0, 50 + roi / 2))} 
                                    className="h-1"
                                />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Learning Stats */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Learning System
                    </CardTitle>
                    <CardDescription>Adaptive model statistics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current Learning Rate</span>
                        <span className="font-mono">{learnedState.learningRate.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Log-Loss Score</span>
                        <span className="font-mono">{learnedState.currentLogLoss.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Brier Score</span>
                        <span className="font-mono">{metrics.brierScore.toFixed(3)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        The model automatically adjusts feature weights to minimize prediction error
                    </p>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5" />
                        Quick Actions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ResetAppMemoryButton onReset={onReset} />
                    <p className="text-xs text-muted-foreground mt-2">
                        Clear all race history and reset the learning model to start fresh
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
