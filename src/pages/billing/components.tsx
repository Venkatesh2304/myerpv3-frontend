import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { DatePicker } from "@/components/custom/date-picker";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import {
    DialogTitle,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ProcessStats, OrderProduct, BillingStats, StopBillingResponse } from "./types";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { useCompany } from "@/providers/company-provider";
import { useNotification, useCustom } from "@refinedev/core";
import { dataProvider } from "@/lib/dataprovider";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Legend, Cell } from 'recharts';
import { PartyCredibilityResponse, PartyCreditResponse } from "./types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { ResourceCombobox } from "@/components/custom/resource-combobox";

interface BillingControlsProps {
    form: UseFormReturn<any>;
    onGetOrders: () => void;
    onPlaceOrder: () => void;
    onCancel: () => void;
    onShowStats: () => void;
    onCreditLock: () => void;
    step: 'input' | 'review';
}

export const BillingControls: React.FC<BillingControlsProps> = ({ form, onGetOrders, onPlaceOrder, onCancel, onShowStats, onCreditLock, step }) => {
    const { company } = useCompany();
    const { open: notify } = useNotification();
    const [stopBillingDialogOpen, setStopBillingDialogOpen] = React.useState(false);

    const { result: { data: stopBillingData }, query: { refetch: refetchStopBilling } } = useCustom<StopBillingResponse>({
        url: '/stop_billing',
        method: 'get',
        config: {
            query: { company: company?.id },
        },
        queryOptions: {
            enabled: !!company?.id,
        }
    });

    const isStopped = stopBillingData?.stop || false;

    const handleConfirmStopBilling = async () => {
        if (!company?.id) return;
        try {
            await dataProvider.custom?.({
                url: '/stop_billing/',
                method: 'post',
                payload: {
                    company: company.id,
                    stop: !isStopped,
                },
            });
            refetchStopBilling();
            setStopBillingDialogOpen(false);
            notify?.({
                type: "success",
                message: `Billing ${!isStopped ? "stopped" : "resumed"} successfully`,
            });
        } catch (error: any) {
            notify?.({
                type: "error",
                message: "Error updating billing status",
                description: error.message,
            });
        }
    };

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
                    <FormField
                        control={form.control}
                        name="beat_type"
                        render={({ field }) => (
                            <FormItem className="grid w-full max-w-sm items-center gap-1.5">
                                <FormLabel className="text-xs">Beat Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue placeholder="Select beat type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="retail">Retail</SelectItem>
                                        <SelectItem value="wholesale">Wholesale</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                    {step === 'input' ? (
                        <LoadingButton
                            onClick={onGetOrders}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            GET ORDERS
                        </LoadingButton>
                    ) : (
                        <div className="flex gap-4">
                            <LoadingButton
                                onClick={onCancel}
                                variant="outline"
                            >
                                CANCEL
                            </LoadingButton>
                            <LoadingButton
                                onClick={onPlaceOrder}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                PLACE ORDER
                            </LoadingButton>
                        </div>
                    )}
                    <div className="flex-1 flex justify-end gap-2">
                        <Button variant="secondary" onClick={onShowStats}>
                            Show Stats
                        </Button>
                        <Button
                            variant="outline"
                            onClick={onCreditLock}
                            className="border-orange-500 text-orange-500 hover:bg-orange-50"
                        >
                            Credit Lock
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant={isStopped ? "default" : "destructive"}
                            onClick={() => setStopBillingDialogOpen(true)}
                            className={cn(
                                "w-32",
                                isStopped ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                            )}
                        >
                            {isStopped ? "RESUME" : "STOP"}
                        </Button>
                    </div>
                </div>
            </Form>
            <StopBillingDialog
                open={stopBillingDialogOpen}
                onOpenChange={setStopBillingDialogOpen}
                onConfirm={handleConfirmStopBilling}
                isStopped={isStopped}
            />
        </div>
    );
};

interface CreditLockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPartySelect: (partyId: string) => void;
}

