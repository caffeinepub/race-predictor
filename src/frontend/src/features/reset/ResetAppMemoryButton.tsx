import { useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface ResetAppMemoryButtonProps {
    onReset: () => void;
}

export function ResetAppMemoryButton({ onReset }: ResetAppMemoryButtonProps) {
    const [open, setOpen] = useState(false);

    const handleConfirmReset = () => {
        onReset();
        setOpen(false);
        toast.success('App memory has been reset');
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="h-10">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset Memory
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Reset App Memory?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete all saved race entries and learned prediction data. This action
                        cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirmReset} className="bg-destructive hover:bg-destructive/90">
                        Reset Everything
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
