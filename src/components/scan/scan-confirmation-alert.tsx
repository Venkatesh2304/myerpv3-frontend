
import React, { useEffect, useRef } from "react";
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
    description?: string;
    onConfirm: () => void;
}

export function ScanConfirmationAlert({ open, onOpenChange, title, description, onConfirm }: ScanConfirmationAlertProps) {
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
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-row justify-between">
                    <AlertDialogCancel className="h-12 w-24 bg-red-500 text-white">Cancel</AlertDialogCancel>
                    <AlertDialogAction className="h-12 w-24 bg-green-500" onClick={onConfirm}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
