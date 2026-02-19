
import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ScanConfirmationAlertProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: React.ReactNode;
    onConfirm: () => void;
    extraAction?: {
        label: string;
        onClick: () => void;
    };
}

export function ScanConfirmationAlert({ open, onOpenChange, title, description, onConfirm, extraAction }: ScanConfirmationAlertProps) {
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
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="text-sm text-muted-foreground">{description}</div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex items-center justify-between sm:justify-between w-full">
                    <div className="flex justify-between w-full px-5">
                        <AlertDialogCancel className="h-10 bg-red-500 hover:bg-red-600 text-white hover:text-white border-none">Cancel</AlertDialogCancel>
                        <AlertDialogAction className="h-10 bg-green-500 hover:bg-green-600" onClick={onConfirm}>Continue</AlertDialogAction>
                    </div>
                    <div className="flex-1">
                        {extraAction && (
                            <Button
                                variant="link"
                                size="sm"
                                className="text-muted-foreground hover:text-primary px-0 h-auto"
                                onClick={() => {
                                    extraAction.onClick();
                                    onOpenChange(false);
                                }}
                            >
                                {extraAction.label}
                            </Button>
                        )}
                    </div>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
