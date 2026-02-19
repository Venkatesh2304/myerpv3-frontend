import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dataProvider } from "@/lib/dataprovider";
import { useNotification } from "@refinedev/core";
import { cn } from "@/lib/utils";

interface AddBarcodeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    barcode: string;
    invoiceMap: Record<string, Record<string, number>>; // SKU -> MRP -> Qty
    skuNameMap?: Record<string, string>;
    onSuccess: (sku: string, mrp: number) => void;
}

export function AddBarcodeDialog({ open, onOpenChange, barcode, invoiceMap, skuNameMap, onSuccess }: AddBarcodeDialogProps) {
    const { open: notify } = useNotification();
    const [mrp, setMrp] = useState<string>("");
    const [selectedSku, setSelectedSku] = useState<string>("");
    const [loading, setLoading] = useState(false);

    // Filter SKUs based on entered MRP
    const availableSkus = useMemo(() => {
        if (!mrp) return [];
        const mrpNum = Number(mrp);
        if (isNaN(mrpNum)) return [];

        return Object.keys(invoiceMap).filter(sku => {
            const mrps = Object.keys(invoiceMap[sku]);
            // Check if any mrp key matches the numeric value
            return mrps.some(m => Number(m) === mrpNum);
        });
    }, [mrp, invoiceMap]);

    const handleSave = async () => {
        if (!selectedSku || !mrp) return;
        setLoading(true);

        try {
            await dataProvider.custom({
                url: "barcode/",
                method: "post",
                payload: {
                    code: barcode,
                    sku: selectedSku,
                }
            });

            notify?.({ type: "success", message: "Barcode Mapped Successfully" });
            onSuccess(selectedSku, Number(mrp));
            onOpenChange(false);
            // Reset state
            setMrp("");
            setSelectedSku("");
        } catch (error: any) {
            notify?.({ type: "error", message: error?.response?.data?.error || "Failed to map barcode" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) {
                setMrp("");
                setSelectedSku("");
            }
        }}>
            <DialogContent className="max-w-md w-[95vw] sm:w-full max-h-[90vh] flex flex-col p-6">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-xl font-bold">Map Barcode</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-hidden flex flex-col gap-4 py-2">
                    <div className="p-3 bg-muted/50 rounded-lg text-center border">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Scanned Barcode</div>
                        <div className="text-xl font-mono font-bold tracking-tighter">{barcode}</div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="mrp-input" className="text-sm font-semibold">Step 1: Enter MRP</Label>
                        <Input
                            id="mrp-input"
                            type="number"
                            value={mrp}
                            onChange={(e) => {
                                setMrp(e.target.value);
                                setSelectedSku("");
                            }}
                            placeholder="Type MRP (e.g. 99, 199)..."
                            autoFocus
                            autoComplete="off"
                            className="h-11 text-lg font-medium"
                        />
                    </div>

                    <div className="flex-1 flex flex-col min-h-0 space-y-2">
                        <Label className="text-sm font-semibold">
                            Step 2: Select Matching Product {availableSkus.length > 0 && `(${availableSkus.length})`}
                        </Label>

                        <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                            {!mrp && (
                                <div className="h-full flex flex-col items-center justify-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-muted-foreground/30">
                                    <div className="mb-2 text-2xl">🔍</div>
                                    <div className="text-sm">Waiting for MRP input...</div>
                                </div>
                            )}

                            {mrp && availableSkus.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center py-12 text-destructive/70 bg-destructive/5 rounded-xl border border-dashed border-destructive/20">
                                    <div className="mb-2 text-2xl">⚠️</div>
                                    <div className="text-sm font-medium">No matches for MRP ₹{mrp}</div>
                                    <div className="text-xs mt-1 text-muted-foreground px-6 text-center">Make sure the MRP matches what is on the bill for this SKU.</div>
                                </div>
                            )}

                            {availableSkus.length > 0 && (
                                <div className="grid grid-cols-1 gap-2">
                                    {availableSkus.map(sku => {
                                        const name = skuNameMap?.[sku];
                                        const isSelected = selectedSku === sku;
                                        return (
                                            <div
                                                key={sku}
                                                onClick={() => setSelectedSku(sku)}
                                                className={cn(
                                                    "group p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer",
                                                    isSelected
                                                        ? "border-primary bg-primary/10 shadow-sm"
                                                        : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30"
                                                )}
                                            >
                                                <div className="flex justify-between items-center gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className={cn(
                                                            "font-bold text-sm tracking-tight transition-colors",
                                                            isSelected ? "text-primary" : "text-card-foreground"
                                                        )}>
                                                            {sku}
                                                        </div>
                                                        {name && (
                                                            <div className="text-[11px] font-medium text-muted-foreground mt-0.5 line-clamp-2 leading-tight uppercase opacity-80 group-hover:opacity-100 transition-opacity">
                                                                {name.trim()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className={cn(
                                                        "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                                                        isSelected
                                                            ? "bg-primary border-primary scale-110"
                                                            : "border-muted group-hover:border-muted-foreground/50"
                                                    )}>
                                                        {isSelected && (
                                                            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 sm:mr-2">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={!selectedSku || loading}
                        className="flex-1 shadow-md bg-primary hover:bg-primary/90"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                Saving...
                            </div>
                        ) : "Add to Box"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
