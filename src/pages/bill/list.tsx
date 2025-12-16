import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/common";
import { CrudFilters } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { Check } from "lucide-react";
import React from "react";
import { BillFilters, mapFormToFilters } from "./components/bill-filters";
import { PrintAction } from "./components/print-action";
import type { Bill } from "./types";

import { useCompany } from "@/providers/company-provider";
import { CaptchaProvider, useCaptcha } from "@/components/custom/CaptchaProvider";

export const BillList = () => {
    const { company } = useCompany();
    const DEFAULT_FILTER_VALUES = {
        date: new Date().toISOString().split("T")[0],
        salesman: "all",
        is_printed: "false",
        beat_type: "retail",
    };

    const [filters, setFilters] = React.useState<CrudFilters>(() =>
        mapFormToFilters(DEFAULT_FILTER_VALUES)
    );

    const [permanentFilters, setPermanentFilters] = React.useState<CrudFilters>([]);

    React.useEffect(() => {
        setPermanentFilters([
            ...filters,
            {
                field: "company",
                operator: "eq",
                value: company?.id,
            }
        ]);
    }, [filters, company]);

    const columns = React.useMemo(() => {
        const columnHelper = createColumnHelper<Bill>();

        return [
            columnHelper.accessor("bill", {
                id: "bill",
                header: "Bill No",
                enableSorting: true,
                size: 50,
                cell: ({ getValue }) => <span className="font-medium text-green-600">{getValue()}</span>,
            }),
            columnHelper.accessor("party", {
                id: "party",
                header: "Party",
                enableSorting: true,
                cell: ({ getValue }) => <span className="font-medium text-blue-600">{getValue()}</span>,
                size: 150,
            }),
            columnHelper.accessor("date", {
                id: "date",
                header: "Date",
                enableSorting: true,
                cell: ({ getValue }) => formatDate(getValue()),
                size: 75,
            }),
            columnHelper.accessor("print_type", {
                id: "print_type",
                header: "Bill Type",
                cell: ({ getValue }) => (getValue() ? (getValue() == "first_copy" ? "First Copy" : "Loading Sheet Salesman") : "-"),
                size: 100,
            }),
            columnHelper.accessor("salesman", {
                id: "salesman",
                header: "Salesman",
                enableSorting: true,
                cell: ({ getValue }) => getValue(),
                size: 100
            }),
            columnHelper.accessor("amt", {
                id: "amt",
                header: "Amount",
                enableSorting: true,
                cell: ({ getValue }) => `₹${(Number(getValue())).toLocaleString("en-IN")}`,
                size: 75
            }),
            columnHelper.accessor("beat", {
                id: "beat",
                header: "Beat",
                enableSorting: true,
                cell: ({ getValue }) => getValue(),
                size: 150
            }),
            columnHelper.accessor("print_time", {
                id: "print_time",
                header: "Print Time",
                enableSorting: true,
                cell: ({ getValue }) => {
                    const value = getValue();
                    if (!value) return "-";
                    return new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
                },
                size: 50
            }),
            columnHelper.accessor("einvoice", {
                id: "einvoice",
                header: "E-Invoice",
                enableSorting: true,
                cell: ({ getValue }) => getValue() ? <Check className="h-4 w-4 text-green-500" /> : null,
                size: 50
            }),
        ];
    }, []);

    const table = useTable({
        columns,
        getRowId: (originalRow) => originalRow.bill,
        refineCoreProps: {
            filters: {
                permanent: permanentFilters,
            },
            pagination: {
                mode: "client",
                pageSize: 50,
            },
            queryOptions: {
                retry: 1,
                enabled: permanentFilters?.length > 0
            },
        },
    });

    return (
        <CaptchaProvider>
            <ListView>
                <Card className="mb-2 pt-4 pb-4">
                    <CardContent>
                        <BillFilters setFilters={setFilters} defaultValues={DEFAULT_FILTER_VALUES} companyId={company?.id} />
                        <PrintAction table={table} />
                    </CardContent>
                </Card >
                <DataTable table={table} />
            </ListView>
        </CaptchaProvider>
    );
};
