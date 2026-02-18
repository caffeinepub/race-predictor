import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar } from 'lucide-react';
import { type RaceEntry } from '@/features/entries/types';
import { formatOdds } from '@/lib/oddsFormat';

interface HistoryListProps {
    entries: RaceEntry[];
}

export function HistoryList({ entries }: HistoryListProps) {
    if (entries.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">No race history yet</p>
                    <p className="text-sm text-muted-foreground text-center">
                        Start recording races to build your prediction history
                    </p>
                </CardContent>
            </Card>
        );
    }

    const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="space-y-4">
            {sortedEntries.map((entry) => {
                const wasCorrect = entry.predictedWinner === entry.actualWinner;
                const date = new Date(entry.timestamp);

                return (
                    <Card key={entry.id}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <CardDescription>
                                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </CardDescription>
                                </div>
                                <Badge variant={wasCorrect ? 'default' : 'destructive'}>
                                    {wasCorrect ? '✓ Correct' : '✗ Incorrect'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">Predicted</div>
                                    <Badge variant="outline" className="text-base px-3 py-1">
                                        Horse {entry.predictedWinner}
                                    </Badge>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {entry.confidence}% confidence
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-muted-foreground mb-1">Actual Winner</div>
                                    <Badge variant="default" className="text-base px-3 py-1">
                                        Horse {entry.actualWinner}
                                    </Badge>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <Trophy className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Podium Finish</span>
                                </div>
                                <div className="flex gap-2">
                                    {entry.firstPlace && (
                                        <Badge variant="default" className="flex-1 justify-center">
                                            🥇 {entry.firstPlace}
                                        </Badge>
                                    )}
                                    {entry.secondPlace && (
                                        <Badge variant="secondary" className="flex-1 justify-center">
                                            🥈 {entry.secondPlace}
                                        </Badge>
                                    )}
                                    {entry.thirdPlace && (
                                        <Badge variant="outline" className="flex-1 justify-center">
                                            🥉 {entry.thirdPlace}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            {entry.betDetails && (
                                <div className="pt-3 border-t border-border">
                                    <div className="text-xs text-muted-foreground mb-2">Bet Details</div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Horse {entry.betDetails.betHorseNumber} @ {formatOdds(entry.betDetails.oddsUsed)}</span>
                                        <span className={`font-medium ${entry.betDetails.result === 'win' ? 'text-green-600' : 'text-red-600'}`}>
                                            ${entry.betDetails.betAmount.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
