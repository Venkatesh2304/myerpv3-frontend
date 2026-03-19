import React, { useEffect, useRef } from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface BarcodeCaseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sku: string;
    productName: string;
    mrp: number;
    caseQty: number;
    onSelect: (isCase: boolean) => void;
}

export const BarcodeCaseDialog: React.FC<BarcodeCaseDialogProps> = ({
    open,
    onOpenChange,
    sku,
    productName,
    mrp,
    caseQty,
    onSelect,
}) => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio("/notification.mp3");
    }, []);

    useEffect(() => {
        if (open) {
            audioRef.current?.play().catch(e => console.error("Error playing sound", e));
        }
    }, [open]);

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-[400px]">
                <AlertDialogHeader>
                    <AlertDialogTitle>Case or Piece?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Is this a Case ({caseQty} units) or a single Piece?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="p-4 bg-muted/50 rounded-lg border flex flex-col gap-1">
                    <div className="font-bold text-primary">{sku}</div>
                    <div className="text-xs text-muted-foreground uppercase leading-tight">{productName}</div>
                    <div className="text-sm font-semibold mt-1">MRP: ₹{mrp}</div>
                </div>
                <AlertDialogFooter className="grid grid-cols-2 gap-3 sm:flex-row sm:justify-center mt-4">
                    <Button
                        variant="default"
                        className="h-16 text-xl font-bold border-2 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => { onSelect(false); onOpenChange(false); }}
                    >
                        Piece (1)
                    </Button>
                    <Button
                        variant="default"
                        className="h-16 text-xl font-bold border-2 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => { onSelect(true); onOpenChange(false); }}
                    >
                        Case ({caseQty})
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
