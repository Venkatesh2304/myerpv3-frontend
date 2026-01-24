import React, { useState, useEffect, useRef } from "react";
import { useList } from "@refinedev/core";
import { useCompany } from "@/providers/company-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dataProvider } from "@/lib/dataprovider";
import { useNotification } from "@refinedev/core";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@radix-ui/react-separator";

export const VehicleScanPage = () => {
    const { company } = useCompany();
    const { open } = useNotification();

    // Step 1: Vehicle Selection
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [step, setStep] = useState<"select" | "scan">("select");

    const { query: { data: vehicleData, isLoading: isLoadingVehicles } } = useList({
        resource: "vehicle",
        filters: [
            {
                field: "company",
                operator: "eq",
                value: company?.id,
            },
        ],
        pagination: {
            mode: "off"
        },
        queryOptions: {
            enabled: !!company?.id,
        }
    });

    const vehicles = vehicleData?.data || [];

    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

    const handleNext = () => {
        if (selectedVehicleId) {
            setStep("scan");
            fetchBills();
        }
    };

    // Step 2: Bill Scanning
    const [bills, setBills] = useState<string[]>([]);
    const [isLoadingBills, setIsLoadingBills] = useState(false);
    const [billInput, setBillInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const fetchBills = async () => {
        if (!selectedVehicleId) return;
        setIsLoadingBills(true);
        try {
            const date = new Date().toISOString().split('T')[0];
            const { data } = await dataProvider.custom({
                url: "/vehicle_bills",
                method: "get",
                query: {
                    vehicle: selectedVehicleId,
                    date: date,
                }
            });
            setBills(data || []);
        } catch (error) {
            console.error("Error fetching bills", error);
            open?.({
                type: "error",
                message: "Failed to fetch bills",
            });
        } finally {
            setIsLoadingBills(false);
        }
    };

    const handleAddBill = async () => {
        if (!billInput.trim() || !selectedVehicleId) return;

        const newBill = billInput.trim().toUpperCase();

        // Optimistic update
        setBillInput("");
        inputRef.current?.focus();

        try {
            await dataProvider.custom({
                url: "/vehicle_bills/",
                method: "post",
                payload: {
                    vehicle: selectedVehicleId,
                    bill: newBill,
                },
            });
            //remove newBill from bills if it is already present
            setBills(prev => [newBill, ...(prev.filter(b => b !== newBill))]);
        } catch (error) {
            console.error("Error adding bill", error);
            open?.({
                type: "error",
                message: "Failed to add bill",
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddBill();
        }
    };

    if (step === "select") {
        return (
            <div className="flex flex-col gap-6 max-w-md mx-auto mt-10 p-4 border rounded-lg shadow-sm bg-card">
                <div className="flex flex-col gap-2">
                    <Select value={selectedVehicleId || ""} onValueChange={setSelectedVehicleId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a vehicle" />
                        </SelectTrigger>
                        <SelectContent>
                            {isLoadingVehicles ? (
                                <div className="p-2 flex justify-center"><Loader2 className="animate-spin" /></div>
                            ) : (
                                vehicles.map((v: any) => (
                                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {selectedVehicle && (
                    <div className="flex flex-col gap-2">
                        <Label>Vehicle No</Label>
                        <Input value={selectedVehicle.vehicle_no} readOnly className="bg-muted" />
                    </div>
                )}

                <Button onClick={handleNext} disabled={!selectedVehicleId} className="w-full">
                    Next
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-md mx-auto">
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

            <div className="flex flex-col gap-2 mt-1">
                <h3 className="font-semibold">Scanned Bills ({bills.length})</h3>
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
        </div >
    );
};
