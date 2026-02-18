import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Calendar, TrendingUp, DollarSign, Trophy } from 'lucide-react';
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
                    <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-muted-foreground mb-2">No races recorded yet</p>
                    <p className="text-sm text-muted-foreground text-center">
                        Start making predictions to build your history
                    </p>
                </CardContent>
            </Card>
        );
    }

    const sortedEntries = [...entries].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="space-y-4">
            {sortedEntries.map((entry) => {
                const isCorrect = entry.predictedWinner === entry.actualWinner;
                const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                });

                const betResult = entry.betDetails ? (
                    entry.betDetails.result === 'win' ? 
                        entry.betDetails.betAmount * (entry.betDetails.oddsUsed + 1) - entry.betDetails.betAmount :
                        -entry.betDetails.betAmount
                ) : null;

                return (
                    <Card key={entry.id}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    {date}
                                </div>
                                {isCorrect ? (
                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Correct
                                    </Badge>
                                ) : (
                                    <Badge variant="destructive">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Incorrect
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Predicted:</span>
                                    <div className="font-semibold text-base mt-1">
                                        #{entry.predictedWinner}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Actual:</span>
                                    <div className="font-semibold text-base mt-1">
                                        #{entry.actualWinner}
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm">
                                <span className="text-muted-foreground">Confidence: </span>
                                <span className="font-medium">{entry.confidence}%</span>
                            </div>

                            {entry.betDetails && (
                                <div className="p-3 bg-accent/30 rounded-lg">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-1.5">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">Bet Result:</span>
                                        </div>
                                        <span className={`font-bold ${betResult && betResult > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {betResult && betResult > 0 ? '+' : ''}{betResult ? `$${betResult.toLocaleString()}` : '$0'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        ${entry.betDetails.betAmount.toLocaleString()} on #{entry.betDetails.betHorseNumber} at {formatOdds(entry.betDetails.oddsUsed)}
                                    </div>
                                </div>
                            )}

                            {entry.firstPlace && entry.secondPlace && entry.thirdPlace && (
                                <div className="pt-2 border-t border-border">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                                        <Trophy className="h-3 w-3" />
                                        Podium Finish:
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
                                            1st: #{entry.firstPlace}
                                        </Badge>
                                        <Badge className="bg-gray-400 hover:bg-gray-500 text-white">
                                            2nd: #{entry.secondPlace}
                                        </Badge>
                                        <Badge className="bg-amber-600 hover:bg-amber-700 text-white">
                                            3rd: #{entry.thirdPlace}
                                        </Badge>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 border-t border-border">
                                <div className="text-xs text-muted-foreground mb-2">Contenders:</div>
                                <div className="flex flex-wrap gap-2">
                                    {entry.contenders.map((c, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs">
                                            #{c.number} ({formatOdds(c.odds)})
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
