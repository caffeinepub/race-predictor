import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppHeader } from '@/components/AppHeader';
import { MobilePageContainer } from '@/components/MobilePageContainer';
import { SkipToContent } from '@/components/SkipToContent';
import { EntryFlow } from '@/features/entries/EntryFlow';
import { HistoryList } from '@/features/history/HistoryList';
import { LearningSummaryCard } from '@/features/learning/LearningSummaryCard';
import { StatsAnalyticsView } from '@/features/analytics/StatsAnalyticsView';
import { ResetAppMemoryButton } from '@/features/reset/ResetAppMemoryButton';
import { useOnDeviceMemory } from '@/storage/useOnDeviceMemory';
import { Toaster } from '@/components/ui/sonner';

export default function App() {
    const { entries, learnedState, addEntry, clearAll, recomputeLearnedState } = useOnDeviceMemory();

    return (
        <>
            <SkipToContent />
            <div className="flex min-h-screen flex-col bg-background">
                <AppHeader />
                <main id="main-content" className="flex-1">
                    <MobilePageContainer>
                        <Tabs defaultValue="predict" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-6">
                                <TabsTrigger value="predict" className="text-sm">
                                    New Entry
                                </TabsTrigger>
                                <TabsTrigger value="stats" className="text-sm">
                                    Stats
                                </TabsTrigger>
                                <TabsTrigger value="history" className="text-sm">
                                    History
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="predict" className="space-y-6">
                                <LearningSummaryCard entries={entries} learnedState={learnedState} />
                                <EntryFlow
                                    onSave={(entry) => {
                                        addEntry(entry);
                                        recomputeLearnedState();
                                    }}
                                    learnedState={learnedState}
                                />
                            </TabsContent>

                            <TabsContent value="stats" className="space-y-6">
                                <StatsAnalyticsView entries={entries} learnedState={learnedState} />
                            </TabsContent>

                            <TabsContent value="history" className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold text-foreground">Race History</h2>
                                    <ResetAppMemoryButton onReset={clearAll} />
                                </div>
                                <HistoryList entries={entries} />
                            </TabsContent>
                        </Tabs>
                    </MobilePageContainer>
                </main>
                <footer className="border-t border-border py-6 mt-12">
                    <MobilePageContainer>
                        <p className="text-center text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Built with ❤️ using{' '}
                            <a
                                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(
                                    typeof window !== 'undefined' ? window.location.hostname : 'gta-horse-track-guesser'
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-foreground transition-colors"
                            >
                                caffeine.ai
                            </a>
                        </p>
                    </MobilePageContainer>
                </footer>
            </div>
            <Toaster />
        </>
    );
}
