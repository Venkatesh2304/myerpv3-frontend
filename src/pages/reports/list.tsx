import { useState, useEffect } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { useDataProvider, useNotification } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/custom/date-picker";
import { format } from "date-fns";
import { downloadFromFilePath } from "@/lib/download";
import { Loader2 } from "lucide-react";
import { useCompany } from "@/providers/company-provider";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { useTable } from "@refinedev/react-table";
import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// --- Types ---

type ReportConfig = {
    id: string;
    label: string;
    url: string;
    includeCompany?: boolean;
    defaultValues: Record<string, any>;
    FormFields: React.FC<{ form: UseFormReturn<any> }>;
    ExtraComponent?: React.FC<{ form: UseFormReturn<any> }>;
    resolver?: any;
};

// --- Generic Component ---

const GenericReportForm = ({ config }: { config: ReportConfig }) => {
    const dataProvider = useDataProvider();
    const { open } = useNotification();
    const { company } = useCompany();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        defaultValues: config.defaultValues,
        resolver: config.resolver,
    });

    // Reset form when config changes
    useEffect(() => {
        form.reset(config.defaultValues);
    }, [config.id, config.defaultValues, form]);

    const onSubmit = async (values: any) => {
        setLoading(true);
        const payload = { ...values };

        if (config.includeCompany) {
            if (!company?.id) {
                throw new Error("Company is not selected");
            }
            payload.company = company.id;
        }

        await dataProvider().custom({
            url: config.url,
            method: "post",
            payload: payload,
        }).then(async (res) => {
            const data = res?.data;
            if (data.filepath) {
                console.log(1);
                await downloadFromFilePath(data.filepath);
                open?.({
                    type: "success",
                    message: "Report downloaded successfully",
                });
            } else {
                open?.({
                    type: "error",
                    message: "No FilePath Found in Response",
                });
            }
        }).catch((error) => {
            console.log(error);
            open?.({
                type: "error",
                message: `Failed to download report: ${error.response?.data?.error || error.message}`,
            });
        }).finally(() => {
            setLoading(false);
        });
    };

    const onInvalid = (errors) => {
        //Combine all error values
        let errorMessages = [];
        for (const key in errors) {
            errorMessages.push(errors[key].message);
        }
        open?.({
            type: "error",
            message: errorMessages.join(", "),
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
                <div className="space-x-8 w-fit-content flex align-center items-end mb-10">
                    <config.FormFields form={form} />
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Download Report
                    </Button>
                </div>
                {config.ExtraComponent && (
                    <config.ExtraComponent form={form} />
                )}
            </form>
        </Form>
    );
};

// --- Report Configurations ---

const OutstandingReportFields = ({ form }: { form: UseFormReturn<any> }) => (
    <>
        <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                        <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />

        <FormField
            control={form.control}
            name="beat_type"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Beat Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select beat type" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="retail">Retail</SelectItem>
                            <SelectItem value="wholesale">Wholesale</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />
    </>
);

const BeatDataTable = ({ form }: { form: UseFormReturn<any> }) => {
    const { company } = useCompany();
    const columns = React.useMemo(() => {
        const columnHelper = createColumnHelper<any>();
        return [
            columnHelper.accessor("name", {
                header: "Name",
            }),
            columnHelper.accessor("salesman", {
                header: "Salesman",
            }),
            columnHelper.accessor("days", {
                header: "Days",
            }),
            columnHelper.accessor("plg", {
                header: "PLG",
            }),
        ];
    }, []);
    const date = form?.watch("date");
    const beat_type = form?.watch("beat_type");

    const table = useTable({
        columns,
        getRowId: (originalRow) => originalRow.beat_id,
        refineCoreProps: {
            syncWithLocation: false,
            resource: "beat",
            filters: {
                permanent: [
                    {
                        field: "company",
                        operator: "eq",
                        value: company?.id,
                    },
                    {
                        field: "date",
                        operator: "eq",
                        value: date,
                    },
                    {
                        field: "beat_type",
                        operator: "eq",
                        value: beat_type,
                    }
                ],
            },
            pagination: {
                pageSize: 100,
                mode: "off"
            },
            queryOptions: {
                enabled: !!company?.id && !!date && !!beat_type
            },
        }
    });

    const { refineCore: { setFilters }, reactTable: { getSelectedRowModel } } = table;

    const selectedRows = getSelectedRowModel().rows;
    useEffect(() => {
        const selectedIds = selectedRows.map((row: any) => row.original.beat_id);
        form?.setValue("beat_ids", selectedIds);
    }, [selectedRows]);

    return (
        <DataTable
            table={table}
        />
    )
};

const StockReportFields = () => <></>;

const reportConfigs: ReportConfig[] = [
    {
        id: "outstanding",
        label: "Outstanding Report",
        url: "outstanding_report/",
        includeCompany: true,
        defaultValues: {
            date: format(new Date(), "yyyy-MM-dd"),
            beat_type: "retail",
        },
        FormFields: OutstandingReportFields,
    },
    {
        id: "stock",
        label: "Stock Report",
        url: "stock_report/",
        includeCompany: false,
        defaultValues: {},
        FormFields: StockReportFields,
    },
    {
        id: "pending_sheet",
        label: "Pending Sheet",
        url: "pending_sheet/",
        includeCompany: true,
        defaultValues: {
            date: format(new Date(), "yyyy-MM-dd"),
            beat_type: "retail",
            beat_ids: [],
        },
        FormFields: OutstandingReportFields,
        ExtraComponent: BeatDataTable,
        resolver: (values) => {
            const errors = {};
            if (!values?.beat_ids?.length) {
                errors.beat_ids = { "type": "manual", message: "At least one beat should be selected" };
            }
            return { values, errors };
        }
    },
    // Add more reports here
];

// --- Main Page Component ---

export const ReportsList = () => {
    const [selectedReportId, setSelectedReportId] = useState<string>(reportConfigs[0].id);

    const selectedConfig = reportConfigs.find(c => c.id === selectedReportId) || reportConfigs[0];

    return (
        <div className="p-4 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Download Report</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row lg:flex-row gap-6">
                        <aside className="w-full md:w-1/4 lg:w-1/5">
                            <ScrollArea className="h-[calc(100vh-250px)]">
                                <div className="flex flex-col space-y-1 p-1">
                                    {reportConfigs.map((config) => (
                                        <Button
                                            key={config.id}
                                            variant={selectedReportId === config.id ? "secondary" : "ghost"}
                                            className={cn(
                                                "w-full justify-start",
                                                selectedReportId === config.id && "bg-muted font-medium"
                                            )}
                                            onClick={() => setSelectedReportId(config.id)}
                                        >
                                            {config.label}
                                        </Button>
                                    ))}
                                </div>
                            </ScrollArea>
                        </aside>
                        <div className="flex-1">
                            <GenericReportForm config={selectedConfig} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
