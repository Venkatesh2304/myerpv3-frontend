import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoadingButton } from "@/components/ui/loading-button";
import { DatePicker } from "@/components/custom/date-picker";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ProcessStats, OrderProduct } from "./types";
import { cn } from "@/lib/utils";
import { useCompany } from "@/providers/company-provider";
import { useNotification } from "@refinedev/core";
import { dataProvider } from "@/lib/dataprovider";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PartyCredibilityResponse } from "./types";

interface BillingControlsProps {
    form: UseFormReturn<any>;
    onGetOrders: () => void;
    onPlaceOrder: () => void;
    onCancel: () => void;
    onShowStats: () => void;
    loading: boolean;
    step: 'input' | 'review';
}

export const BillingControls: React.FC<BillingControlsProps> = ({ form, onGetOrders, onPlaceOrder, onCancel, onShowStats, loading, step }) => {
    return (
        <div className="w-full">
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
                                        disabled={step === 'review'}
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
                            disabled={step === 'review'}
                        />
                    </div>
                    {step === 'input' ? (
                        <LoadingButton
                            onClick={onGetOrders}
                            loading={loading}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            GET ORDERS
                        </LoadingButton>
                    ) : (
                        <div className="flex gap-4">
                            <LoadingButton
                                onClick={onCancel}
                                variant="outline"
                                disabled={loading}
                            >
                                CANCEL
                            </LoadingButton>
                            <LoadingButton
                                onClick={onPlaceOrder}
                                loading={loading}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                PLACE ORDER
                            </LoadingButton>
                        </div>
                    )}
                    <div className="flex-1 flex justify-end">
                        <Button variant="secondary" onClick={onShowStats}>
                            Show Stats
                        </Button>
                    </div>
                </div>
            </Form>
        </div>
    );
};

interface OrdersListProps {
    table: any;
    category: 'normal' | 'partial' | 'less_than_config';
    setCategory: (category: 'normal' | 'partial' | 'less_than_config') => void;
    selectedCount: number;
}

export const OrdersList: React.FC<OrdersListProps> = ({ table, category, setCategory, selectedCount }) => {
    return (
        <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
                <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="partial">Partial</SelectItem>
                        <SelectItem value="less_than_config">Less Than Config Value</SelectItem>
                    </SelectContent>
                </Select>
                {/* <div className="text-sm font-medium">
                    {selectedCount} selected / {table.options.data.length} total
                </div> */}
            </div>
            <div className="border rounded-md">
                <DataTable table={table} />
            </div>
        </div>
    );
};

interface OrderEditDialogProps {
    orderNo: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onOrderUpdate: (orderNo: string, newAllocatedValue: number) => void;
}

