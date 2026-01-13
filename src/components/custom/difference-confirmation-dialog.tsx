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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface DifferenceConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    difference: number;
}

export const DifferenceConfirmationDialog = ({
    open,
    onOpenChange,
    onConfirm,
    difference,
}: DifferenceConfirmationDialogProps) => {
    const [confirmationInput, setConfirmationInput] = useState("");

    // Reset input when dialog opens
    useEffect(() => {
        if (open) {
            setConfirmationInput("");
        }
    }, [open]);

    const absDifference = Math.abs(Math.round(difference));
    const isMatch = parseInt(confirmationInput) === absDifference;

    const handleConfirm = () => {
        if (isMatch) {
            onConfirm();
            onOpenChange(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Difference</AlertDialogTitle>
                    <AlertDialogDescription>
                        There is a difference of{" "}
                        <span
                            className={cn(
                                "font-bold",
                                difference > 0 ? "text-green-600" : "text-red-600"
                            )}
                        >
                            ₹{difference.toLocaleString("en-IN")}
                        </span>{" "}
                        between the total amount and collection entries.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="diff-confirm">
                            Type <span className="font-mono font-bold">{absDifference}</span> to confirm
                        </Label>
                        <Input
                            id="diff-confirm"
                            value={confirmationInput}
                            onChange={(e) => setConfirmationInput(e.target.value)}
                            placeholder={`Type ${absDifference}`}
                            className={cn(
                                confirmationInput && !isMatch ? "border-red-500 focus-visible:ring-red-500" : ""
                            )}
                            autoFocus
                        />
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleConfirm} disabled={!isMatch}>
                        Confirm & Save
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
