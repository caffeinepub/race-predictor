import { type LearnedState } from '@/storage/localMemoryStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { StatusEmoji } from '@/components/StatusEmoji';

interface StatsAnalyticsViewProps {
    learnedState: LearnedState;
}

export function StatsAnalyticsView({ learnedState }: StatsAnalyticsViewProps) {
    const contenderIds = Object.keys(learnedState.contenderStats);

    if (contenderIds.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Contender Statistics</CardTitle>
                    <CardDescription>No data yet. Record some races to see stats.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Learning Weights</CardTitle>
                    <CardDescription>
                        Model uses log-loss gradient descent to optimize these feature weights based on prediction accuracy
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Odds Weight</span>
                            <span className="font-mono">{learnedState.signalWeights.oddsWeight.toFixed(2)}</span>
                        </div>
                        <Progress value={learnedState.signalWeights.oddsWeight * 33} />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Historical Win Rate Weight</span>
                            <span className="font-mono">{learnedState.signalWeights.historicalWinRateWeight.toFixed(2)}</span>
                        </div>
                        <Progress value={learnedState.signalWeights.historicalWinRateWeight * 33} />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Recent Form Weight</span>
                            <span className="font-mono">{learnedState.signalWeights.recentFormWeight.toFixed(2)}</span>
                        </div>
                        <Progress value={learnedState.signalWeights.recentFormWeight * 33} />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Streak Weight</span>
                            <span className="font-mono">{learnedState.signalWeights.streakWeight.toFixed(2)}</span>
                        </div>
                        <Progress value={learnedState.signalWeights.streakWeight * 33} />
                    </div>
                    {learnedState.currentLogLoss > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <div className="flex justify-between text-sm">
                                <span>Current Log-Loss</span>
                                <span className="font-mono">{learnedState.currentLogLoss.toFixed(3)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Lower is better. Weights adjust automatically to minimize this value.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Contender Performance</CardTitle>
                    <CardDescription>
                        Blended stats: 60% recent window ({learnedState.recentWindowSize} races) + 40% lifetime
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {contenderIds.map(contenderId => {
                            const stats = learnedState.contenderStats[contenderId];
                            const winPct = stats.appearances > 0 ? (stats.wins / stats.appearances) * 100 : 0;
                            const placePct = stats.appearances > 0 ? (stats.places / stats.appearances) * 100 : 0;
                            const showPct = stats.appearances > 0 ? (stats.shows / stats.appearances) * 100 : 0;
                            const podiumPct = stats.appearances > 0 
                                ? ((stats.wins + stats.places + stats.shows) / stats.appearances) * 100 
                                : 0;

                            const variance = learnedState.varianceData[contenderId];
                            const consistency = variance?.consistency || 'unknown';

                            // Odds movement display
                            let oddsMovementDisplay = 'N/A';
                            let oddsMovementIcon = '➡️';
                            if (stats.oddsMovement !== null) {
                                if (stats.oddsMovement > 0.05) {
                                    oddsMovementDisplay = 'Rising';
                                    oddsMovementIcon = '⬆️';
                                } else if (stats.oddsMovement < -0.05) {
                                    oddsMovementDisplay = 'Falling';
                                    oddsMovementIcon = '⬇️';
                                } else {
                                    oddsMovementDisplay = 'Stable';
                                    oddsMovementIcon = '➡️';
                                }
                            }

                            return (
                                <div key={contenderId} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold">Contender {contenderId}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {stats.appearances} race{stats.appearances !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Badge variant={consistency === 'high' ? 'default' : consistency === 'medium' ? 'secondary' : 'outline'}>
                                                {consistency}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div>
                                            <div className="text-muted-foreground">Win</div>
                                            <div className="font-semibold">{winPct.toFixed(1)}%</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Place</div>
                                            <div className="font-semibold">{placePct.toFixed(1)}%</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground">Show</div>
                                            <div className="font-semibold">{showPct.toFixed(1)}%</div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm text-muted-foreground mb-1">Podium Rate</div>
                                        <Progress value={podiumPct} />
                                        <div className="text-xs text-muted-foreground mt-1">{podiumPct.toFixed(1)}%</div>
                                    </div>

                                    <div className="text-sm space-y-1">
                                        <div className="font-medium">Streaks:</div>
                                        <div className="flex flex-wrap gap-3">
                                            <span>
                                                Win: <StatusEmoji emoji="🔥" label="Win streak" /> {stats.winStreak}
                                            </span>
                                            <span>
                                                Place: <StatusEmoji emoji="📈" label="Placer streak" /> {stats.placerStreak}
                                            </span>
                                            <span>
                                                Low: <StatusEmoji emoji="📉" label="Lower streak" /> {stats.lowerStreak}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-sm space-y-1">
                                        <div className="font-medium">Odds Movement:</div>
                                        <div>
                                            <StatusEmoji emoji={oddsMovementIcon} label={`Odds ${oddsMovementDisplay}`} /> {oddsMovementDisplay}
                                        </div>
                                    </div>

                                    <div className="text-sm space-y-1">
                                        <div className="font-medium">Momentum Score:</div>
                                        <div className="flex items-center gap-2">
                                            <Progress value={stats.momentumScore * 100} className="flex-1" />
                                            <span className="font-mono text-xs">{(stats.momentumScore * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>

                                    {stats.recentForm.length > 0 && (
                                        <div className="text-sm">
                                            <div className="font-medium mb-1">Recent Form (last 5):</div>
                                            <div className="flex gap-1">
                                                {stats.recentForm.map((form, i) => (
                                                    <Badge
                                                        key={i}
                                                        variant={
                                                            form.position === 1 ? 'default' :
                                                            form.position === 2 || form.position === 3 ? 'secondary' :
                                                            'outline'
                                                        }
                                                    >
                                                        {form.position === 0 ? 'DNF' : `${form.position}${getOrdinalSuffix(form.position)}`}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Separator />
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function getOrdinalSuffix(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}
