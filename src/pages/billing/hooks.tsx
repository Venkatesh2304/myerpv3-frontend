import React, { useEffect, useState, useRef } from "react";
import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { useOne, useNotification, CrudFilter, CrudFilters } from "@refinedev/core";
import { dataProvider } from "@/lib/dataprovider";
import { BillingStats, BillingStatus, Order } from "./types";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
import { useCompany } from "@/providers/company-provider";

export const useBillingStats = (billingId: number | null) => {
    const { query: statsQuery } = useOne<BillingStats>({
        resource: "billing",
        id: billingId || undefined,

        queryOptions: {
            enabled: !!billingId,
        },
    });

    return { stats: statsQuery?.data?.data?.stats };
}

export const useBillingStatus = (billingId: number | null) => {
    const [statusData, setStatusData] = useState<BillingStatus[]>([]);

    const updateBillingStatus = (id: number) => (
        dataProvider.getList({
            resource: "billing_status",
            pagination: {
                mode: "off"
            },
            filters: [
                {
                    field: "billing",
                    operator: "eq",
                    value: id,
                },
            ],
        }).then((res) => {
            setStatusData(res.data as unknown as BillingStatus[]);
            return res;
        })
    );

    useEffect(() => {
        if (billingId) {
            updateBillingStatus(billingId);
        }
    }, [billingId]);

    return { statusData, updateBillingStatus };
};

export const useOrdersTable = (billingId: number | null) => {
    const [orderType, setOrderType] = useState<"creditlock" | "rejected" | "pending">("creditlock");
    const [deleteOrders, setDeleteOrders] = useState<Record<string, boolean>>({});
    const [forceOrders, setForceOrders] = useState<Record<string, boolean>>({});

    const columns = React.useMemo(() => {
        const columnHelper = createColumnHelper<Order>();
        return [
            columnHelper.display({
                id: "select",
                header: "",
                size: 50,
                cell: ({ row }) => {
                    return (
                        <Checkbox
                            className="border-gray-500"
                            checked={forceOrders[row.original.order_no] || false}
                            onCheckedChange={() => {
                                setForceOrders((prev) => ({
                                    ...prev,
                                    [row.original.order_no]: !prev[row.original.order_no],
                                }));
                            }}
                        />
                    );
                },
            }),
            columnHelper.accessor("party", { header: "Party", size: 250 }),
            columnHelper.accessor("lines", { header: "Lines", size: 50 }),
            columnHelper.accessor("bill_value", {
                header: "Value", size: 100,
                cell: ({ row }) => `₹${row.original.bill_value.toFixed(0)}`,
            }),
            columnHelper.accessor("OS", { header: "OS", size: 200 }),
            columnHelper.accessor("coll", { header: "Coll", size: 100 }),
            columnHelper.accessor("salesman", { header: "Salesman", size: 150 }),
            columnHelper.accessor("beat", { header: "Beat", size: 150 }),
            columnHelper.display({
                id: "delete",
                header: "",
                size: 50,
                cell: ({ row }) => {
                    const isDeleted = deleteOrders[row.original.order_no];
                    return (
                        <button
                            onClick={() => {
                                setDeleteOrders((prev) => ({
                                    ...prev,
                                    [row.original.order_no]: !prev[row.original.order_no],
                                }));
                            }}
                            className={cn(
                                "p-1 rounded-md transition-colors",
                                isDeleted ? "text-red-500 hover:bg-red-100" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            )}
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    );
                },
            }),
            columnHelper.accessor("type", { header: "Type", size: 50 }),
            columnHelper.accessor("phone", { header: "Phone", size: 120 }),
        ];
    }, [deleteOrders, forceOrders]);

    const [filters, setFilters] = useState<CrudFilters>([]);

    useEffect(() => {
        if (billingId) {
            setFilters([
                {
                    field: "billing",
                    operator: "eq",
                    value: billingId,
                },
                ...(orderType === "creditlock"
                    ? [
                        { field: "place_order", operator: "eq" as const, value: true },
                        { field: "creditlock", operator: "eq" as const, value: true },
                    ]
                    : orderType === "rejected"
                        ? [{ field: "place_order", operator: "eq" as const, value: false }]
                        : [
                            { field: "place_order", operator: "eq" as const, value: true },
                            { field: "creditlock", operator: "eq" as const, value: false },
                        ])]);
        }
    }, [billingId, orderType]);

    const table = useTable<Order>({
        columns,
        refineCoreProps: {
            resource: "order",
            filters: {
                permanent: filters,
            },
            queryOptions: {
                enabled: (!!billingId) && filters.length > 0,
            },
            pagination: {
                mode: "client",
                pageSize: 50,
            },
        },
        enableRowSelection: false
    });

    useEffect(() => {
        if (table.refineCore.tableQuery?.data) {
            setDeleteOrders({});
            setForceOrders((forceOrders) => {
                return {
                    // ...forceOrders, //TODO: Disabled for time being
                    // @ts-ignore
                    ...Object.fromEntries(table.refineCore.tableQuery?.data?.data?.map((order: Order) => [order.order_no, order.potential_release || false]) || [])
                }
            });
        }
    }, [table.refineCore.tableQuery.data]);

    return { table, orderType, setOrderType, deleteOrders, forceOrders };
};

