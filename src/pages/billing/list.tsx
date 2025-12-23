import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { BillingControls, OrdersList, BillingStatsDialog, OrderEditDialog, PartyDetailsDialog, CreditLockDialog } from "./components";
import { useOrdersTable, useBillingActions } from "./hooks";
import { Order, BillingStats, ProcessStats } from "./types";
import { useCustom } from "@refinedev/core";
import { useCompany } from "@/providers/company-provider";

export const BillingList = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [hash, setHash] = useState<string>("");
    const [step, setStep] = useState<'input' | 'review'>('input');
    const [category, setCategory] = useState<'normal' | 'partial' | 'less_than_config'>('normal');

    // Stats Dialog State
    const [statsOpen, setStatsOpen] = useState(false);
    const [processStats, setProcessStats] = useState<ProcessStats | undefined>(undefined);
    const { company } = useCompany();

    const { result: { data: statsData }, query: { refetch: statsRefetch } } = useCustom<BillingStats>({
        url: '/get_billing_stats',
        method: 'get',
        config: {
            query: { company: company?.id },
        },
        queryOptions: {
            enabled: !!company?.id,
            refetchInterval: 120 * 1000,
        }
    });

    const stats = statsData || {};

    // Edit Dialog State
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingOrderNo, setEditingOrderNo] = useState<string | null>(null);

    // Party Dialog State
    const [partyDialogOpen, setPartyDialogOpen] = useState(false);
    const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
    const [selectedPartyBeat, setSelectedPartyBeat] = useState<string>("");
    const [creditLockDialogOpen, setCreditLockDialogOpen] = useState(false);

    const form = useForm({
        defaultValues: {
            lines: 100,
            date: new Date().toISOString().split('T')[0],
            beat_type: 'retail',
        },
    });

    const filteredOrders = useMemo(() => {
        return orders.filter(order => (order.order_category || 'normal') === category);
    }, [orders, category]);

    const { table, selectedOrders, setSelectedOrders, deleteOrders, setDeleteOrders, WarningDialog } = useOrdersTable(filteredOrders, (orderNo) => {
        setEditingOrderNo(orderNo);
        setEditDialogOpen(true);
    }, (partyId, beat) => {
        setSelectedPartyId(partyId);
        setSelectedPartyBeat(beat);
        setPartyDialogOpen(true);
    });

    const selectedCount = useMemo(() => {
        return filteredOrders.filter(order => selectedOrders[order.order_no]).length;
    }, [filteredOrders, selectedOrders]);

    const { getOrders, placeOrder } = useBillingActions();

    const handleGetOrders = async () => {
        const values = form.getValues();
        const result = await getOrders(values.date, values.lines, values.beat_type);
        if (result) {
            if (result.process) {
                setProcessStats(result.process);
            }

            if (result.orders) {
                setOrders(result.orders);
                setHash(result.hash || "");
                setStep('review');
                setSelectedOrders(Object.fromEntries(result.orders.map(order => [order.order_no, order.allow_order])));
                setDeleteOrders({});
            }
        }
    };

    const handlePlaceOrder = async () => {
        const values = form.getValues();
        const selectedOrderNos = Object.keys(selectedOrders).filter(key => selectedOrders[key]);
        const deleteOrderNos = Object.keys(deleteOrders).filter(key => deleteOrders[key]);

        const result = await placeOrder(values.date, hash, selectedOrderNos, deleteOrderNos);

        if (result) {
            if (result.process) {
                setProcessStats(result.process);
                statsRefetch();
            }

            if (result.message) {
                // Success case
                setOrders([]);
                setHash("");
                setStep('input');
                setSelectedOrders({});
            }
        }
    };

    const handleReset = () => {
        setOrders([]);
        setHash("");
        setStep('input');
        setSelectedOrders({});
        setProcessStats(undefined);
    }

    const handleOrderUpdate = (orderNo: string, newAllocatedValue: number) => {
        setOrders(prev => prev.map(order =>
            order.order_no === orderNo
                ? { ...order, allocated_value: newAllocatedValue }
                : order
        ));
    };

    return (
        <div className="space-y-8">
            <BillingControls
                form={form}
                onGetOrders={handleGetOrders}
                onPlaceOrder={handlePlaceOrder}
                onCancel={handleReset}
                onShowStats={() => setStatsOpen(true)}
                onCreditLock={() => setCreditLockDialogOpen(true)}
                step={step}
            />
            {(
                <OrdersList
                    table={table}
                    category={category}
                    setCategory={setCategory}
                    selectedCount={selectedCount}
                    stats={stats}
                    step={step}
                />
            )}
            <BillingStatsDialog
                open={statsOpen}
                onOpenChange={setStatsOpen}
                stats={processStats}
            />
            <OrderEditDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                orderNo={editingOrderNo}
                onOrderUpdate={handleOrderUpdate}
            />
            <WarningDialog />
            <PartyDetailsDialog
                open={partyDialogOpen}
                onOpenChange={setPartyDialogOpen}
                partyId={selectedPartyId}
                beat={selectedPartyBeat}
            />

            <CreditLockDialog
                open={creditLockDialogOpen}
                onOpenChange={setCreditLockDialogOpen}
                onPartySelect={(partyId) => {
                    setSelectedPartyId(partyId);
                    setSelectedPartyBeat("");
                    setPartyDialogOpen(true);
                }}
            />
        </div>
    );
};
