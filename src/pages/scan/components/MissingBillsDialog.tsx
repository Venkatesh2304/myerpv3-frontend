import React, { useState } from "react";
import { useList } from "@refinedev/core";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MissingBillsDialogProps {
    vehicleId: string;
    trigger?: React.ReactNode;
}

export const MissingBillsDialog: React.FC<MissingBillsDialogProps> = ({ vehicleId, trigger }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const { query: { data: missingBillsData, isLoading } } = useList({
        resource: "bill_scan",
        filters: [
            {
                field: "vehicle",
                operator: "eq",
                value: vehicleId,
            },
            {
                field: "loading_date",
                operator: "eq",
                value: date,
            },
            {
                field: "type",
                operator: "eq",
                value: "not_delivered",
            }
        ],
        pagination: {
            mode: "off"
        },
        queryOptions: {
            enabled: isOpen && !!vehicleId,
        }
    });

    const missingBills = missingBillsData?.data || [];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Missing Bills</Button>}
            </DialogTrigger>
            <DialogContent className="h-[90vh] max-w-2xl flex flex-col">
                <DialogHeader>
                    <DialogTitle>Missing Bills</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 flex-1 overflow-hidden">
                    <div className="flex gap-2">
                        <Label>Loading Date</Label>
                        <Input
                            className="w-fit"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-hidden border rounded-md">
                        <ScrollArea className="h-full p-4">
                            {isLoading ? (
                                <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
                            ) : missingBills.length === 0 ? (
                                <p className="text-center text-muted-foreground p-4">No missing bills found for this date.</p>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {missingBills.map((item: any, index: number) => (
                                        <div key={item?.bill} className={cn(!item.loading_sheet ? "text-blue-500" : "text-green-500", "font-bold")}>
                                            {item.bill || item}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