export const CreditLockDialog: React.FC<CreditLockDialogProps> = ({ open, onOpenChange, onPartySelect }) => {
    const [selectedParty, setSelectedParty] = React.useState<any>(null);

    const handleSelect = (value: any) => {
        if (value) {
            onPartySelect(value);
            onOpenChange(false);
            setSelectedParty(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Select Party for Credit Lock</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <Label className="mb-2 block">Party</Label>
                    <ResourceCombobox
                        resource="party"
                        value={selectedParty}
                        onValueChange={(val) => handleSelect(val)}
                        placeholder="Select party..."
                        minSearchLength={3}
                        labelKey="label"
                        valueKey="value"
                        filters={
                            [{ field: 'company', operator: 'eq', value: 'devaki_hul' }]
                        }
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
};

interface OrdersListProps {
    table: any;
    category: 'normal' | 'partial' | 'less_than_config';
    setCategory: (category: 'normal' | 'partial' | 'less_than_config') => void;
    selectedCount: number;
    stats: BillingStats;
    step: 'input' | 'review';
}

export const OrdersList: React.FC<OrdersListProps> = ({ table, category, setCategory, selectedCount, stats, step }) => {
    return (
        <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
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
                    {!!stats.unprinted_bills_count && (
                        <Link to="/print">
                            <div className={cn(
                                "cursor-pointer font-medium px-3 py-1 rounded-md border",
                                (stats.unprinted_bills_count || 0) > 10
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : "bg-secondary text-secondary-foreground border-secondary"
                            )}>
                                To Print: {stats.unprinted_bills_count}
                            </div>
                        </Link>
                    )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {stats.last_time && <div>Last Time: <span className="font-medium text-foreground">{stats.last_time}</span></div>}
                    {stats.today_bills_count !== undefined && <div>Today Bills: <span className="font-medium text-foreground">{stats.today_bills_count}</span></div>}
                    {stats.last_bills_count !== undefined && <div>Last Bills: <span className="font-medium text-foreground">{stats.last_bills_count}</span></div>}
                    {stats.user && <div>User: <span className="font-medium text-foreground">{stats.user}</span></div>}
                </div>
            </div>
            {step === 'review' && (
                <div className="border rounded-md">
                    <DataTable table={table} />
                </div>
            )}
        </div >
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
    const [percentage, setPercentage] = React.useState("100");

    React.useEffect(() => {
        if (open && orderNo && company?.id) {
            fetchOrderDetails();
            setPercentage("100");
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

    const handlePercentageChange = (val: string) => {
        setPercentage(val);
        const percent = parseInt(val);
        if (isNaN(percent)) return;

        // Reset to allocated first to have a clean slate for calculation
        // We need to use the current products state but reset qp to aq
        // Actually, we should probably base this off the original fetched data if we wanted to be purely functional,
        // but 'products' state is our source of truth for 'aq' and 't' and 'n'.
        // So we create a working copy where qp = aq.

        let newProducts = products.map(p => ({ ...p, qp: p.aq }));

        if (percent === 100) {
            setProducts(newProducts);
            return;
        }

        const totalAllocatedValue = newProducts.reduce((sum, p) => sum + (p.aq * p.t), 0);
        const targetValue = totalAllocatedValue * (percent / 100);

        // Sort indices by rate (t) descending
        const sortedIndices = newProducts
            .map((p, index) => ({ index, t: p.t, n: p.n || 0 }))
            .sort((a, b) => b.t - a.t);

        let currentValue = totalAllocatedValue;

        for (const { index, t, n } of sortedIndices) {
            if (currentValue <= targetValue) break;

            const product = newProducts[index];
            const currentQty = product.qp;
            const maxReducibleQty = currentQty - n;

            if (maxReducibleQty <= 0) continue;

            const maxReducibleValue = maxReducibleQty * t;
            const neededReduction = currentValue - targetValue;

            if (maxReducibleValue <= neededReduction) {
                // Reduce fully to norm
                newProducts[index].qp = n;
                currentValue -= maxReducibleValue;
            } else {
                // Reduce partially to meet target
                // We need to reduce value by at least 'neededReduction'
                // reductionValue = reductionQty * t >= neededReduction
                // reductionQty >= neededReduction / t
                const reductionQty = Math.ceil(neededReduction / t);
                newProducts[index].qp = currentQty - reductionQty;
                currentValue -= reductionQty * t;
                break; // Target reached
            }
        }
        setProducts(newProducts);
    };

    const totalValue = React.useMemo(() => {
        return products.reduce((sum, product) => {
            return sum + (product.t * (product.qp || 0));
        }, 0);
    }, [products]);

    const currentPercentage = React.useMemo(() => {
        const totalAllocated = products.reduce((sum, p) => sum + (p.aq * p.t), 0);
        if (totalAllocated === 0) return "0.00";
        const currentTotal = products.reduce((sum, p) => sum + ((p.qp || 0) * p.t), 0);
        return ((currentTotal / totalAllocated) * 100).toFixed(2);
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
                        <div className="flex justify-end items-center gap-2">
                            <Label>Reduce Value to:</Label>
                            <Select value={percentage} onValueChange={handlePercentageChange}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="100">100%</SelectItem>
                                    <SelectItem value="75">75%</SelectItem>
                                    <SelectItem value="50">50%</SelectItem>
                                    <SelectItem value="25">25%</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">Product</TableHead>
                                        <TableHead className="w-[50px]">Rate</TableHead>
                                        <TableHead className="w-[50px]">Norm</TableHead>
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
                                            <TableCell>{product.n || 0}</TableCell>
                                            <TableCell>{product.cq}</TableCell>
                                            <TableCell className={product?.qp < product.aq ? "text-red-500" : ""}>{product.aq}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={product.qp || ""}
                                                    onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                                    className={"w-20 h-8"}
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
                                <span className="text-lg font-semibold">Total Value: ₹{totalValue.toFixed(0)} ({currentPercentage}%)</span>
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
}

export const BillingStatsDialog: React.FC<BillingStatsDialogProps> = ({ open, onOpenChange, stats }) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Last Billing</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
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
    partyId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    beat?: string;
}

export const PartyDetailsDialog: React.FC<PartyDetailsDialogProps> = ({ partyId, open, onOpenChange, beat }) => {
    const { company } = useCompany();
    const { open: notify } = useNotification();
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<PartyCredibilityResponse | null>(null);
    const [creditData, setCreditData] = React.useState<PartyCreditResponse | null>(null);
    const [savingCredit, setSavingCredit] = React.useState(false);
    const [limit, setLimit] = React.useState(50);
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'settled'>('settled');
    const [minBillValue, setMinBillValue] = React.useState(0);

    const filteredBills = React.useMemo(() => {
        if (!data?.bills) return [];
        let bills = data.bills;

        if (statusFilter === 'pending') {
            bills = bills.filter(b => !b.collected);
        } else if (statusFilter === 'settled') {
            bills = bills.filter(b => b.collected);
        }

        if (minBillValue > 0) {
            bills = bills.filter(b => b.amt > minBillValue);
        }

        return bills.slice(-limit);
    }, [data, statusFilter, minBillValue, limit]);

    React.useEffect(() => {
        if (open && partyId && company?.id) {
            fetchPartyDetails();
            fetchCreditDetails();
        }
    }, [open, partyId, company?.id]);

    const fetchCreditDetails = async () => {
        try {
            const response = await dataProvider.custom?.({
                url: `/party_credit/`,
                method: "get",
                query: {
                    company: company?.id,
                    party_id: partyId,
                    beat: beat,
                },
            });
            if (response?.data) {
                setCreditData(response.data);
            }
        } catch (error) {
            console.error("Error fetching credit details", error);
        }
    };

    const handleSaveCredit = async () => {
        if (!creditData || !company?.id || !partyId) return;
        setSavingCredit(true);
        try {
            await dataProvider.custom?.({
                url: `/party_credit/`,
                method: "post",
                payload: {
                    company: company.id,
                    party_id: partyId,
                    ...creditData,
                },
            });
            notify?.({
                type: "success",
                message: "Credit options updated successfully",
            });
        } catch (error: any) {
            notify?.({
                type: "error",
                message: "Error updating credit options",
                description: error.message,
            });
        } finally {
            setSavingCredit(false);
        }
    };

    const fetchPartyDetails = async () => {
        setLoading(true);
        try {
            const response = await dataProvider.custom?.({
                url: `/party_credibility/`,
                method: "get",
                query: {
                    company: company?.id,
                    party_id: partyId,
                    beat: beat,
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
                    <DialogTitle>Party Details: {partyId} {beat && `- ${beat}`}</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center p-8">Loading...</div>
                ) : data ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-muted rounded-md text-center">
                                <div className="text-sm text-muted-foreground">Average Bill Days</div>
                                <div className="text-2xl font-bold">{data.avg_days.toFixed(0)}</div>
                            </div>
                            <div className="p-4 bg-muted rounded-md text-center">
                                <div className="text-sm text-muted-foreground">Average Bill Value</div>
                                <div className="text-2xl font-bold">₹{data.avg_value.toFixed(0)}</div>
                            </div>
                            <div className="p-4 bg-muted rounded-md text-center">
                                <div className="text-sm text-muted-foreground">Average Month Turnover</div>
                                <div className="text-2xl font-bold">₹{data.avg_monthly.toFixed(0)}</div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-end items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Label>Status</Label>
                                    <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="settled">Settled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label>Min Value</Label>
                                    <Input
                                        type="number"
                                        value={minBillValue || ""}
                                        onChange={(e) => setMinBillValue(Number(e.target.value))}
                                        className="w-24"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label>Limit</Label>
                                    <Input
                                        type="number"
                                        value={limit || ""}
                                        onChange={(e) => setLimit(Number(e.target.value))}
                                        className="w-20"
                                    />
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart
                                        data={filteredBills}
                                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" domain={[0, 'auto']} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" domain={[0, 'auto']} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="amt" name="Amount">
                                            {filteredBills.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.collected ? "#22c55e" : "#ef4444"} />
                                            ))}
                                        </Bar>
                                        <Line yAxisId="right" type="monotone" dataKey="days" stroke="#82ca9d" name="Days" connectNulls={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Credit Options */}
                        {creditData && (
                            <div className="border rounded-md p-4 space-y-4">
                                <h3 className="font-semibold">Credit Options</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label>Bills</Label>
                                        <Input
                                            type="number"
                                            value={creditData.bills || ""}
                                            onChange={(e) => setCreditData({ ...creditData, bills: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Days</Label>
                                        <Input
                                            type="number"
                                            value={creditData.days || ""}
                                            onChange={(e) => setCreditData({ ...creditData, days: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Value</Label>
                                        <Input
                                            type="number"
                                            value={creditData.value || ""}
                                            onChange={(e) => setCreditData({ ...creditData, value: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <LoadingButton
                                        onClick={handleSaveCredit}
                                        loading={savingCredit}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        Save Credit Options
                                    </LoadingButton>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center p-8 text-muted-foreground">No data available</div>
                )}
            </DialogContent>
        </Dialog>
    );
};

interface StopBillingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isStopped: boolean;
}

export const StopBillingDialog: React.FC<StopBillingDialogProps> = ({ open, onOpenChange, onConfirm, isStopped }) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Action</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to {isStopped ? "resume" : "stop"} billing for this company?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

