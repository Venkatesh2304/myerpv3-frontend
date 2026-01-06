import { DatePicker } from "@/components/custom/date-picker";
import { getFilterValue, handleFilterChange } from "@/lib/filters";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CrudFilters, useList } from "@refinedev/core";
import React from "react";

const IS_PRINTED_OPTIONS = [
    { value: "all", label: "All" },
    { value: "true", label: "Printed" },
    { value: "false", label: "Not Printed" },
];

const BEAT_TYPE_OPTIONS = [
    { value: "all", label: "All" },
    { value: "retail", label: "Retail" },
    { value: "wholesale", label: "Wholesale" },
];

export const mapFormToFilters = (values: any) => {
    const filters: CrudFilters = [];

    if (values.date) {
        filters.push({
            field: "date",
            operator: "eq",
            value: values.date,
        });
    }

    if (values.salesman && values.salesman !== "all") {
        filters.push({
            field: "salesman",
            operator: "eq",
            value: values.salesman,
        });
    }

    if (values.is_printed && values.is_printed !== "all") {
        filters.push({
            field: "is_printed",
            operator: "eq",
            value: values.is_printed,
        });
    }

    if (values.beat_type && values.beat_type !== "all") {
        filters.push({
            field: "beat_type",
            operator: "eq",
            value: values.beat_type,
        });
    }

    if (values.print_type && values.print_type !== "all") {
        filters.push({
            field: "print_type",
            operator: "eq",
            value: values.print_type,
        });
    }
    return filters;
};

const SalesmanFilter = React.memo(({ value, onChange, companyId }: { value: string; onChange: (value: string) => void; companyId?: string | number }) => {
    const {
        query: { data: salesmanData },
    } = useList({
        resource: "salesman",
        pagination: { mode: "off" },
        filters: companyId ? [
            {
                field: "company",
                operator: "eq",
                value: companyId,
            }
        ] : undefined,
    });
    return (
        <div className="flex flex-col space-y-2">
            <Label className="text-xs">Salesman</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Salesman" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {(salesmanData as any)?.data?.map((item: any) => (
                        <SelectItem key={item} value={item}>
                            {item}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
});

export const BillFilters: React.FC<{
    filters: CrudFilters;
    setFilters: (filters: CrudFilters) => void;
    companyId?: string | number;
}> = ({ filters, setFilters, companyId }) => {

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col space-y-2">
                <Label className="text-xs">Bill Date</Label>
                <DatePicker
                    value={getFilterValue(filters, "date", null)}
                    onChange={(date) => handleFilterChange(setFilters, "date", date)}
                    placeholder="Select date"
                />
            </div>

            <SalesmanFilter
                value={getFilterValue(filters, "salesman")}
                onChange={(value) => handleFilterChange(setFilters, "salesman", value)}
                companyId={companyId}
            />

            <div className="flex flex-col space-y-2">
                <Label className="text-xs">Is Printed</Label>
                <Select
                    value={getFilterValue(filters, "is_printed")}
                    onValueChange={(value) => handleFilterChange(setFilters, "is_printed", value)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Is Printed" />
                    </SelectTrigger>
                    <SelectContent>
                        {IS_PRINTED_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col space-y-2">
                <Label className="text-xs">Beat Type</Label>
                <Select
                    value={getFilterValue(filters, "beat_type")}
                    onValueChange={(value) => handleFilterChange(setFilters, "beat_type", value)}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Beat Type" />
                    </SelectTrigger>
                    <SelectContent>
                        {BEAT_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};
