import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { BillingControls, OrdersList, BillingStatsDialog, OrderEditDialog, PartyDetailsDialog, CreditLockDialog } from "./components";
import { useOrdersTable, useBillingActions } from "./hooks";
import { Order, ProcessStats } from "./types";

export const BillingList = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [hash, setHash] = useState<string>("");
    const [step, setStep] = useState<'input' | 'review'>('input');
    const [category, setCategory] = useState<'normal' | 'partial' | 'less_than_config'>('normal');

    // Stats Dialog State
    const [statsOpen, setStatsOpen] = useState(false);
    const [currentStats, setCurrentStats] = useState<ProcessStats | undefined>(undefined);
    const [lastBillsCount, setLastBillsCount] = useState<number | undefined>(undefined);
    const [lastBills, setLastBills] = useState<string | undefined>(undefined);
    const [lastTime, setLastTime] = useState<string | undefined>(undefined);

    // Edit Dialog State
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingOrderNo, setEditingOrderNo] = useState<string | null>(null);

    // Party Dialog State
    const [partyDialogOpen, setPartyDialogOpen] = useState(false);
    const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
    const [creditLockDialogOpen, setCreditLockDialogOpen] = useState(false);

    const form = useForm({
        defaultValues: {
            lines: 100,
            date: new Date().toISOString().split('T')[0],
        },
    });

    const filteredOrders = useMemo(() => {
        return orders.filter(order => (order.order_category || 'normal') === category);
    }, [orders, category]);

    const { table, selectedOrders, setSelectedOrders, deleteOrders, setDeleteOrders, WarningDialog } = useOrdersTable(filteredOrders, (orderNo) => {
        setEditingOrderNo(orderNo);
        setEditDialogOpen(true);
    }, (partyId) => {
        setSelectedPartyId(partyId);
        setPartyDialogOpen(true);
    });

    const selectedCount = useMemo(() => {
        return filteredOrders.filter(order => selectedOrders[order.order_no]).length;
    }, [filteredOrders, selectedOrders]);

    const { getOrders, placeOrder } = useBillingActions();

    const handleGetOrders = async () => {
        const values = form.getValues();
        const result = await getOrders(values.date, values.lines);

        if (result) {
            if (result.process) {
                setCurrentStats(result.process);
                setLastTime(result.last_time);
                setLastBillsCount(undefined);
                setLastBills(undefined);
                // If there is an error or if any process failed (value -1), open dialog
                const hasFailure = Object.values(result.process).some(val => val === -1);
                if (result.error || hasFailure) {
                    setStatsOpen(true);
                }
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
                setCurrentStats(result.process);
                setLastBillsCount(result.last_bills_count);
                setLastBills(result.last_bills);
                setLastTime(result.last_time);
                setStatsOpen(true);
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
        setCurrentStats(undefined);
        setLastBillsCount(undefined);
        setLastBills(undefined);
        setLastTime(undefined);
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
            {step === 'review' && (
                <OrdersList
                    table={table}
                    category={category}
                    setCategory={setCategory}
                    selectedCount={selectedCount}
                />
            )}
            <BillingStatsDialog
                open={statsOpen}
                onOpenChange={setStatsOpen}
                stats={currentStats}
                lastBillsCount={lastBillsCount}
                lastBills={lastBills}
                lastTime={lastTime}
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
            />

            <CreditLockDialog
                open={creditLockDialogOpen}
                onOpenChange={setCreditLockDialogOpen}
                onPartySelect={(partyId) => {
                    setSelectedPartyId(partyId);
                    setPartyDialogOpen(true);
                }}
            />
        </div>
    );
};
