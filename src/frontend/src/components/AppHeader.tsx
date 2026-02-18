import { MobilePageContainer } from './MobilePageContainer';

export function AppHeader() {
    return (
        <header className="border-b border-border bg-card sticky top-0 z-50">
            <MobilePageContainer>
                <div className="flex items-center gap-3 py-4">
                    <img
                        src="/assets/generated/app-icon.dim_512x512.png"
                        alt="GTA Online Horse Track Guesser"
                        className="h-10 w-10 rounded-lg"
                    />
                    <div>
                        <h1 className="text-xl font-bold text-foreground">GTA Online Horse Track Guesser</h1>
                        <p className="text-xs text-muted-foreground">AKA Big T's Glue Factory Contenders, AKA" Beebo Jr.</p>
                    </div>
                </div>
            </MobilePageContainer>
        </header>
    );
}
