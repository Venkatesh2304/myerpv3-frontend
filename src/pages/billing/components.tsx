import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import { DatePicker } from "@/components/custom/date-picker";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { cn } from "@/lib/utils";
import { BillingStats, BillingStatus, Order } from "./types";

interface BillingControlsProps {
    form: UseFormReturn<any>;
    onStart: () => void;
}

export const BillingControls: React.FC<BillingControlsProps> = ({ form, onStart }) => {
    return (
        <div className="w-3/5">
            <Form {...form}>
                <div className="flex items-end gap-10 bg-card p-4 rounded-lg border shadow-sm">
                    <FormField
                        control={form.control}
                        name="lines"
                        render={({ field }) => (
                            <FormItem className="grid w-full max-w-sm items-center gap-1.5">
                                <FormLabel className="text-xs">Bill Lines</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        value={field.value || ""}
                                        onChange={(e) => field.onChange(Number(e.target.value || 0))}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="interval"
                        render={({ field }) => (
                            <FormItem className="grid w-full max-w-sm items-center gap-1.5">
                                <FormLabel className="text-xs">Time Interval</FormLabel>
                                <FormControl>
                                    <Input
                                        type="number"
                                        {...field}
                                        value={field.value || ""}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <DatePicker
                            control={form.control}
                            name="date"
                            label="Order Date"
                        />
                    </div>
                    <LoadingButton onClick={onStart} className="bg-blue-600 hover:bg-blue-700">
                        START
                    </LoadingButton>
                </div>
            </Form>
        </div>
    );
};

interface BillingDashboardProps {
    stats: BillingStats["stats"] | undefined;
    statusData: BillingStatus[];
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({ stats, statusData }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
            {/* Last Stats */}
            <Card>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="font-bold text-base">TYPE</span>
                            <span className="font-bold text-base">COUNT</span>
                        </div>
                        <div className="border-t my-2"></div>
                        {stats?.last && Object.entries(stats.last).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-base">
                                <span className="text-muted-foreground">{key}</span>
                                <span>{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Process Status */}
            <Card>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="font-bold text-base">PROCESS</span>
                            <span className="font-bold text-base">TIME</span>
                        </div>
                        <div className="border-t my-2"></div>
                        {statusData?.map((status: BillingStatus, index: number) => (
                            <div key={index} className="flex items-center justify-between text-base">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            "h-5 w-5 rounded-full",
                                            status.status === 0 && "bg-gray-300",
                                            status.status === 1 && "bg-green-500",
                                            status.status === 2 && "bg-green-500 animate-[pulse_0.8s_ease-in-out_infinite]",
                                            status.status === 3 && "bg-red-500",
                                            "mr-5"
                                        )}
                                    />
                                    <span>{status.process}</span>
                                </div>
                                <span>{status.time ? status.time.toFixed(2) : "-"}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Today Stats */}
            <Card>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="font-bold text-base">TYPE</span>
                            <span className="font-bold text-base">COUNT</span>
                        </div>
                        <div className="border-t my-2"></div>
                        {stats?.today && Object.entries(stats.today).map(([key, value]) => (
                            <div key={key} className="flex justify-between text-base">
                                <span className="text-muted-foreground">{key}</span>
                                <span>{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

interface OrdersListProps {
    table: any;
    orderType: "creditlock" | "rejected" | "pending";
    setOrderType: (type: "creditlock" | "rejected" | "pending") => void;
    counts: BillingStats["stats"]["bill_counts"] | undefined;
}

export const OrdersList: React.FC<OrdersListProps> = ({ table, orderType, setOrderType, counts }) => {
    return (
        <Tabs
            defaultValue="creditlock"
            value={orderType}
            onValueChange={(v) => setOrderType(v as any)}
            className="w-full"
        >
            <TabsList className="w-2/5">
                <TabsTrigger value="creditlock">
                    CREDITLOCK ({counts?.creditlock || 0})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                    REJECTED ({counts?.rejected || 0})
                </TabsTrigger>
                <TabsTrigger value="pending">
                    PENDING ({counts?.pending || 0})
                </TabsTrigger>
            </TabsList>
            <div className="mt-4 border rounded-md">
                <DataTable table={table} />
            </div>
        </Tabs>
    );
};
