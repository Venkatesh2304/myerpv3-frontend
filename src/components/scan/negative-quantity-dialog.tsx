import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

export interface NegativeQuantityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sku: string;
    productName: string;
    mrp: number;
    onConfirm: () => void;
}

export function NegativeQuantityDialog({
    open,
    onOpenChange,
    sku,
    productName,
    mrp,
    onConfirm,
}: NegativeQuantityDialogProps) {
    const [inputMrp, setInputMrp] = useState("");
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio("/notification.mp3");
    }, []);

    useEffect(() => {
        if (open) {
            setInputMrp("");
            setError(null);
            audioRef.current?.play().catch(e => console.error("Error playing sound", e));
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [open]);

    const handleConfirm = () => {
        if (Number(inputMrp) === mrp) {
            onConfirm();
            onOpenChange(false);
        } else {
            setError("Incorrect MRP. Please type the correct MRP to confirm.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] border-destructive">
                <DialogHeader>
                    <DialogTitle className="text-destructive flex items-center gap-2">
                        Negative Quantity Warning
                    </DialogTitle>
                    <DialogDescription>
                        Adding this item will exceed the billed quantity.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20 space-y-1">
                        <div className="text-sm font-bold">Product: {productName}</div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="mrp-confirm">Type MRP to Confirm Addition</Label>
                        <Input
                            id="mrp-confirm"
                            value={inputMrp}
                            onChange={(e) => setInputMrp(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleConfirm();
                            }}
                            ref={inputRef}
                            placeholder="Type MRP here"
                            type="number"
                            className={error ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {error && <div className="text-xs text-destructive font-bold">{error}</div>}
                    </div>
                </div>
                <DialogFooter className="flex flex-row justify-between sm:justify-between">
                    <Button variant="destructive" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={handleConfirm}>
                        Confirm Add
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
