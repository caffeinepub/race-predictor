import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Target, DollarSign, Trophy, Activity, Zap, BarChart3 } from 'lucide-react';
import { type RaceEntry } from '@/features/entries/types';
import { type LearnedState } from '@/storage/localMemoryStore';
import { calculateMetrics, calculateModelMood } from '@/features/learning/metrics';
import { getAccuracyVisuals, getROIVisuals, getMoodVisuals } from '@/features/learning/accuracyVisuals';
import { StatusEmoji } from '@/components/StatusEmoji';
import { ResetAppMemoryButton } from '@/features/reset/ResetAppMemoryButton';
import { MobilePageContainer } from '@/components/MobilePageContainer';
import { toDecimalOdds } from '@/lib/oddsFormat';

interface DashboardViewProps {
    entries: RaceEntry[];
    learnedState: LearnedState;
    onReset: () => void;
}

export function DashboardView({ entries, learnedState, onReset }: DashboardViewProps) {
    const metrics = calculateMetrics(entries, learnedState.totalBetAmount, learnedState.totalPayout);
    const modelMood = calculateModelMood(entries);
    const moodVisuals = getMoodVisuals(modelMood.mood);
    const accuracyVisuals = getAccuracyVisuals(metrics.accuracy);
    const roiVisuals = getROIVisuals(metrics.overallROI);

    // Calculate recent races (last 10)
    const recentRaces = entries.slice(-10).reverse();

    // Calculate strategy performance breakdown
    const strategyPerformance = Object.entries(metrics.strategyROI).map(([strategy, roi]) => ({
        strategy,
        roi
    }));

    return (
        <MobilePageContainer>
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <p className="text-muted-foreground">Your race prediction performance at a glance</p>
                </div>

                {/* Main Stats Cards */}
                <div className="grid grid-cols-1 gap-4">
                    {/* Total Races */}
                    <Card className="border-2">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-primary" />
                                    Total Races
                                </CardTitle>
                                <div className="text-3xl font-bold">{metrics.totalRaces}</div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {metrics.totalRaces === 0 
                                    ? 'Start recording races to see your stats'
                                    : `${metrics.correctPredictions} correct predictions`}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Prediction Accuracy */}
                    <Card className="border-2">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="h-5 w-5 text-primary" />
                                    Prediction Accuracy
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <StatusEmoji 
                                        emoji={accuracyVisuals.emoji} 
                                        label={`${metrics.accuracy}% accuracy`}
                                        className="text-2xl"
                                    />
                                    <div className="text-3xl font-bold">{metrics.accuracy}%</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Progress value={metrics.accuracy} className="h-2" />
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Recent (last 10):</span>
                                <span className="font-semibold">{metrics.recentAccuracy}%</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* ROI */}
                    <Card className="border-2">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    Return on Investment
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    <StatusEmoji 
                                        emoji={roiVisuals.emoji} 
                                        label={roiVisuals.label}
                                        className="text-2xl"
                                    />
                                    <div className={`text-3xl font-bold ${metrics.overallROI >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {metrics.overallROI > 0 ? '+' : ''}{metrics.overallROI}%
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Bet:</span>
                                <span className="font-semibold">${metrics.totalBetAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Payout:</span>
                                <span className="font-semibold">${metrics.totalPayout.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Net Profit:</span>
                                <span className={`font-semibold ${(metrics.totalPayout - metrics.totalBetAmount) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    ${(metrics.totalPayout - metrics.totalBetAmount).toLocaleString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Model Mood */}
                {entries.length >= 5 && (
                    <Card className="border-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Model Mood
                            </CardTitle>
                            <CardDescription>Current prediction model confidence</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <StatusEmoji 
                                        emoji={moodVisuals.emoji} 
                                        label={moodVisuals.label}
                                        className="text-4xl"
                                    />
                                    <div>
                                        <div className="font-semibold text-lg">
                                            <span className={moodVisuals.color}>{modelMood.mood}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">{modelMood.label}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold">{modelMood.confidence}%</div>
                                    <div className="text-xs text-muted-foreground">Confidence</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Strategy Performance Breakdown */}
                {strategyPerformance.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5" />
                                Strategy Performance
                            </CardTitle>
                            <CardDescription>ROI breakdown by strategy profile</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {strategyPerformance.map(({ strategy, roi }) => (
                                <div key={strategy} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline">{strategy}</Badge>
                                    </div>
                                    <div className={`font-semibold ${roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {roi > 0 ? '+' : ''}{roi}%
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Recent Race Outcomes */}
                {recentRaces.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Recent Races
                            </CardTitle>
                            <CardDescription>Last {Math.min(10, recentRaces.length)} race outcomes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {recentRaces.map((entry, index) => {
                                    const isWin = entry.predictedWinner === entry.actualWinner;
                                    const betWin = entry.betDetails?.result === 'win';
                                    return (
                                        <div key={entry.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                                            <div className="flex items-center gap-3">
                                                <div className="text-sm text-muted-foreground w-8">
                                                    #{recentRaces.length - index}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <StatusEmoji 
                                                        emoji={isWin ? '✅' : '❌'} 
                                                        label={isWin ? 'Correct prediction' : 'Incorrect prediction'}
                                                        className="text-lg"
                                                    />
                                                    <div className="text-sm">
                                                        <span className="font-medium">Predicted: {entry.predictedWinner}</span>
                                                        <span className="text-muted-foreground"> → Actual: {entry.actualWinner}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {entry.betDetails && (
                                                <Badge variant={betWin ? 'default' : 'destructive'} className="text-xs">
                                                    {betWin ? `+$${((entry.betDetails.betAmount * toDecimalOdds(entry.betDetails.oddsUsed)) - entry.betDetails.betAmount).toFixed(0)}` : `-$${entry.betDetails.betAmount}`}
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>Manage your app data</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResetAppMemoryButton onReset={onReset} />
                        <p className="text-xs text-muted-foreground mt-3">
                            Reset will permanently delete all race entries and learned prediction data.
                        </p>
                    </CardContent>
                </Card>

                {/* Empty State */}
                {entries.length === 0 && (
                    <Card className="border-2 border-dashed">
                        <CardContent className="pt-6 text-center space-y-4">
                            <div className="text-6xl">🐎</div>
                            <div>
                                <h3 className="font-semibold text-lg mb-2">No races recorded yet</h3>
                                <p className="text-sm text-muted-foreground">
                                    Start recording race entries to see your performance stats and insights.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </MobilePageContainer>
    );
}
