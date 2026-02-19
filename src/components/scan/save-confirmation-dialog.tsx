
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export interface SaveConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (qty: number) => void;
    loading?: boolean;
}

export function SaveConfirmationDialog({ open, onOpenChange, onConfirm, loading }: SaveConfirmationDialogProps) {
    const [qty, setQty] = useState("");

    useEffect(() => {
        if (open) {
            setQty("");
        }
    }, [open]);

    const handleConfirm = () => {
        if (qty && !isNaN(Number(qty))) {
            onConfirm(Number(qty));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Confirm Box Total</DialogTitle>
                    <DialogDescription>
                        Please enter the total number of cases to confirm.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="total-qty" className="text-right">
                            Total Qty
                        </Label>
                        <Input
                            id="total-qty"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            placeholder="Enter total quantity"
                            className="col-span-3 h-12"
                            type="number"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleConfirm();
                                }
                            }}
                        />
                    </div>
                </div>
                <DialogFooter className="flex flex-row justify-between">
                    <Button className="h-12 w-24 bg-red-500 text-white" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
                    <Button className="h-12 w-24 bg-green-500" onClick={handleConfirm} disabled={loading || !qty || isNaN(Number(qty))}>
                        {loading ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