export const OrderEditDialog: React.FC<OrderEditDialogProps> = ({ orderNo, open, onOpenChange, onOrderUpdate }) => {
    const { company } = useCompany();
    const { open: notify } = useNotification();
    const [loading, setLoading] = React.useState(false);
    const [products, setProducts] = React.useState<OrderProduct[]>([]);

    React.useEffect(() => {
        if (open && orderNo && company?.id) {
            fetchOrderDetails();
        }
    }, [open, orderNo, company?.id]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const response = await dataProvider.custom?.({
                url: `/order/`,
                method: "get",
                query: {
                    company: company?.id,
                    order: orderNo,
                },
            });
            if (response?.data) {
                setProducts(response.data);
            }
        } catch (error: any) {
            notify?.({
                type: "error",
                message: "Error fetching order details",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!company?.id || !orderNo) return;

        try {
            const items = products.reduce((acc, product) => {
                acc[product.id] = product.qp;
                return acc;
            }, {} as Record<string, number>);

            await dataProvider.custom?.({
                url: `/order/`,
                method: "post",
                payload: {
                    items: items,
                    company: company.id, // Assuming company is needed for context
                    order: orderNo, // Assuming orderNo is needed
                },
            });

            notify?.({
                type: "success",
                message: "Order updated successfully",
            });
            onOrderUpdate(orderNo, totalValue);
            onOpenChange(false);
        } catch (error: any) {
            notify?.({
                type: "error",
                message: "Error updating order",
                description: error.response?.data?.error,
            });
        }
    };

    const handleQuantityChange = (id: string, value: string) => {
        const numValue = parseInt(value) || 0;
        setProducts(prev => prev.map(p => p.id === id ? { ...p, qp: numValue } : p));
    };

    const totalValue = React.useMemo(() => {
        return products.reduce((sum, product) => {
            return sum + (product.t * (product.qp || 0));
        }, 0);
    }, [products]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-[80vw] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-medium">{orderNo} : {products?.[0]?.p} </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-8">Loading...</div>
                ) : (
                    <div className="space-y-4">
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">Product</TableHead>
                                        <TableHead className="w-[50px]">Rate</TableHead>
                                        <TableHead className="w-[50px]">Order Qty</TableHead>
                                        <TableHead className="w-[50px]">Allocated</TableHead>
                                        <TableHead className="w-[100px]">To Bill</TableHead>
                                        <TableHead className="w-[150px]">Reason</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell>{product.bd}</TableCell>
                                            <TableCell>{product.t}</TableCell>
                                            <TableCell>{product.cq}</TableCell>
                                            <TableCell>{product.aq}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={product.qp || ""}
                                                    onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                                    className="w-20 h-8"
                                                />
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{product.ar}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-end items-center px-4">
                                <span className="text-lg font-semibold">Total Value: ₹{totalValue.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                                <LoadingButton onClick={handleSave}>Save Changes</LoadingButton>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

interface BillingStatsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    stats: ProcessStats | undefined;
    lastBillsCount?: number;
    lastBills?: string;
    lastTime?: string;
}

export const BillingStatsDialog: React.FC<BillingStatsDialogProps> = ({ open, onOpenChange, stats, lastBillsCount, lastBills, lastTime }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Last Billing</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {(
                        <div className="mb-4 p-4 bg-muted rounded-md">
                            {lastTime && <div className="text-sm ">Last Time: {lastTime}</div>}
                            {lastBillsCount && <div className="text-sm ">Last Bills Count: {lastBillsCount}</div>}
                            {lastBills && <div className="font-semibold">{lastBills}</div>}
                        </div>
                    )}

                    <div className="space-y-2 text-sm">
                        {stats && Object.entries(stats).map(([process, time]) => (
                            <div key={process} className="flex justify-between items-center border-b pb-2">
                                <span>{process}</span>
                                <span className={cn(
                                    time === -1 ? "text-red-500" : "text-green-500"
                                )}>
                                    {time === -1 ? "Failed" : `${time.toFixed(2)}`}
                                </span>
                            </div>
                        ))}
                        {!stats && <div className="text-center text-muted-foreground">No stats available</div>}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

interface PartyDetailsDialogProps {
    partyName: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const PartyDetailsDialog: React.FC<PartyDetailsDialogProps> = ({ partyName, open, onOpenChange }) => {
    const { company } = useCompany();
    const { open: notify } = useNotification();
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<PartyCredibilityResponse | null>(null);
    const [graphType, setGraphType] = React.useState<'days' | 'values'>('days');

    React.useEffect(() => {
        if (open && partyName && company?.id) {
            fetchPartyDetails();
        }
    }, [open, partyName, company?.id]);

    const fetchPartyDetails = async () => {
        setLoading(true);
        try {
            const response = await dataProvider.custom?.({
                url: `/party_credibility/`,
                method: "get",
                query: {
                    company: company?.id,
                    party_name: partyName,
                },
            });
            if (response?.data) {
                setData(response.data);
            }
        } catch (error: any) {
            notify?.({
                type: "error",
                message: "Error fetching party details",
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="min-w-[60vw] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Party Details: {partyName}</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-8">Loading...</div>
                ) : data ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-muted rounded-md text-center">
                                <div className="text-sm text-muted-foreground">Average Bill Days</div>
                                <div className="text-2xl font-bold">{data.avg_days.toFixed(0)}</div>
                            </div>
                            <div className="p-4 bg-muted rounded-md text-center">
                                <div className="text-sm text-muted-foreground">Average Bill Value</div>
                                <div className="text-2xl font-bold">₹{data.avg_value.toFixed(0)}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <Select value={graphType} onValueChange={(val: 'days' | 'values') => setGraphType(val)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select Graph" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="days">Bill Days</SelectItem>
                                        <SelectItem value="values">Bill Values</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={(graphType === 'days' ? data.days : data.values).map((val, index) => ({
                                            name: index + 1,
                                            value: val
                                        }))}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#3b82f6" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center p-8 text-muted-foreground">No data available</div>
                )}
            </DialogContent>
        </Dialog>
    );
};
