import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, DollarSign, Target, Trophy } from 'lucide-react';
import { type RaceEntry, type Contender, type BetDetails } from './types';
import { validateContenders, validatePodium, validateMargins } from './validation';
import { makePrediction, type PredictionResult } from '@/features/learning/model';
import { type LearnedState } from '@/storage/localMemoryStore';
import { calculateBetSize } from '@/lib/betSizing';
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
    const [step, setStep] = useState<'odds' | 'predict' | 'outcome'>('odds');
    const [contenders, setContenders] = useState<Contender[]>(
        FIXED_CONTENDERS.map(num => ({ number: num, odds: 0 }))
    );
    const [firstPlace, setFirstPlace] = useState('');
    const [secondPlace, setSecondPlace] = useState('');
    const [thirdPlace, setThirdPlace] = useState('');
    const [firstPlaceMargin, setFirstPlaceMargin] = useState('');
    const [secondPlaceMargin, setSecondPlaceMargin] = useState('');
    const [thirdPlaceMargin, setThirdPlaceMargin] = useState('');
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);
    const [betHorse, setBetHorse] = useState('');
    const [betAmount, setBetAmount] = useState(5000);
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
        setBetHorse(result.winner);
        setStep('predict');
    };

    const handleSave = () => {
        const contenderValidation = validateContenders(contenders);
        const podiumValidation = validatePodium(firstPlace, secondPlace, thirdPlace, contenders);
        const marginValidation = validateMargins(firstPlaceMargin, secondPlaceMargin, thirdPlaceMargin);

        const allErrors = [
            ...contenderValidation.errors,
            ...podiumValidation.errors,
            ...marginValidation.errors
        ];

        if (allErrors.length > 0) {
            setErrors(allErrors);
            return;
        }

        // Prepare bet details
        let betDetails: BetDetails | undefined;
        if (betHorse && betAmount >= 100 && betAmount <= 10000) {
            const betHorseOdds = contenders.find(c => c.number === betHorse)?.odds || 0;
            betDetails = {
                betHorseNumber: betHorse,
                betAmount,
                oddsUsed: betHorseOdds,
                result: betHorse === firstPlace ? 'win' : 'loss'
            };
        }

        // Parse margins (optional)
        const parsedFirstMargin = firstPlaceMargin ? parseFloat(firstPlaceMargin) : undefined;
        const parsedSecondMargin = secondPlaceMargin ? parseFloat(secondPlaceMargin) : undefined;
        const parsedThirdMargin = thirdPlaceMargin ? parseFloat(thirdPlaceMargin) : undefined;

        const entry: RaceEntry = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            contenders: contenders,
            predictedWinner: prediction?.winner || '',
            actualWinner: firstPlace,
            confidence: prediction?.confidence || 0,
            firstPlace,
            secondPlace,
            thirdPlace,
            firstPlaceMargin: parsedFirstMargin,
            secondPlaceMargin: parsedSecondMargin,
            thirdPlaceMargin: parsedThirdMargin,
            impliedProbabilities: prediction?.impliedProbabilities,
            strategyId: prediction?.strategyId,
            betDetails
        };

        onSave(entry);
        toast.success('Race entry saved successfully!');

        // Reset form
        setContenders(FIXED_CONTENDERS.map(num => ({ number: num, odds: 0 })));
        setFirstPlace('');
        setSecondPlace('');
        setThirdPlace('');
        setFirstPlaceMargin('');
        setSecondPlaceMargin('');
        setThirdPlaceMargin('');
        setPrediction(null);
        setBetHorse('');
        setBetAmount(5000);
        setErrors([]);
        setStep('odds');
    };

    const betSuggestion = prediction && betHorse ? 
        calculateBetSize(prediction.impliedProbabilities[betHorse] || 0, contenders.find(c => c.number === betHorse)?.odds || 0) : 
        null;

    return (
        <div className="space-y-6">
            {step === 'odds' && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Race Contenders</CardTitle>
                            <CardDescription>Enter odds for contenders 1-6 (fractional format X/1)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {contenders.map((contender, index) => (
                                <div key={index} className="flex gap-3 items-center pb-3 border-b border-border last:border-0">
                                    <div className="w-16 shrink-0">
                                        <Badge variant="outline" className="text-base px-3 py-2 w-full justify-center">
                                            #{contender.number}
                                        </Badge>
                                    </div>
                                    <div className="flex-1">
                                        <Label htmlFor={`odds-${index}`} className="text-xs text-muted-foreground">
                                            Odds (X/1)
                                        </Label>
                                        <Input
                                            id={`odds-${index}`}
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            placeholder="e.g., 5.0"
                                            value={contender.odds || ''}
                                            onChange={(e) => updateContenderOdds(index, e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {errors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                <ul className="list-disc list-inside space-y-1">
                                    {errors.map((error, idx) => (
                                        <li key={idx}>{error}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    <Button onClick={handlePredict} className="w-full" size="lg">
                        <TrendingUp className="mr-2 h-5 w-5" />
                        Make Prediction
                    </Button>
                </>
            )}

            {step === 'predict' && prediction && (
                <>
                    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Prediction Result
                            </CardTitle>
                            <CardDescription>Adaptive prediction using odds, historical data, and learning</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center py-4">
                                <div className="text-sm text-muted-foreground mb-2">Predicted Winner</div>
                                <div className="text-5xl font-bold mb-3">#{prediction.winner}</div>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-2xl">{getConfidenceEmoji(prediction.confidence)}</span>
                                    <Badge className={`${getConfidenceColor(prediction.confidence)} text-white text-base px-4 py-1`}>
                                        {prediction.confidence}% Confidence
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4 border-t border-border">
                                <div className="text-sm font-medium text-muted-foreground mb-2">
                                    Implied Probabilities
                                </div>
                                {Object.entries(prediction.impliedProbabilities)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([num, prob]) => (
                                        <div key={num} className="flex items-center gap-3">
                                            <Badge variant="outline" className="w-12 justify-center">
                                                #{num}
                                            </Badge>
                                            <div className="flex-1 flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all"
                                                        style={{ width: `${prob}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium w-12 text-right">{prob}%</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Bet Sizing (Optional)
                            </CardTitle>
                            <CardDescription>Record your bet for performance tracking (100-10,000 range)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="bet-horse">Horse to Bet On</Label>
                                <Select value={betHorse} onValueChange={setBetHorse}>
                                    <SelectTrigger id="bet-horse">
                                        <SelectValue placeholder="Select horse" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contenders.map((c) => (
                                            <SelectItem key={c.number} value={c.number}>
                                                #{c.number} ({prediction.impliedProbabilities[c.number]}% probability)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bet-amount">Bet Amount</Label>
                                <Select value={betAmount.toString()} onValueChange={(v) => setBetAmount(parseInt(v))}>
                                    <SelectTrigger id="bet-amount">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="100">$100</SelectItem>
                                        <SelectItem value="500">$500</SelectItem>
                                        <SelectItem value="1000">$1,000</SelectItem>
                                        <SelectItem value="2000">$2,000</SelectItem>
                                        <SelectItem value="3000">$3,000</SelectItem>
                                        <SelectItem value="4000">$4,000</SelectItem>
                                        <SelectItem value="5000">$5,000</SelectItem>
                                        <SelectItem value="6000">$6,000</SelectItem>
                                        <SelectItem value="7000">$7,000</SelectItem>
                                        <SelectItem value="8000">$8,000</SelectItem>
                                        <SelectItem value="9000">$9,000</SelectItem>
                                        <SelectItem value="10000">$10,000</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {betSuggestion && (
                                <Alert>
                                    <AlertDescription>
                                        <div className="font-medium mb-1">Suggested: ${betSuggestion.amount.toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground">{betSuggestion.explanation}</div>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>

                    <Button onClick={() => setStep('outcome')} className="w-full" size="lg">
                        <Trophy className="mr-2 h-5 w-5" />
                        Record Race Outcome
                    </Button>
                </>
            )}

            {step === 'outcome' && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trophy className="h-5 w-5" />
                                Race Outcome
                            </CardTitle>
                            <CardDescription>Select the top 3 finishers and optionally record margins</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="first-place">1st Place</Label>
                                <Select value={firstPlace} onValueChange={setFirstPlace}>
                                    <SelectTrigger id="first-place">
                                        <SelectValue placeholder="Select winner" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contenders.map((c) => (
                                            <SelectItem key={c.number} value={c.number}>
                                                #{c.number}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="first-margin" className="text-sm text-muted-foreground">
                                    1st place margin (optional)
                                </Label>
                                <Input
                                    id="first-margin"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    placeholder="e.g., 2.5"
                                    value={firstPlaceMargin}
                                    onChange={(e) => setFirstPlaceMargin(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="second-place">2nd Place</Label>
                                <Select value={secondPlace} onValueChange={setSecondPlace}>
                                    <SelectTrigger id="second-place">
                                        <SelectValue placeholder="Select 2nd place" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contenders.map((c) => (
                                            <SelectItem key={c.number} value={c.number}>
                                                #{c.number}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="second-margin" className="text-sm text-muted-foreground">
                                    2nd place margin (optional)
                                </Label>
                                <Input
                                    id="second-margin"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    placeholder="e.g., 1.0"
                                    value={secondPlaceMargin}
                                    onChange={(e) => setSecondPlaceMargin(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="third-place">3rd Place</Label>
                                <Select value={thirdPlace} onValueChange={setThirdPlace}>
                                    <SelectTrigger id="third-place">
                                        <SelectValue placeholder="Select 3rd place" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contenders.map((c) => (
                                            <SelectItem key={c.number} value={c.number}>
                                                #{c.number}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="third-margin" className="text-sm text-muted-foreground">
                                    3rd place margin (optional)
                                </Label>
                                <Input
                                    id="third-margin"
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    placeholder="e.g., 0.5"
                                    value={thirdPlaceMargin}
                                    onChange={(e) => setThirdPlaceMargin(e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {errors.length > 0 && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                <ul className="list-disc list-inside space-y-1">
                                    {errors.map((error, idx) => (
                                        <li key={idx}>{error}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}

                    <Button onClick={handleSave} className="w-full" size="lg">
                        Save Race Entry
                    </Button>
                </>
            )}
        </div>
    );
}
