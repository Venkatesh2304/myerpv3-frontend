import React, { useMemo, useState } from "react";
import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { dataProvider } from "@/lib/dataprovider";
import { useNotification } from "@refinedev/core";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SalesScanSummary, BillSummaryDialog, MismatchItem } from "./scanning-interface";
import { AnomalyDialog } from "./components/AnomalyDialog";
import { downloadFromFilePath } from "@/lib/download";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/custom/date-picker";
import { getFilterValue, handleFilterChange } from "@/lib/filters";
import { CrudFilters } from "@refinedev/core";

const SCAN_TYPE_OPTIONS = [
    { value: "all", label: "All" },
    { value: "scanned", label: "Scanned" },
    { value: "not_scanned", label: "Not Scanned" },
];

const SalesScanFilters: React.FC<{
    filters: CrudFilters;
    setFilters: (filters: CrudFilters) => void;
    onAnomalyClick: () => void;
}> = ({ filters, setFilters, onAnomalyClick }) => {
    const resetFilters = () => {
        setFilters(["scan_type", "bill_date"].map((field) => ({
            field,
            operator: "eq",
            value: null,
        })));
    };

    return (
        <Card className="mb-4 pt-4 pb-4">
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="flex flex-col space-y-2">
                        <Label className="text-xs">Scan Type</Label>
                        <Select
                            value={getFilterValue(filters, "scan_type") || "all"}
                            onValueChange={(value) => handleFilterChange(setFilters, "scan_type", value === "all" ? null : value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Scan Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {SCAN_TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col space-y-2">
                        <Label className="text-xs">Bill Date</Label>
                        <DatePicker
                            value={getFilterValue(filters, "bill_date", null)}
                            onChange={(date) => handleFilterChange(setFilters, "bill_date", date)}
                        />
                    </div>

                    <Button type="button" variant="outline" onClick={resetFilters}>
                        Reset
                    </Button>

                    <Button type="button" variant="destructive" onClick={onAnomalyClick} className="ml-auto">
                        Anamoly
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export const SalesScanSummaryPage = () => {
    const { open } = useNotification();
    const [selectedScan, setSelectedScan] = useState<SalesScanSummary | null>(null);
    const [mismatchData, setMismatchData] = useState<MismatchItem[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [anomalyDialogOpen, setAnomalyDialogOpen] = useState(false);

    const columns = useMemo(() => {
        const columnHelper = createColumnHelper<SalesScanSummary>();

        return [
            columnHelper.accessor("bill_date", {
                id: "bill_date",
                header: "Bill Date",
                cell: ({ getValue }) => {
                    const val = getValue();
                    return val ? format(new Date(val), "PP") : "-";
                },
                size: 100
            }),
            columnHelper.accessor("bill_no", {
                id: "bill_no",
                header: "Bill Number",
                cell: ({ row, getValue }) => {
                    const { box_count, mismatches, is_posted } = row.original;
                    let colorClass = "text-green-600"; // Default to red
                    if (mismatches?.length == 0) {
                        colorClass = "text-green-600";
                    }
                    else if ((box_count <= 1)) {
                        colorClass = is_posted ? "text-red-600" : "text-gray-400";
                    } else if (mismatches && (Array.isArray(mismatches) && mismatches.length > 0)) {
                        colorClass = "text-red-600";
                    }

                    return (
                        <span className={cn("font-bold", colorClass)}>
                            {getValue()?.toUpperCase()}
                        </span>
                    );
                },
                size: 120
            }),
            columnHelper.accessor("party_name", {
                id: "party_name",
                header: "Party Name",
                cell: ({ getValue }) => <span className="truncate max-w-[300px] block">{getValue()}</span>,
                size: 250
            }),
            columnHelper.accessor("box_count", {
                id: "box_count",
                header: "Boxes",
                size: 80,
                cell: ({ getValue }) => getValue() - 1
            }),
            columnHelper.accessor("mismatches", {
                id: "mismatch_summary",
                header: "Mismatch",
                cell: ({ getValue, row }) => {
                    if ((row.original.box_count <= 1) && (!row.original.is_posted)) return "-";
                    const mismatches = getValue();
                    if (!mismatches || !Array.isArray(mismatches) || mismatches.length === 0) return "-";
                    const productCount = mismatches.length;
                    const totalQty = mismatches.reduce((acc, curr) => acc + Math.abs((curr.billed || 0) - (curr.scanned || 0)), 0);
                    return `${productCount} Products, ${totalQty} Qty`;
                },
                size: 150
            }),
            columnHelper.accessor("scanned_time", {
                id: "scanned_time",
                header: "Scanned Time",
                cell: ({ getValue }) => {
                    const val = getValue();
                    return val ? format(new Date(val), "PP p") : "-";
                },
                size: 180
            }),
        ];
    }, []);

    const table = useTable({
        columns,
        enableRowSelection: false,
        refineCoreProps: {
            resource: "sales_scan",
            pagination: {
                mode: "server",
                pageSize: 30,
            },
            syncWithLocation: true,
        },
    });

    const { refineCore: { filters, setFilters } } = table;

    const handleRowClick = async (row: SalesScanSummary) => {
        setSelectedScan(row);
        setDialogOpen(true);
        setMismatchData([]); // Reset while loading

        try {
            const res = await dataProvider.custom({
                url: "sales_scan_mismatch/",
                method: "post",
                payload: { scan_id: row.id }
            });

            if (Array.isArray(res.data)) {
                setMismatchData(res.data);
            } else {
                setMismatchData(res.data?.mismatches || []);
            }
        } catch (error) {
            open?.({ type: "error", message: "Failed to fetch mismatches" });
        }
    };

    const handleDownloadSummary = async () => {
        if (!selectedScan?.id) return;
        try {
            const res = await dataProvider.custom({
                url: "sales_scan_summary/",
                method: "post",
                payload: { scan_id: selectedScan.id }
            });
            if (res.data?.filepath) {
                await downloadFromFilePath(res.data.filepath);
                open?.({ type: "success", message: "Summary Downloaded" });
            } else {
                open?.({ type: "error", message: "No file generated" });
            }
        } catch (error) {
            open?.({ type: "error", message: "Download Failed" });
        }
    };

    return (
        <div className="container max-w-full space-y-4">
            <SalesScanFilters
                filters={filters}
                setFilters={setFilters}
                onAnomalyClick={() => setAnomalyDialogOpen(true)}
            />
            <DataTable
                table={table}
                onRowEnter={handleRowClick}
            />

            <BillSummaryDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                items={mismatchData}
                onDownload={handleDownloadSummary}
                partyName={selectedScan?.party_name}
            />

            <AnomalyDialog
                open={anomalyDialogOpen}
                onOpenChange={setAnomalyDialogOpen}
            />
        </div>
    );
};
