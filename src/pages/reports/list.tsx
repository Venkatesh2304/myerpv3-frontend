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

// --- Types ---

type ReportConfig = {
    id: string;
    label: string;
    url: string;
    includeCompany?: boolean;
    defaultValues: Record<string, any>;
    FormFields: React.FC<{ form: UseFormReturn<any> }>;
};

// --- Generic Component ---

const GenericReportForm = ({ config }: { config: ReportConfig }) => {
    const dataProvider = useDataProvider();
    const { open } = useNotification();
    const { company } = useCompany();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        defaultValues: config.defaultValues,
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

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-x-8 w-fit-content flex align-center items-end">
                <config.FormFields form={form} />
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Download Report
                </Button>
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
                <CardContent className="space-x-12 flex">
                    <div className="max-w-md">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Type
                        </label>
                        <Select value={selectedReportId} onValueChange={setSelectedReportId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select report type" />
                            </SelectTrigger>
                            <SelectContent>
                                {reportConfigs.map((config) => (
                                    <SelectItem key={config.id} value={config.id}>
                                        {config.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <GenericReportForm config={selectedConfig} />

                    {/* <div className="pt-4 border-t">
                    </div> */}
                </CardContent>
            </Card>
        </div>
    );
};
