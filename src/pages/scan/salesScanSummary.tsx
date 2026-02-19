import React, { useMemo, useState } from "react";
import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { dataProvider } from "@/lib/dataprovider";
import { useNotification } from "@refinedev/core";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SalesScanSummary, BillSummaryDialog, MismatchItem } from "./scanning-interface";
import { downloadFromFilePath } from "@/lib/download";

export const SalesScanSummaryPage = () => {
    const { open } = useNotification();
    const [selectedScan, setSelectedScan] = useState<SalesScanSummary | null>(null);
    const [mismatchData, setMismatchData] = useState<MismatchItem[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);

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

                    if (box_count <= 1) {
                        colorClass = is_posted ? "text-orange-600" : "text-gray-400";
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
                    if (row.original.box_count <= 1) return "-";
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
        </div>
    );
};
