import React, { useState, useEffect, useRef } from "react";
import { useList, useNotification } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dataProvider } from "@/lib/dataprovider";
import { Loader2, ArrowLeft, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

interface BillScannerProps {
    vehicle: any;
    mode: "load" | "delivery";
    onBack: () => void;
    headerAction?: React.ReactNode;
}

export const BillScanner: React.FC<BillScannerProps> = ({ vehicle, mode, onBack, headerAction }) => {
    const { open } = useNotification();
    const [bills, setBills] = useState<string[]>([]);
    const [billInput, setBillInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [batchMode, setBatchMode] = useState(true);
    const [showBatchDialog, setShowBatchDialog] = useState(false);
    const [lockoutTimer, setLockoutTimer] = useState(0);
    const [batchDisplayCount, setBatchDisplayCount] = useState(0);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio("/bells.wav");
        }
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (lockoutTimer > 0) {
            interval = setInterval(() => {
                setLockoutTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [lockoutTimer]);

    const playBatchSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => { });
        }
    };

    const { query: { data: billData, isLoading: isLoadingBills } } = useList({
        resource: "bill_scan",
        filters: [
            {
                field: "vehicle",
                operator: "eq",
                value: vehicle.id,
            },
            {
                field: mode === "load" ? "loading_date" : "delivery_date",
                operator: "eq",
                value: new Date().toISOString().split('T')[0],
            }
        ],
        pagination: {
            pageSize: 500,
            mode: "server"
        },
        queryOptions: {
            enabled: !!vehicle.id,
        },
    });

    useEffect(() => {
        if (billData?.data) {
            setBills(billData?.data?.map((b: any) => b.bill || b) || []);
        }
    }, [billData]);

    const notify = (message: string, error: boolean) => {
        open?.({
            type: error ? "error" : "success",
            message,
        });
        audioRef?.current?.play();
    };

    const handleAddBill = async () => {
        if (!billInput.trim() || !vehicle.id) return;

        const newBill = billInput.trim().toUpperCase();

        setBillInput("");
        inputRef.current?.focus();

        try {
            const { data } = await dataProvider.custom({
                url: "/scan_bill/",
                method: "post",
                payload: {
                    vehicle: vehicle.id,
                    bill: newBill,
                    type: mode
                },
            });
            if (data?.status == "success") {
                const newBills = data?.bills || [];
                if ((mode == "delivery") && (data?.loaded_vehicle != vehicle.name)) {
                    notify(`Bill was loaded in other vehicle ${data?.loaded_vehicle}`, false);
                }
                // Merge new bills with existing ones, avoiding duplicates
                setBills(prev => {
                    const uniqueNewBills = newBills.filter(newBill =>
                        !prev.some(existingBill => existingBill === newBill)
                    );
                    const updated = [...uniqueNewBills, ...prev];

                    if (batchMode && updated.length > 0 && updated.length % 10 === 0) {
                        setBatchDisplayCount(updated.length);
                        playBatchSound();
                        setShowBatchDialog(true);
                        setLockoutTimer(10);
                    }

                    return updated;
                });
            } else {
                notify(data?.message, true);
            }
        } catch (error) {
            console.error("Error adding bill", error);
            notify("Failed to add bill", true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddBill();
        }
    };

    return (
        <div className="flex flex-col gap-4 max-w-md mx-auto">
            <div className="flex items-center gap-4 border-b">
                <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <div className="text-lg font-semibold">{vehicle.name}</div>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <Switch
                        id="batch-mode"
                        checked={batchMode}
                        onCheckedChange={setBatchMode}
                    />
                    <Label htmlFor="batch-mode" className="text-xs font-semibold">Batch Mode</Label>
                </div>
            </div>

            <div className="flex flex-col gap-2">

                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={billInput}
                        onChange={(e) => setBillInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={lockoutTimer > 0 ? `Resting for ${lockoutTimer}s...` : "Scan or enter bill no"}
                        autoFocus
                        disabled={lockoutTimer > 0}
                        className="h-12 text-lg"
                    />
                    <Button
                        onClick={handleAddBill}
                        className="h-12 w-20"
                        disabled={lockoutTimer > 0}
                    >
                        Add
                    </Button>
                </div>
            </div>

            <Dialog open={showBatchDialog} onOpenChange={(open) => {
                if (!open && lockoutTimer === 0) {
                    setShowBatchDialog(false);
                    setTimeout(() => inputRef.current?.focus(), 150);
                }
            }}>
                <DialogContent className="sm:max-w-md border-none bg-background/95 backdrop-blur-sm">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-bold">Batch Target Reached!</DialogTitle>
                        <DialogDescription className="text-center">
                            Please verify the items. Scanner is paused.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center justify-center py-10">
                        <div className="text-[10rem] leading-none font-black text-primary drop-shadow-2xl animate-in zoom-in spin-in-1 duration-500">
                            {batchDisplayCount}
                        </div>
                        <div className="text-3xl font-bold tracking-tight text-muted-foreground uppercase mt-2">
                            Bills Scanned
                        </div>
                    </div>
                    <div className="flex flex-col gap-4">
                        <Button
                            disabled={lockoutTimer > 0}
                            onClick={() => {
                                setShowBatchDialog(false);
                                setTimeout(() => inputRef.current?.focus(), 150);
                            }}
                            className="w-full h-20 text-2xl font-bold"
                            variant={lockoutTimer > 0 ? "outline" : "default"}
                        >
                            {lockoutTimer > 0 ? `LOCKED (${lockoutTimer}s)` : "CONTINUE SCANNING"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="flex flex-col gap-2 mt-1">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Scanned Bills ({bills.length})</h3>
                    {headerAction}
                </div>

                {isLoadingBills ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {bills.map((bill, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "py-1 px-3 font-medium border-b",
                                    bill.startsWith("SM") ? "text-green-500" : "text-blue-500"
                                )}
                            >
                                {index + 1}. {bill}
                            </div>
                        ))}
                        {bills.length === 0 && (
                            <p className="text-muted-foreground text-center py-4">No bills scanned yet.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
