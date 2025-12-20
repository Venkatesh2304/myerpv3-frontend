import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
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
                </div>
            </Form>
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
    partyId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const PartyDetailsDialog: React.FC<PartyDetailsDialogProps> = ({ partyId, open, onOpenChange }) => {
    const { company } = useCompany();
    const { open: notify } = useNotification();
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<PartyCredibilityResponse | null>(null);
    const [creditData, setCreditData] = React.useState<PartyCreditResponse | null>(null);
    const [graphType, setGraphType] = React.useState<'days' | 'values'>('days');
    const [savingCredit, setSavingCredit] = React.useState(false);

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
                    <DialogTitle>Party Details: {partyId}</DialogTitle>
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
