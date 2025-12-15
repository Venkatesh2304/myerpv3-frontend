import { DatePicker } from "@/components/custom/date-picker";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useFilters } from "@/hooks/filters";
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
    console.log("Filter: ", filters);
    return filters;
};

const SalesmanFilter = React.memo(({ control, companyId }: { control: any; companyId?: string | number }) => {
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
        <FormField
            control={control}
            name="salesman"
            render={({ field }) => (
                <FormItem>
                    <FormLabel className="text-xs">Salesman</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                        <FormControl>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Salesman" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            {(salesmanData as any)?.data?.map((item: any) => (
                                <SelectItem key={item} value={item}>
                                    {item}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </FormItem>
            )}
        />
    );
});

export const BillFilters: React.FC<{
    setFilters: React.Dispatch<React.SetStateAction<CrudFilters>>;
    defaultValues: Record<string, any>;
    companyId?: string | number;
}> = ({ setFilters, defaultValues, companyId }) => {
    const { form } = useFilters({
        defaultValues,
        setFilters,
        formToFilters: mapFormToFilters,
    });

    return (
        <Form {...form}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <DatePicker
                    control={form.control}
                    name="date"
                    label="Bill Date"
                    placeholder="Select date"
                    disabled={form.formState.isSubmitting}
                />

                <SalesmanFilter control={form.control} companyId={companyId} />

                <FormField
                    control={form.control}
                    name="is_printed"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">Is Printed</FormLabel>
                            <Select value={field.value || ""} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Is Printed" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {IS_PRINTED_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="beat_type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">Beat Type</FormLabel>
                            <Select value={field.value || ""} onValueChange={field.onChange}>
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Beat Type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {BEAT_TYPE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
            </div>
        </Form>
    );
};
