import React, { useMemo } from "react";
import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { CrudFilters, useNavigation } from "@refinedev/core";
import { useCompany } from "@/providers/company-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/custom/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ResourceCombobox } from "@/components/custom/resource-combobox";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { getFilterValue, handleFilterChange } from "@/lib/filters";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";
import { DebouncedInput } from "@/components/ui/debounced-input";

const TYPE_OPTIONS = [
    { value: "all", label: "All" },
    { value: "not_delivered", label: "Not Delivered" },
    { value: "not_loaded", label: "Not Loaded" },
    { value: "loaded", label: "Loaded" },
    { value: "delivered", label: "Delivered" },
];

const VehicleFilters: React.FC<{
    filters: CrudFilters;
    setFilters: (filters: CrudFilters) => void;
}> = ({ filters, setFilters }) => {
    const { company } = useCompany();

    const resetFilters = () => {
        setFilters(["vehicle", "type", "loading_date", "delivery_date", "party", "bill"].map((field) => ({
            field,
            operator: "eq",
            value: null,
        })));
    };

    return (
        <Card className="mb-4 pt-4 pb-4">
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-8 gap-3 items-end">

                    <div className="flex flex-col space-y-2">
                        <Label className="text-xs">Vehicle</Label>
                        <ResourceCombobox
                            resource="vehicle"
                            labelKey="name"
                            valueKey="id"
                            value={getFilterValue(filters, "vehicle", null)}
                            onValueChange={(value) => handleFilterChange(setFilters, "vehicle", value)}
                            filters={[
                                {
                                    field: "company",
                                    operator: "eq",
                                    value: company?.id,
                                }
                            ]}
                        />
                    </div>

                    <div className="flex flex-col space-y-2">
                        <Label className="text-xs">Type</Label>
                        <Select
                            value={getFilterValue(filters, "type")}
                            onValueChange={(value) => handleFilterChange(setFilters, "type", value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {TYPE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col space-y-2">
                        <Label className="text-xs">Loading Date</Label>
                        <DatePicker
                            value={getFilterValue(filters, "loading_date", null)}
                            onChange={(date) => handleFilterChange(setFilters, "loading_date", date)}
                        />
                    </div>

                    <div className="flex flex-col space-y-2">
                        <Label className="text-xs">Delivery Date</Label>
                        <DatePicker
                            value={getFilterValue(filters, "delivery_date", null)}
                            onChange={(date) => handleFilterChange(setFilters, "delivery_date", date)}
                        />
                    </div>

                    <div className="flex flex-col space-y-2">
                        <Label className="text-xs">Bill No</Label>
                        <DebouncedInput
                            value={getFilterValue(filters, "bill", null)}
                            onChange={(value) => handleFilterChange(setFilters, "bill", value)}
                            placeholder="Bill No"
                        />
                    </div>

                    <div className="flex flex-col space-y-2 col-span-2">
                        <Label className="text-xs">Party</Label>
                        <ResourceCombobox
                            resource="party"
                            labelKey="label"
                            valueKey="value"
                            minSearchLength={3}
                            value={getFilterValue(filters, "party", null)}
                            onValueChange={(value) => handleFilterChange(setFilters, "party", value)}
                            filters={[
                                {
                                    field: "company",
                                    operator: "eq",
                                    value: company?.id,
                                }
                            ]}
                        />
                    </div>

                    <Button type="button" variant="outline" onClick={resetFilters}>
                        Reset
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export const VehicleSummaryPage = () => {
    const { company } = useCompany();

    const columns = useMemo(() => {
        const columnHelper = createColumnHelper<any>();

        return [
            columnHelper.accessor("bill", {
                id: "bill",
                header: "Bill",
                enableSorting: true,
                cell: ({ row, getValue }) => (
                    <span className={cn(
                        "font-bold",
                        row.original.loading_sheet ? "text-green-600" : "text-blue-600"
                    )}>
                        {getValue()}
                    </span>
                ),
                size: 100
            }),
            columnHelper.accessor("vehicle", {
                id: "vehicle",
                header: "Vehicle",
                enableSorting: true,
                cell: ({ getValue }) => getValue(),
                size: 100
            }),

            columnHelper.accessor("party", {
                id: "party",
                header: "Party",
                enableSorting: true,
                cell: ({ getValue }) => getValue(),
                size: 250
            }),
            columnHelper.accessor("loading_time", {
                id: "loading_time",
                header: "Loading Time",
                enableSorting: true,
                cell: ({ getValue }) => getValue() ? format(new Date(getValue()), "PP p") : "-",
                size: 200
            }),
            columnHelper.accessor("delivery_time", {
                id: "delivery_time",
                header: "Delivery Time",
                enableSorting: true,
                cell: ({ getValue }) => getValue() ? format(new Date(getValue()), "PP p") : "-",
                size: 200
            }),
        ];
    }, []);

    const table = useTable({
        columns,
        enableRowSelection: true,
        refineCoreProps: {
            resource: "bill_scan",
            syncWithLocation: true,
            filters: {
                permanent: [
                    {
                        field: "company",
                        operator: "eq",
                        value: company?.id,
                    },
                    {
                        field: "is_loading_sheet",
                        operator: "eq",
                        value: false,
                    }
                ],
                initial: [
                    {
                        field: "loading_date",
                        operator: "eq",
                        value: format(subDays(new Date(), 1), "yyyy-MM-dd"),
                    },
                    {
                        field: "type",
                        operator: "eq",
                        value: "not_delivered",
                    }
                ]
            },
            pagination: {
                mode: "server",
                pageSize: 50
            },
            queryOptions: {
                enabled: !!company?.id
            },
        },
    });

    const { refineCore: { filters, setFilters } } = table;

    return (
        <div className="container max-w-full">
            <VehicleFilters filters={filters} setFilters={setFilters} />
            <DataTable table={table} />
        </div>
    );
};
