import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Award } from 'lucide-react';
import { type RaceEntry } from '@/features/entries/types';
import { type LearnedState } from '@/storage/localMemoryStore';
import { calculateMetrics } from './metrics';

interface LearningSummaryCardProps {
    entries: RaceEntry[];
    learnedState: LearnedState;
}

export function LearningSummaryCard({ entries, learnedState }: LearningSummaryCardProps) {
    const metrics = calculateMetrics(entries);

    if (metrics.totalRaces === 0) {
        return (
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Learning Status
                    </CardTitle>
                    <CardDescription>The AI will improve as you add more race data</CardDescription>
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

    return (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Learning Status
                </CardTitle>
                <CardDescription>
                    Trained on {metrics.totalRaces} race{metrics.totalRaces !== 1 ? 's' : ''}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Overall Accuracy</span>
                        </div>
                        <span className="font-bold text-lg">{metrics.accuracy}%</span>
                    </div>
                    <Progress value={metrics.accuracy} className="h-2" />
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
