import { type ReactNode } from 'react';

interface MobilePageContainerProps {
    children: ReactNode;
}

export function MobilePageContainer({ children }: MobilePageContainerProps) {
    return <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">{children}</div>;
}