export const useBillingProcess = (
    form: UseFormReturn<any>,
    deleteOrders: Record<string, boolean>,
    forceOrders: Record<string, boolean>,
    updateBillingStatus: (id: number) => Promise<any>,
    billingId: number | null,
    setBillingId: (id: number | null) => void
) => {
    const { open } = useNotification();
    const { company } = useCompany();

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const billingStateRef = useRef({
        billingId,
        deleteOrders,
        forceOrders
    });

    // Sync ref with state
    useEffect(() => {
        billingStateRef.current = {
            billingId,
            deleteOrders,
            forceOrders
        };
    }, [billingId, deleteOrders, forceOrders]);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const pollBillingStatus = (id: number) => {
        if (!id) return;
        updateBillingStatus(id).then((res) => {
            const data = res?.data || [];
            const allCompleted = data.every((s: BillingStatus) => s.status === 1);
            const anyFailed = data.some((s: BillingStatus) => s.status === 3);
            if (allCompleted && data.length > 0) {
                setBillingId(id);
                open?.({
                    type: "success",
                    message: "Billing Process Completed",
                });
            }
            else if (anyFailed) {
                setBillingId(id);
                open?.({
                    type: "error",
                    message: "Billing Process Failed",
                });
            }
            else {
                setTimeout(() => pollBillingStatus(id), 5000);
            }
        });
    }

    // Initial Load
    useEffect(() => {
        if (!company?.id) return;

        dataProvider.custom?.({
            url: "/start_billing/",
            method: "get",
            query: {
                company: company.id
            }
        }).then((response) => {
            if (response.data && response.data.billing_id) {
                setBillingId(response.data.billing_id);
            }
        });
    }, [company?.id]);

    const startBillingProcess = () => {
        const values = form.getValues();
        return dataProvider.custom?.({
            url: "/start_billing/",
            method: "post",
            payload: {
                max_lines: values.lines,
                order_date: values.date,
                time_interval: values.interval,
                force_place: billingStateRef.current.forceOrders,
                delete: billingStateRef.current.deleteOrders,
                billing_id: billingStateRef.current.billingId,
                company: company?.id
            },
        }).then((response) => {
            if (response.data.message) {
                const new_billing_id = response.data.billing_id;
                if (new_billing_id) {
                    pollBillingStatus(new_billing_id);
                }
                open?.({
                    type: "success",
                    message: response.data.message,
                });
            } else {
                open?.({
                    type: "error",
                    message: "Failed to start billing",
                    description: response.data.error,
                });
            }
        }).catch((err) => {
            console.log(err);
            open?.({
                type: "error",
                message: "Error starting billing",
                description: err.message,
            });
        });
    };

    const handleStart = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Run immediately
        startBillingProcess();

        const values = form.getValues();
        if (values.interval && values.interval > 0) {
            intervalRef.current = setInterval(() => {
                startBillingProcess();
            }, values.interval * 60 * 1000);
        }
    };

    return { billingId, handleStart };
};
