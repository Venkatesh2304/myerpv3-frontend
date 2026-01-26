import React, { useState } from "react";
import { useCustom } from "@refinedev/core";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useCompany } from "@/providers/company-provider";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface ScanSummaryItem {
    date: string;
    not_loaded: number;
    loaded: number;
    delivered: number;
    not_delivered: number;
}

interface ScanSummaryResponse {
    summary: {
        bill_date: ScanSummaryItem[];
        loading_date: ScanSummaryItem[];
    }
}

interface ScanSummaryDialogProps {
    onFilterClick: (date: string, type: string, field: "bill_date" | "loading_date") => void;
}

interface SummaryTableProps {
    data: ScanSummaryItem[];
    dateLabel: string;
    field: "bill_date" | "loading_date";
    showNotLoaded?: boolean;
    onCellClick: (date: string, type: string, field: "bill_date" | "loading_date") => void;
}

const SummaryTable: React.FC<SummaryTableProps> = ({
    data,
    dateLabel,
    field,
    showNotLoaded = true,
    onCellClick
}) => (
    <div>
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{dateLabel}</TableHead>
                        {showNotLoaded && <TableHead className="text-right">Not Loaded</TableHead>}
                        <TableHead className="text-right">Loaded</TableHead>
                        <TableHead className="text-right">Delivered</TableHead>
                        <TableHead className="text-right">Not Delivered</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={showNotLoaded ? 5 : 4} className="text-center py-4">
                                No data found
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{item.date}</TableCell>
                                {showNotLoaded && (
                                    <TableCell
                                        className={cn(
                                            "text-right cursor-pointer hover:bg-accent transition-colors",
                                            item.not_loaded > 0 && "text-red-600 font-bold"
                                        )}
                                        onClick={() => onCellClick(item.date, "not_loaded", field)}
                                    >
                                        {item.not_loaded}
                                    </TableCell>
                                )}
                                <TableCell
                                    className="text-right cursor-pointer hover:bg-accent transition-colors"
                                    onClick={() => onCellClick(item.date, "loaded", field)}
                                >
                                    {item.loaded}
                                </TableCell>
                                <TableCell
                                    className="text-right cursor-pointer hover:bg-accent transition-colors"
                                    onClick={() => onCellClick(item.date, "delivered", field)}
                                >
                                    {item.delivered}
                                </TableCell>
                                <TableCell
                                    className={cn(
                                        "text-right cursor-pointer hover:bg-accent transition-colors",
                                        item.not_delivered > 0 && "text-red-600 font-bold"
                                    )}
                                    onClick={() => onCellClick(item.date, "not_delivered", field)}
                                >
                                    {item.not_delivered}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
);

export const ScanSummaryDialog: React.FC<ScanSummaryDialogProps> = ({ onFilterClick }) => {
    const [open, setOpen] = useState(true);
    const { company } = useCompany();
    const { query: { data, isLoading } } = useCustom<ScanSummaryResponse>({
        url: "scan_summary/",
        method: "get",
        config: {
            query: {
                company: company?.id,
            },
        },
        queryOptions: {
            enabled: !!company?.id && open,
        },
    });

    const billDateSummary = data?.data?.summary.bill_date || [];
    const loadingDateSummary = data?.data?.summary.loading_date || [];

    const handleCellClick = (date: string, type: string, field: "bill_date" | "loading_date") => {
        onFilterClick(date, type, field);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">Summary</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Scan Summary</DialogTitle>
                </DialogHeader>
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Spinner className="size-8" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        <SummaryTable
                            data={loadingDateSummary}
                            dateLabel="Loading Date"
                            field="loading_date"
                            showNotLoaded={false}
                            onCellClick={handleCellClick}
                        />
                        <SummaryTable
                            data={billDateSummary}
                            dateLabel="Bill Date"
                            field="bill_date"
                            onCellClick={handleCellClick}
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
