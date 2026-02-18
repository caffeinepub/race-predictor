import { useState } from 'react';
import { type Contender, type RaceEntry, type StrategyProfile } from './types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { validateOdds, validateWinner } from './validation';
import { predictWinner } from '../learning/model';
import { type LearnedState } from '@/storage/localMemoryStore';
import { formatOdds, parseOddsInput, calculateImpliedProbability } from '@/lib/oddsFormat';
import { calculateBetSize } from '@/lib/betSizing';
import { StatusEmoji } from '@/components/StatusEmoji';
import { AlertCircle, TrendingUp, TrendingDown, Target, Zap, AlertTriangle } from 'lucide-react';

interface EntryFlowProps {
    learnedState: LearnedState | null;
    onSubmit: (entry: RaceEntry) => void;
}

export function EntryFlow({ learnedState, onSubmit }: EntryFlowProps) {
    const [step, setStep] = useState<'odds' | 'prediction' | 'result' | 'bet'>('odds');
    const [contenders, setContenders] = useState<Contender[]>([]);
    const [actualWinner, setActualWinner] = useState('');
    const [betAmount, setBetAmount] = useState<string>('');
    const [prediction, setPrediction] = useState<ReturnType<typeof predictWinner> | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const selectedStrategy: StrategyProfile = learnedState?.selectedStrategy || 'Balanced';

    const handleOddsSubmit = () => {
        const newErrors: Record<string, string> = {};
        const newContenders: Contender[] = [];

        for (let i = 1; i <= 6; i++) {
            const oddsInput = (document.getElementById(`odds-${i}`) as HTMLInputElement)?.value;
            
            if (!oddsInput || oddsInput.trim() === '') {
                newErrors[`odds-${i}`] = 'Required';
                continue;
            }

            const oddsData = parseOddsInput(oddsInput);
            const validation = validateOdds(oddsData);
            
            if (!validation.valid) {
                newErrors[`odds-${i}`] = validation.error || 'Invalid odds';
                continue;
            }

            newContenders.push({
                number: i.toString(),
                contenderId: i.toString(),
                laneIndex: i,
                odds: oddsData,
                impliedProbability: calculateImpliedProbability(oddsData)
            });
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setContenders(newContenders);
        setErrors({});

        // Generate prediction
        const predictionResult = predictWinner(newContenders, learnedState, selectedStrategy);
        setPrediction(predictionResult);
        setStep('prediction');
    };

    const handlePredictionConfirm = () => {
        setStep('result');
    };

    const handleResultSubmit = () => {
        const validation = validateWinner(actualWinner, contenders);
        if (!validation.valid) {
            setErrors({ winner: validation.error || 'Invalid winner' });
            return;
        }

        setErrors({});
        setStep('bet');
    };

    const handleBetSubmit = () => {
        if (!prediction) return;

        const finalBetAmount = parseFloat(betAmount);
        
        if (isNaN(finalBetAmount) || finalBetAmount < 0 || finalBetAmount > 10000) {
            setErrors({ bet: 'Bet amount must be between $0 and $10,000' });
            return;
        }

        const predictedContender = contenders.find(c => c.number === prediction.predictedWinner);
        const actualContender = contenders.find(c => c.number === actualWinner);

        if (!predictedContender || !actualContender) return;

        // Determine podium positions
        const firstPlace = actualWinner;
        const secondPlace = undefined; // Not tracked in this flow
        const thirdPlace = undefined;

        const entry: RaceEntry = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            contenders,
            predictedWinner: prediction.predictedWinner,
            actualWinner,
            confidence: prediction.confidence,
            firstPlace,
            secondPlace,
            thirdPlace,
            impliedProbabilities: prediction.impliedProbabilities,
            predictedProbabilities: prediction.probabilities,
            actualResults: contenders.reduce((acc, c) => {
                acc[c.number] = c.number === actualWinner ? 1 : 0;
                return acc;
            }, {} as Record<string, number>),
            strategyId: selectedStrategy,
            betDetails: finalBetAmount > 0 ? {
                betHorseNumber: prediction.predictedWinner,
                betAmount: finalBetAmount,
                oddsUsed: predictedContender.odds,
                result: prediction.predictedWinner === actualWinner ? 'win' : 'loss'
            } : undefined
        };

        onSubmit(entry);

        // Reset form
        setStep('odds');
        setContenders([]);
        setActualWinner('');
        setBetAmount('');
        setPrediction(null);
        setErrors({});
    };

    const handleSkipBet = () => {
        if (!prediction) return;

        const entry: RaceEntry = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            contenders,
            predictedWinner: prediction.predictedWinner,
            actualWinner,
            confidence: prediction.confidence,
            firstPlace: actualWinner,
            impliedProbabilities: prediction.impliedProbabilities,
            predictedProbabilities: prediction.probabilities,
            actualResults: contenders.reduce((acc, c) => {
                acc[c.number] = c.number === actualWinner ? 1 : 0;
                return acc;
            }, {} as Record<string, number>),
            strategyId: selectedStrategy
        };

        onSubmit(entry);

        // Reset form
        setStep('odds');
        setContenders([]);
        setActualWinner('');
        setBetAmount('');
        setPrediction(null);
        setErrors({});
    };

    if (step === 'odds') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Enter Race Odds</CardTitle>
                    <CardDescription>
                        Enter the numerator for all 6 contenders (e.g., 5 for 5/1 odds)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5, 6].map(num => (
                            <div key={num} className="space-y-2">
                                <Label htmlFor={`odds-${num}`}>Contender {num}</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        id={`odds-${num}`}
                                        type="number"
                                        min="0"
                                        step="0.1"
                                        placeholder="O"
                                        className={errors[`odds-${num}`] ? 'border-destructive' : ''}
                                    />
                                    <span className="text-lg font-medium text-muted-foreground">/1</span>
                                </div>
                                {errors[`odds-${num}`] && (
                                    <p className="text-sm text-destructive">{errors[`odds-${num}`]}</p>
                                )}
                            </div>
                        ))}
                        <Button onClick={handleOddsSubmit} className="w-full">
                            Generate Prediction
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (step === 'prediction' && prediction) {
        const suggestedBet = calculateBetSize(
            prediction.confidence / 100,
            prediction.impliedProbabilities[prediction.predictedWinner],
            100,
            prediction.skipRace,
            prediction.signalAgreement || 1.0
        );

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Prediction Result</CardTitle>
                    <CardDescription>Strategy: {selectedStrategy}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {prediction.skipRace && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Skip Recommendation:</strong> {prediction.skipReason}
                            </AlertDescription>
                        </Alert>
                    )}

                    {prediction.uncertaintyFlag && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Signals Diverge - Uncertain Prediction</strong>
                                <br />
                                The prediction signals are not in agreement. Consider a lower bet or skip this race.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Predicted Winner</span>
                            <Badge variant="default" className="text-lg px-4 py-1">
                                Contender {prediction.predictedWinner}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Confidence</span>
                            <span className="text-2xl font-bold">{prediction.confidence.toFixed(1)}%</span>
                        </div>
                        {prediction.signalAgreementLabel && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Signal Agreement</span>
                                <Badge variant={
                                    prediction.signalAgreementLabel === 'High Agreement' ? 'default' :
                                    prediction.signalAgreementLabel === 'Mixed Signals' ? 'destructive' :
                                    'secondary'
                                }>
                                    {prediction.signalAgreementLabel === 'High Agreement' && <StatusEmoji emoji="✅" label="High agreement" />}
                                    {prediction.signalAgreementLabel === 'Mixed Signals' && <StatusEmoji emoji="⚠️" label="Mixed signals" />}
                                    {' '}{prediction.signalAgreementLabel}
                                </Badge>
                            </div>
                        )}
                    </div>

                    {prediction.signalAgreementLabel === 'High Agreement' && (
                        <p className="text-sm text-muted-foreground">
                            <StatusEmoji emoji="✅" label="High agreement" /> Prediction signals strongly agree on this pick
                        </p>
                    )}
                    {prediction.signalAgreementLabel === 'Mixed Signals' && (
                        <p className="text-sm text-muted-foreground">
                            <StatusEmoji emoji="⚠️" label="Mixed signals" /> Prediction signals are mixed - consider lower bet or skip
                        </p>
                    )}

                    {prediction.hotStreakBoost && (
                        <Alert>
                            <Zap className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Hot Streak Detected!</strong> Contender {prediction.hotStreakBoost.contenderId} has won {prediction.hotStreakBoost.streakLength} consecutive races. 
                                Confidence boosted by {((prediction.hotStreakBoost.boostFactor - 1) * 100).toFixed(0)}%.
                            </AlertDescription>
                        </Alert>
                    )}

                    <Separator />

                    <div className="space-y-3">
                        <h3 className="font-semibold flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Explain the Pick
                        </h3>
                        <div className="space-y-2">
                            {prediction.signalBreakdown?.map((signal, i) => {
                                const percentage = (signal.value * 100).toFixed(1);
                                const isPositive = signal.value >= 0;
                                return (
                                    <div key={i} className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">{signal.signal}</span>
                                        <div className="flex items-center gap-2">
                                            {isPositive ? (
                                                <TrendingUp className="h-3 w-3 text-green-600" />
                                            ) : (
                                                <TrendingDown className="h-3 w-3 text-red-600" />
                                            )}
                                            <span className={`font-mono ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                {isPositive ? '+' : ''}{percentage}%
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <h3 className="font-semibold">All Probabilities</h3>
                        <div className="space-y-1">
                            {Object.entries(prediction.probabilities)
                                .sort(([, a], [, b]) => b - a)
                                .map(([num, prob]) => (
                                    <div key={num} className="flex justify-between text-sm">
                                        <span>Contender {num}</span>
                                        <span className="font-mono">{(prob * 100).toFixed(1)}%</span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h3 className="font-semibold">Suggested Bet</h3>
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Amount:</span>
                                <span className="text-2xl font-bold">${suggestedBet.amount.toFixed(0)}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{suggestedBet.explanation}</p>
                        </div>
                    </div>

                    <Button onClick={handlePredictionConfirm} className="w-full">
                        Continue to Result Entry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (step === 'result') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Enter Race Result</CardTitle>
                    <CardDescription>Which contender won the race?</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="winner">Winning Contender</Label>
                            <Input
                                id="winner"
                                type="number"
                                min="1"
                                max="6"
                                placeholder="Enter 1-6"
                                value={actualWinner}
                                onChange={(e) => setActualWinner(e.target.value)}
                                className={errors.winner ? 'border-destructive' : ''}
                            />
                            {errors.winner && (
                                <p className="text-sm text-destructive">{errors.winner}</p>
                            )}
                        </div>
                        <Button onClick={handleResultSubmit} className="w-full">
                            Continue to Bet Entry
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (step === 'bet' && prediction) {
        const suggestedBet = calculateBetSize(
            prediction.confidence / 100,
            prediction.impliedProbabilities[prediction.predictedWinner],
            100,
            prediction.skipRace,
            prediction.signalAgreement || 1.0
        );

        const isWin = prediction.predictedWinner === actualWinner;

        return (
            <Card>
                <CardHeader>
                    <CardTitle>Enter Bet Amount</CardTitle>
                    <CardDescription>
                        {isWin ? (
                            <span className="text-green-600 font-semibold">✓ Prediction Correct!</span>
                        ) : (
                            <span className="text-red-600 font-semibold">✗ Prediction Incorrect</span>
                        )}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Predicted:</span>
                            <span className="font-semibold">Contender {prediction.predictedWinner}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Actual Winner:</span>
                            <span className="font-semibold">Contender {actualWinner}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm font-medium">Suggested Bet:</span>
                            <span className="font-semibold">${suggestedBet.amount.toFixed(0)}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="betAmount">Bet Amount ($0 - $10,000)</Label>
                        <Input
                            id="betAmount"
                            type="number"
                            min="0"
                            max="10000"
                            step="100"
                            placeholder="Enter amount (0 for no bet)"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            className={errors.bet ? 'border-destructive' : ''}
                        />
                        {errors.bet && (
                            <p className="text-sm text-destructive">{errors.bet}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Enter 0 if you did not bet on this race
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={handleBetSubmit} className="flex-1">
                            Submit Entry
                        </Button>
                        <Button onClick={handleSkipBet} variant="outline" className="flex-1">
                            Skip Bet
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return null;
}
