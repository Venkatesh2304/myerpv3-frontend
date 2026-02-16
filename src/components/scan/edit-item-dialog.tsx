
import React, { useEffect, useState } from "react";
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

export interface EditItemDialogProps {
    item: { cbu: string; mrp: number; qty: number } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: (cbu: string, mrp: number, qty: number, isAddition: boolean) => void;
    label?: string;
}

export function EditItemDialog({ item, open, onOpenChange, onUpdate, label = "CBU" }: EditItemDialogProps) {
    const [newQty, setNewQty] = useState("");

    useEffect(() => {
        if (open) {
            setNewQty("");
        }
    }, [open]);

    const handleSave = () => {
        if (newQty && !isNaN(Number(newQty)) && item) {
            onUpdate(item.cbu, item.mrp, Number(newQty), false);
        }
        onOpenChange(false);
    };

    const handleDelete = () => {
        if (item) {
            onUpdate(item.cbu, item.mrp, 0, false);
            onOpenChange(false);
        }
    };

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Quantity</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cbu" className="text-right">
                            {label}
                        </Label>
                        <Input
                            id="cbu"
                            value={item.cbu}
                            readOnly
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="mrp" className="text-right">
                            MRP
                        </Label>
                        <Input
                            id="mrp"
                            value={item.mrp}
                            readOnly
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="old-qty" className="text-right">
                            Old Qty
                        </Label>
                        <Input
                            id="old-qty"
                            value={item.qty}
                            readOnly
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-qty" className="text-right">
                            New Qty
                        </Label>
                        <Input
                            id="new-qty"
                            value={newQty}
                            onChange={(e) => setNewQty(e.target.value)}
                            placeholder="Enter new quantity"
                            className="col-span-3 h-15"
                            type="number"
                        />
                    </div>
                </div>
                <DialogFooter className="flex flex-row justify-between">
                    <Button className="h-12 w-25" variant="destructive" onClick={handleDelete}>Delete</Button>
                    <Button className="h-12 w-25 bg-green-500" onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
