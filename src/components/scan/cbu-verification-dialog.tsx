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
} from "@/components/ui/dialog";

export interface CBUVerificationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sku: string;
    productName: string;
    mrp: number;
    expectedCbus: string[];
    onVerified: (sku: string, mrp: number) => void;
}

export function CBUVerificationDialog({
    open,
    onOpenChange,
    sku,
    productName,
    mrp,
    expectedCbus,
    onVerified,
}: CBUVerificationDialogProps) {
    const [inputCbu, setInputCbu] = useState("");
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setInputCbu("");
            setError(null);
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [open]);

    const handleVerify = () => {
        const normalizedInput = inputCbu.trim().toUpperCase();
        const isMatch = expectedCbus.some(
            (cbu) => cbu.trim().toUpperCase() === normalizedInput
        );

        if (isMatch) {
            onVerified(sku, mrp);
            onOpenChange(false);
        } else {
            setError("CBU code does not match. Please try again.");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Verify CBU for Case Item</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <div className="text-sm font-bold">{productName}</div>
                        <div className="text-sm font-medium">MRP: ₹{mrp}</div>
                        <div className="text-xs text-muted-foreground">
                            This product is a case. Please scan or enter the CBU code to verify.
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="cbu-input">CBU Code</Label>
                        <Input
                            id="cbu-input"
                            value={inputCbu}
                            onChange={(e) => setInputCbu(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleVerify();
                            }}
                            ref={inputRef}
                            placeholder="Enter CBU code"
                            className={error ? "border-destructive" : ""}
                        />
                        {error && <div className="text-xs text-destructive">{error}</div>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleVerify}>Verify & Add</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
