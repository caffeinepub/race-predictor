import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';
import { type RaceEntry, type Contender } from './types';
import { validateContenders, validateWinner } from './validation';
import { makePrediction } from '@/features/learning/model';
import { type LearnedState } from '@/storage/localMemoryStore';
import { toast } from 'sonner';

interface EntryFlowProps {
    onSave: (entry: RaceEntry) => void;
    learnedState: LearnedState;
}

const FIXED_CONTENDERS = ['1', '2', '3', '4', '5', '6'];

function getConfidenceColor(confidence: number): string {
    if (confidence < 40) {
        return 'bg-red-500';
    } else if (confidence < 60) {
        return 'bg-orange-500';
    } else if (confidence < 75) {
        return 'bg-yellow-500';
    } else if (confidence < 85) {
        return 'bg-lime-500';
    } else {
        return 'bg-green-500';
    }
}

function getConfidenceEmoji(confidence: number): string {
    if (confidence < 40) {
        return '😰';
    } else if (confidence < 60) {
        return '😕';
    } else if (confidence < 75) {
        return '😐';
    } else if (confidence < 85) {
        return '🙂';
    } else {
        return '😄';
    }
}

export function EntryFlow({ onSave, learnedState }: EntryFlowProps) {
    const [contenders, setContenders] = useState<Contender[]>(
        FIXED_CONTENDERS.map(num => ({ number: num, odds: 0 }))
    );
    const [actualWinner, setActualWinner] = useState('');
    const [prediction, setPrediction] = useState<{ winner: string; confidence: number } | null>(null);
    const [errors, setErrors] = useState<string[]>([]);

    const updateContenderOdds = (index: number, value: string) => {
        const updated = [...contenders];
        updated[index].odds = parseFloat(value) || 0;
        setContenders(updated);
    };

    const handlePredict = () => {
        const validation = validateContenders(contenders);
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        setErrors([]);
        const result = makePrediction(contenders, learnedState);
        setPrediction(result);
    };

    const handleSave = () => {
        const contenderValidation = validateContenders(contenders);
        const winnerValidation = validateWinner(actualWinner, contenders);

        const allErrors = [...contenderValidation.errors, ...winnerValidation.errors];

        if (allErrors.length > 0) {
            setErrors(allErrors);
            return;
        }

        const entry: RaceEntry = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            contenders: contenders,
            predictedWinner: prediction?.winner || '',
            actualWinner,
            confidence: prediction?.confidence || 0
        };

        onSave(entry);
        toast.success('Race entry saved successfully!');

        // Reset form
        setContenders(FIXED_CONTENDERS.map(num => ({ number: num, odds: 0 })));
        setActualWinner('');
        setPrediction(null);
        setErrors([]);
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Race Contenders</CardTitle>
                    <CardDescription>Enter the odds numerator for contenders 1-6 (fractional format X/1)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {contenders.map((contender, index) => (
                        <div key={index} className="flex gap-3 items-center">
                            <div className="w-16 shrink-0">
                                <Badge variant="outline" className="text-base px-3 py-2 w-full justify-center">
                                    #{contender.number}
                                </Badge>
                            </div>
                            <div className="flex-1 flex items-center gap-1">
                                <Label htmlFor={`odds-${index}`} className="text-sm sr-only">
                                    Odds numerator for Contender {contender.number}
                                </Label>
                                <Input
                                    id={`odds-${index}`}
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={contender.odds || ''}
                                    onChange={(e) => updateContenderOdds(index, e.target.value)}
                                    placeholder="-"
                                    className="h-12 text-base"
                                />
                                <span className="text-base font-medium text-muted-foreground whitespace-nowrap">/1</span>
                            </div>
                        </div>
                    ))}

                    <Button type="button" onClick={handlePredict} className="w-full h-12 text-base mt-4">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Make Prediction
                    </Button>
                </CardContent>
            </Card>

            {prediction && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Prediction
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Predicted Winner:</span>
                            <Badge variant="default" className="text-base px-3 py-1">
                                #{prediction.winner}
                            </Badge>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Confidence:</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-primary">{prediction.confidence}%</span>
                                    <span className="text-2xl">{getConfidenceEmoji(prediction.confidence)}</span>
                                </div>
                            </div>
                            <div className="w-full h-6 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-300 ${getConfidenceColor(prediction.confidence)}`}
                                    style={{ width: `${prediction.confidence}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {prediction && (
                <Card>
                    <CardHeader>
                        <CardTitle>Actual Result</CardTitle>
                        <CardDescription>Select the actual winner to save this race</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="actual-winner" className="text-sm">
                                Winner Number
                            </Label>
                            <Select value={actualWinner} onValueChange={setActualWinner}>
                                <SelectTrigger id="actual-winner" className="h-12 text-base">
                                    <SelectValue placeholder="Select winner" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIXED_CONTENDERS.map((num) => (
                                        <SelectItem key={num} value={num} className="text-base">
                                            Contender #{num}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="button" onClick={handleSave} className="w-full h-12 text-base">
                            Save Race Entry
                        </Button>
                    </CardContent>
                </Card>
            )}

            {errors.length > 0 && (
                <Alert variant="destructive">
                    <AlertDescription>
                        <ul className="list-disc list-inside space-y-1">
                            {errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}
