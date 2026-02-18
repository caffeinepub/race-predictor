import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppHeader } from '@/components/AppHeader';
import { MobilePageContainer } from '@/components/MobilePageContainer';
import { SkipToContent } from '@/components/SkipToContent';
import { EntryFlow } from '@/features/entries/EntryFlow';
import { HistoryList } from '@/features/history/HistoryList';
import { StatsAnalyticsView } from '@/features/analytics/StatsAnalyticsView';
import { DashboardView } from '@/features/dashboard/DashboardView';
import { useOnDeviceMemory } from '@/storage/useOnDeviceMemory';
import { Toaster } from '@/components/ui/sonner';
import { SiCaffeine } from 'react-icons/si';

function App() {
    const { entries, learnedState, isLoading, addEntry, setStrategy, clearMemory } = useOnDeviceMemory();
    const [activeTab, setActiveTab] = useState('dashboard');

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">🐎</div>
                    <div className="text-muted-foreground">Loading...</div>
                </div>
            </div>
        );
    }

    // Ensure learnedState is never null after loading
    if (!learnedState) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <div className="text-muted-foreground">Error loading data</div>
                </div>
            </div>
        );
    }

    return (
        <>
            <SkipToContent />
            <div className="min-h-screen bg-background">
                <AppHeader />
                
                <main id="main-content" className="pb-20">
                    <MobilePageContainer>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-4 mb-6">
                                <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                                <TabsTrigger value="entry">New Entry</TabsTrigger>
                                <TabsTrigger value="stats">Stats</TabsTrigger>
                                <TabsTrigger value="history">History</TabsTrigger>
                            </TabsList>

                            <TabsContent value="dashboard">
                                <DashboardView 
                                    entries={entries}
                                    learnedState={learnedState}
                                    onReset={clearMemory}
                                />
                            </TabsContent>

                            <TabsContent value="entry" className="space-y-6">
                                <EntryFlow 
                                    onSubmit={addEntry} 
                                    learnedState={learnedState}
                                />
                            </TabsContent>

                            <TabsContent value="stats">
                                <StatsAnalyticsView 
                                    learnedState={learnedState}
                                />
                            </TabsContent>

                            <TabsContent value="history">
                                <HistoryList entries={entries} />
                            </TabsContent>
                        </Tabs>
                    </MobilePageContainer>
                </main>

                <footer className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t py-3">
                    <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
                        <p>
                            © {new Date().getFullYear()} · Built with{' '}
                            <SiCaffeine className="inline h-3 w-3 text-primary" aria-label="love" />{' '}
                            using{' '}
                            <a
                                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-foreground transition-colors"
                            >
                                caffeine.ai
                            </a>
                        </p>
                    </div>
                </footer>
            </div>
            <Toaster />
        </>
    );
}

export default App;
