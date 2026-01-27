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
    not_applicable?: number;
    total?: number;
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

interface ColumnConfig {
    header: string;
    key: keyof ScanSummaryItem;
    clickable?: boolean;
    className?: string;
    colorCondition?: (value: number) => boolean;
}

interface SummaryTableProps {
    data: ScanSummaryItem[];
    title: string;
    columns: ColumnConfig[];
    field: "bill_date" | "loading_date";
    onCellClick: (date: string, type: string, field: "bill_date" | "loading_date") => void;
}

const SummaryTable: React.FC<SummaryTableProps> = ({
    data,
    title,
    columns,
    field,
    onCellClick
}) => (
    <div className="space-y-3">
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col) => (
                            <TableHead
                                key={col.key}
                                className={cn(col.key !== "date" && "text-right", col.className)}
                            >
                                {col.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="text-center py-4">
                                No data found
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((item, index) => (
                            <TableRow key={index}>
                                {columns.map((col) => {
                                    const value = item[col.key];
                                    const isClickable = col.clickable && typeof value === "number";
                                    const shouldHighlight = col.colorCondition?.(value as number);

                                    return (
                                        <TableCell
                                            key={col.key}
                                            className={cn(
                                                col.key !== "date" && "text-right",
                                                col.key === "date" && "font-medium",
                                                isClickable && "cursor-pointer hover:bg-accent transition-colors",
                                                shouldHighlight && "text-red-600 font-bold",
                                                col.className
                                            )}
                                            onClick={() => {
                                                if (isClickable) {
                                                    onCellClick(item.date, col.key as string, field);
                                                }
                                            }}
                                        >
                                            {value ?? 0}
                                        </TableCell>
                                    );
                                })}
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

    const billDateSummary = data?.data?.summary.bill_date?.map(item => ({
        ...item,
        total: (item.not_loaded || 0) + (item.loaded || 0) + (item.not_applicable || 0)
    })) || [];
    const loadingDateSummary = data?.data?.summary.loading_date || [];

    const loadingDateColumns: ColumnConfig[] = [
        { header: "Loading Date", key: "date" },
        { header: "Loaded", key: "loaded", clickable: true },
        { header: "Delivered", key: "delivered", clickable: true },
        {
            header: "Not Delivered",
            key: "not_delivered",
            clickable: true,
            colorCondition: (val) => val > 0
        },
    ];

    const billDateColumns: ColumnConfig[] = [
        { header: "Bill Date", key: "date" },
        {
            header: "Not Loaded",
            key: "not_loaded",
            clickable: true,
            colorCondition: (val) => val > 0
        },
        { header: "Loaded", key: "loaded", clickable: true },
        { header: "Not Applicable", key: "not_applicable", clickable: false },
        { header: "Total", key: "total", clickable: false },
    ];

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
                            title="Loading Date Summary"
                            columns={loadingDateColumns}
                            field="loading_date"
                            onCellClick={handleCellClick}
                        />
                        <SummaryTable
                            data={billDateSummary}
                            title="Bill Date Summary"
                            columns={billDateColumns}
                            field="bill_date"
                            onCellClick={handleCellClick}
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
