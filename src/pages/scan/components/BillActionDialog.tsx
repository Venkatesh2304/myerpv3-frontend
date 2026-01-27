import React, { useState, useEffect } from "react";
import { useInvalidate, useNotification } from "@refinedev/core";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ResourceCombobox } from "@/components/custom/resource-combobox";
import { useCompany } from "@/providers/company-provider";
import { dataProvider } from "@/lib/dataprovider";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";

interface BillActionDialogProps {
    bill: any;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const BillActionDialog: React.FC<BillActionDialogProps> = ({
    bill,
    open,
    onOpenChange,
}) => {
    const { company } = useCompany();
    const { open: notify } = useNotification();
    const invalidate = useInvalidate();

    // Delivery states (for loaded bills)
    const [deliveryOption, setDeliveryOption] = useState<string>("Cash Bill");
    const [otherReason, setOtherReason] = useState("");

    // Loading states (for non-loaded bills)
    const [notLoadedMode, setNotLoadedMode] = useState<"load" | "not_applicable">("load");
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
    const [notApplicableReason, setNotApplicableReason] = useState<string>("Salesman Bill");

    useEffect(() => {
        if (open) {
            setDeliveryOption("Cash Bill");
            setOtherReason("");
            setNotLoadedMode("load");
            setSelectedVehicleId(null);
            setNotApplicableReason("Salesman Bill");
        }
    }, [open]);

    if (!bill) return null;

    const isLoaded = !!bill.loading_time;

    const handleAction = async () => {
        try {
            if (isLoaded) {
                const notes = deliveryOption === "Others" ? otherReason : deliveryOption;
                if (deliveryOption === "Others" && !otherReason.trim()) {
                    notify?.({
                        type: "error",
                        message: "Please enter a reason for 'Others'",
                    });
                    return;
                }

                const { data } = await dataProvider.custom({
                    url: "/scan_bill/",
                    method: "post",
                    payload: {
                        vehicle: bill.vehicle_id,
                        bill: bill.bill,
                        type: "delivery",
                        notes: notes,
                    },
                });

                if (data?.status === "success") {
                    notify?.({
                        type: "success",
                        message: "Bill delivered successfully",
                    });
                    invalidate({
                        resource: "bill_scan",
                        invalidates: ["list"],
                    });
                    onOpenChange(false);
                } else {
                    notify?.({
                        type: "error",
                        message: data?.message || "Action failed",
                    });
                }
            } else {
                // Not loaded logic
                if (notLoadedMode === "load") {
                    if (!selectedVehicleId) {
                        notify?.({
                            type: "error",
                            message: "Please select a vehicle",
                        });
                        return;
                    }

                    const { data } = await dataProvider.custom({
                        url: "/scan_bill/",
                        method: "post",
                        payload: {
                            vehicle: selectedVehicleId,
                            bill: bill.bill,
                            type: "load",
                            notes: "Manual Loading",
                        },
                    });

                    if (data?.status === "success") {
                        notify?.({
                            type: "success",
                            message: "Bill loaded successfully",
                        });
                        invalidate({
                            resource: "bill_scan",
                            invalidates: ["list"],
                        });
                        onOpenChange(false);
                    } else {
                        notify?.({
                            type: "error",
                            message: data?.message || "Action failed",
                        });
                    }
                } else {
                    // Delivery Not Applicable logic
                    const notes = notApplicableReason === "Others" ? otherReason : notApplicableReason;
                    if (notApplicableReason === "Others" && !otherReason.trim()) {
                        notify?.({
                            type: "error",
                            message: "Please enter a reason for 'Others'",
                        });
                        return;
                    }

                    const { data } = await dataProvider.custom({
                        url: "/delivery_applicable/",
                        method: "post",
                        payload: {
                            bill: bill.bill,
                            company: company?.id,
                            notes: notes,
                            delivery_applicable: false,
                        },
                    });

                    if (data?.status === "success") {
                        notify?.({
                            type: "success",
                            message: "Bill marked as delivery not applicable",
                        });
                        invalidate({
                            resource: "bill_scan",
                            invalidates: ["list"],
                        });
                        onOpenChange(false);
                    } else {
                        notify?.({
                            type: "error",
                            message: data?.message || "Action failed",
                        });
                    }
                }
            }
        } catch (error) {
            console.error("Error performing bill action", error);
            notify?.({
                type: "error",
                message: "An error occurred",
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Bill Details - {bill.bill}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Bill No</Label>
                        <Input value={bill.bill} readOnly className="col-span-3 bg-muted" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Date</Label>
                        <Input
                            value={bill.bill_date ? format(new Date(bill.bill_date), "dd/MM/yyyy") : "-"}
                            readOnly
                            className="col-span-3 bg-muted"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Amount</Label>
                        <Input
                            value={`₹${parseInt(bill.amt).toLocaleString("en-IN")}`}
                            readOnly
                            className="col-span-3 bg-muted"
                        />
                    </div>

                    {isLoaded && (
                        <>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Vehicle</Label>
                                <Input value={bill.vehicle || "-"} readOnly className="col-span-3 bg-muted" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label className="text-right">Loaded At</Label>
                                <Input
                                    value={format(new Date(bill.loading_time), "PP p")}
                                    readOnly
                                    className="col-span-3 bg-muted"
                                />
                            </div>

                            <div className="border-t pt-4 mt-2">
                                <Label className="mb-2 block font-semibold">Delivery Options</Label>
                                <RadioGroup value={deliveryOption} onValueChange={setDeliveryOption} className="gap-3">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Cash Bill" id="cash" />
                                        <Label htmlFor="cash">Cash Bill</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Sales Return" id="sales-return" />
                                        <Label htmlFor="sales-return">Sales Return</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Others" id="others" />
                                        <Label htmlFor="others">Others</Label>
                                    </div>
                                </RadioGroup>

                                {deliveryOption === "Others" && (
                                    <div className="mt-3">
                                        <Input
                                            placeholder="Enter reason"
                                            value={otherReason}
                                            onChange={(e) => setOtherReason(e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {!isLoaded && (
                        <div className="border-t pt-4 mt-2">
                            <RadioGroup
                                value={notLoadedMode}
                                onValueChange={(val: any) => setNotLoadedMode(val)}
                                className="flex gap-4 mb-4 border-b pb-3"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="load" id="mode-load" />
                                    <Label htmlFor="mode-load">Load into Vehicle</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="not_applicable" id="mode-na" />
                                    <Label htmlFor="mode-na">Delivery Not Applicable</Label>
                                </div>
                            </RadioGroup>
                            {notLoadedMode === "load" ? (
                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs">Select Vehicle</Label>
                                    <ResourceCombobox
                                        resource="vehicle"
                                        labelKey="name"
                                        valueKey="id"
                                        value={selectedVehicleId || ""}
                                        onValueChange={setSelectedVehicleId}
                                        filters={[
                                            {
                                                field: "company",
                                                operator: "eq",
                                                value: company?.id,
                                            }
                                        ]}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <RadioGroup
                                        value={notApplicableReason}
                                        onValueChange={setNotApplicableReason}
                                        className="gap-3"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="Salesman Bill" id="na-salesman" />
                                            <Label htmlFor="na-salesman">Salesman Bill</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="Others" id="na-others" />
                                            <Label htmlFor="na-others">Others</Label>
                                        </div>
                                    </RadioGroup>

                                    {notApplicableReason === "Others" && (
                                        <Input
                                            placeholder="Enter reason"
                                            value={otherReason}
                                            onChange={(e) => setOtherReason(e.target.value)}
                                            className="mt-1"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <LoadingButton onClick={handleAction} className="w-full">
                        {isLoaded ? "Deliver Bill" : (notLoadedMode === "load" ? "Load Bill" : "Submit")}
                    </LoadingButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
