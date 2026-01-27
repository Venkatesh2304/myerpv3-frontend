import React, { useState, useEffect, useRef } from "react";
import { useList, useNotification } from "@refinedev/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dataProvider } from "@/lib/dataprovider";
import { Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio("/notification.mp3");
        }
    }, []);

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
            // Assuming the API returns objects with a 'bill' property or just strings?
            // In vehicleScan.tsx: setBills(billData?.data?.map((b: any) => b.bill) || []);
            // But in MissingBillsDialog: {item.bill || item}
            // Let's assume it returns objects with 'bill' property based on vehicleScan.tsx
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
                if (data?.loaded_vehicle != vehicle.name) {
                    notify(`Bill was loaded in other vehicle ${data?.loaded_vehicle}`, false);
                }
                // Merge new bills with existing ones, avoiding duplicates
                setBills(prev => {
                    const combined = [...newBills, ...prev];
                    return Array.from(new Set(combined));
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
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={billInput}
                        onChange={(e) => setBillInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Scan or enter bill no"
                        autoFocus
                        className="h-12"
                    />
                    <Button onClick={handleAddBill} className="h-12 w-20">Add</Button>
                </div>
            </div>

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
                                {bill}
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
