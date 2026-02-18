import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { type LearnedState } from '@/storage/localMemoryStore';
import { type RaceEntry } from '@/features/entries/types';
import { calculateMetrics } from '@/features/learning/metrics';

interface StatsAnalyticsViewProps {
    entries: RaceEntry[];
    learnedState: LearnedState;
}

export function StatsAnalyticsView({ entries, learnedState }: StatsAnalyticsViewProps) {
    const metrics = calculateMetrics(entries, learnedState.totalBetAmount, learnedState.totalPayout);

    if (entries.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Activity className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">No statistics available yet</p>
                    <p className="text-sm text-muted-foreground text-center">
                        Record some races to see detailed analytics
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Betting Performance Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Betting Performance
                    </CardTitle>
                    <CardDescription>Overall betting statistics and ROI tracking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Prediction Accuracy</div>
                            <div className="text-2xl font-bold">{metrics.accuracy}%</div>
                            <Progress value={metrics.accuracy} className="h-2" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">Overall ROI</div>
                            <div className={`text-2xl font-bold ${metrics.overallROI >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {metrics.overallROI >= 0 ? '+' : ''}{metrics.overallROI}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                                ${metrics.totalPayout.toLocaleString()} / ${metrics.totalBetAmount.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {metrics.brierScore > 0 && (
                        <div className="pt-3 border-t border-border">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Calibration Score</span>
                                </div>
                                <span className="text-lg font-bold">{(1 - metrics.brierScore).toFixed(3)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Measures how well predicted probabilities match actual outcomes (1.0 is perfect)
                            </p>
                        </div>
                    )}

                    {Object.keys(metrics.strategyROI).length > 0 && (
                        <div className="pt-3 border-t border-border">
                            <div className="text-sm font-medium mb-2">Strategy Performance</div>
                            {Object.entries(metrics.strategyROI).map(([strategyId, roi]) => (
                                <div key={strategyId} className="flex items-center justify-between text-sm py-1">
                                    <span className="text-muted-foreground">{strategyId}</span>
                                    <span className={`font-medium ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {roi >= 0 ? '+' : ''}{roi}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Contender Statistics with Win/Place/Show */}
            <Card>
                <CardHeader>
                    <CardTitle>Contender Statistics</CardTitle>
                    <CardDescription>Win, Place, and Show percentages by position number</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {Object.entries(learnedState.contenderStats)
                            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
                            .map(([number, stats]) => {
                                const winRate = stats.appearances > 0 
                                    ? Math.round((stats.wins / stats.appearances) * 100) 
                                    : 0;
                                const placeRate = stats.appearances > 0 
                                    ? Math.round((stats.places / stats.appearances) * 100) 
                                    : 0;
                                const showRate = stats.appearances > 0 
                                    ? Math.round((stats.shows / stats.appearances) * 100) 
                                    : 0;
                                
                                const streak = learnedState.streakData[number];
                                const variance = learnedState.varianceData[number];
                                
                                return (
                                    <div key={number} className="p-4 border border-border rounded-lg space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-lg px-3 py-1">
                                                    #{number}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {stats.appearances} races
                                                </span>
                                            </div>
                                            {streak && streak.type !== 'none' && (
                                                <div className="flex items-center gap-1">
                                                    {streak.type === 'win' && <TrendingUp className="h-4 w-4 text-green-600" />}
                                                    {streak.type === 'podium' && <TrendingUp className="h-4 w-4 text-blue-600" />}
                                                    {streak.type === 'loss' && <TrendingDown className="h-4 w-4 text-red-600" />}
                                                    <span className="text-xs font-medium">
                                                        {Math.abs(streak.currentStreak)} {streak.type}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="space-y-1">
                                                <div className="text-xs text-muted-foreground">Win %</div>
                                                <div className="text-lg font-bold">{winRate}%</div>
                                                <Progress value={winRate} className="h-1.5" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs text-muted-foreground">Place %</div>
                                                <div className="text-lg font-bold">{placeRate}%</div>
                                                <Progress value={placeRate} className="h-1.5" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-xs text-muted-foreground">Show %</div>
                                                <div className="text-lg font-bold">{showRate}%</div>
                                                <Progress value={showRate} className="h-1.5" />
                                            </div>
                                        </div>

                                        {variance && (
                                            <div className="pt-2 border-t border-border">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-muted-foreground">Consistency</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {variance.consistency === 'high' && '🎯 High'}
                                                        {variance.consistency === 'medium' && '➖ Medium'}
                                                        {variance.consistency === 'low' && '⚠️ Low'}
                                                        {variance.consistency === 'unknown' && '❓ Unknown'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        )}

                                        {stats.recentForm.length > 0 && (
                                            <div className="pt-2 border-t border-border">
                                                <div className="text-xs text-muted-foreground mb-2">Recent Form (Last 5)</div>
                                                <div className="flex gap-2">
                                                    {stats.recentForm.map((race, idx) => (
                                                        <div key={idx} className="flex-1">
                                                            <Badge 
                                                                variant={race.position === 1 ? 'default' : race.position > 0 ? 'secondary' : 'outline'}
                                                                className="w-full justify-center text-xs"
                                                            >
                                                                {race.position > 0 ? `${race.position}${race.position === 1 ? 'st' : race.position === 2 ? 'nd' : 'rd'}` : 'Out'}
                                                            </Badge>
                                                            {race.margin !== undefined && (
                                                                <div className="text-center text-xs text-muted-foreground mt-0.5">
                                                                    {race.margin.toFixed(1)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                </CardContent>
            </Card>

            {/* Learning Weights */}
            <Card>
                <CardHeader>
                    <CardTitle>Adaptive Learning Weights</CardTitle>
                    <CardDescription>Current signal weights used in predictions (auto-adjusted)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Odds Signal</span>
                            <span className="text-sm font-medium">{learnedState.signalWeights.oddsWeight.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Historical Win Rate</span>
                            <span className="text-sm font-medium">{learnedState.signalWeights.historicalWinRateWeight.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Recent Form</span>
                            <span className="text-sm font-medium">{learnedState.signalWeights.recentFormWeight.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Streak/Momentum</span>
                            <span className="text-sm font-medium">{learnedState.signalWeights.streakWeight.toFixed(2)}</span>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                        Weights are automatically adjusted based on prediction accuracy to improve over time.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
