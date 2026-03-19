import React, { useState } from "react";
import { format } from "date-fns";
import { useNotification } from "@refinedev/core";
import { dataProvider } from "@/lib/dataprovider";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/custom/date-picker";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";

interface AnomalyItem {
    product: string;
    party: string;
    bill_no: string;
    desc: string;
    mrp?: string | number;
}

interface AnomalyResponse {
    fake_scans: AnomalyItem[];
    manual_entries: AnomalyItem[];
    mismatches: AnomalyItem[];
}

interface AnomalyDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const AnomalyTable: React.FC<{ title: string; items: AnomalyItem[] }> = ({ title, items }) => {
    if (items.length === 0) return null;

    return (
        <div className="space-y-2">
            <h3 className="font-semibold text-lg">{title}</h3>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>MRP</TableHead>
                            <TableHead>Party</TableHead>
                            <TableHead>Bill No</TableHead>
                            <TableHead>Description</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{item.product}</TableCell>
                                <TableCell>{item.mrp || "-"}</TableCell>
                                <TableCell>{item.party}</TableCell>
                                <TableCell>{item.bill_no}</TableCell>
                                <TableCell className="text-red-600 font-medium">{item.desc}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export const AnomalyDialog: React.FC<AnomalyDialogProps> = ({ open, onOpenChange }) => {
    const { open: notify } = useNotification();
    const [date, setDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<AnomalyResponse | null>(null);

    const handleSubmit = async () => {
        if (!date) {
            notify?.({ type: "error", message: "Please select a date" });
            return;
        }

        setLoading(true);
        setData(null); // Clear previous data

        try {
            const res = await dataProvider.custom<AnomalyResponse>({
                url: "anomaly_analysis/",
                method: "get",
                query: {
                    date: date,
                },
            });

            setData(res.data);
            if (
                res.data.fake_scans.length === 0 &&
                res.data.manual_entries.length === 0 &&
                res.data.mismatches.length === 0
            ) {
                notify?.({ type: "success", message: "No anomalies found for this date" });
            }
        } catch (error) {
            notify?.({ type: "error", message: "Failed to fetch anomaly data" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Anomaly Analysis</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col space-y-4">
                    <div className="flex items-end gap-4 border-b pb-4">
                        <div className="flex flex-col space-y-2 flex-1 max-w-[200px]">
                            <Label className="text-xs">Analysis Date</Label>
                            <DatePicker
                                value={date}
                                onChange={(val) => setDate(val || "")}
                            />
                        </div>
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading && <Spinner className="mr-2 size-4" />}
                            Submit
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Spinner className="size-8" />
                        </div>
                    ) : (
                        data && (
                            <div className="space-y-6">
                                <AnomalyTable title="Fake Scans" items={data.fake_scans} />
                                <AnomalyTable title="Manual Entries" items={data.manual_entries} />
                                <AnomalyTable title="Mismatches" items={data.mismatches} />
                            </div>
                        )
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
