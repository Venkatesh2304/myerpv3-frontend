import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { BillingControls, BillingDashboard, OrdersList } from "./components";
import { useBillingStats, useBillingStatus, useOrdersTable, useBillingProcess } from "./hooks";

export const BillingList = () => {
    const [billingId, setBillingId] = useState<number | null>(null);

    const form = useForm({
        defaultValues: {
            lines: 100,
            interval: 10,
            date: new Date().toISOString().split('T')[0],
        },
    });

    const { statusData, updateBillingStatus } = useBillingStatus(billingId);
    const { stats } = useBillingStats(billingId);
    const { table, orderType, setOrderType, deleteOrders, forceOrders } = useOrdersTable(billingId);

    const { handleStart } = useBillingProcess(
        form,
        deleteOrders,
        forceOrders,
        updateBillingStatus,
        billingId,
        setBillingId
    );

    return (
        <div className="space-y-8">
            <BillingControls form={form} onStart={handleStart} />
            <BillingDashboard stats={stats} statusData={statusData} />
            <OrdersList
                table={table}
                orderType={orderType}
                setOrderType={setOrderType}
                counts={stats?.bill_counts}
            />
        </div>
    );
};
