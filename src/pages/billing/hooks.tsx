import { useState, useMemo } from "react";
import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import { useNotification } from "@refinedev/core";
import { dataProvider } from "@/lib/dataprovider";
import { Order, BillingResponse } from "./types";
import { Checkbox } from "@/components/ui/checkbox";
import { useCompany } from "@/providers/company-provider";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Trash2 } from "lucide-react";
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

export const useOrdersTable = (data: Order[], onEdit: (orderNo: string) => void, onPartyClick: (partyId: string, beat: string) => void) => {
    const [selectedOrders, setSelectedOrders] = useState<Record<string, boolean>>({});
    const [deleteOrders, setDeleteOrders] = useState<Record<string, boolean>>({});

    // Warning Dialog State
    const [warningDialogOpen, setWarningDialogOpen] = useState(false);
    const [warningMessage, setWarningMessage] = useState("");
    const [pendingOrderNo, setPendingOrderNo] = useState<string | null>(null);

    const handleSelectionChange = (orderNo: string, currentChecked: boolean, warning?: string) => {
        if (!currentChecked && warning) {
            setWarningMessage(warning);
            setPendingOrderNo(orderNo);
            setWarningDialogOpen(true);
        } else {
            setSelectedOrders((prev) => ({
                ...prev,
                [orderNo]: !prev[orderNo],
            }));
        }
    };

    const confirmSelection = () => {
        if (pendingOrderNo) {
            setSelectedOrders((prev) => ({
                ...prev,
                [pendingOrderNo]: true,
            }));
            setPendingOrderNo(null);
            setWarningDialogOpen(false);
        }
    };

    const columns = useMemo(() => {
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
                            checked={selectedOrders[row.original.order_no] || false}
                            onCheckedChange={() => {
                                handleSelectionChange(
                                    row.original.order_no,
                                    selectedOrders[row.original.order_no] || false,
                                    row.original.warning
                                );
                            }}
                        />
                    );
                },
            }),
            columnHelper.accessor("party", {
                header: "Party", size: 250,
                cell: ({ row }) => (
                    <div
                        className="cursor-pointer"
                        onClick={() => onPartyClick(String(row.original.party_id), row.original.beat)}
                    >
                        {row.original.party}
                    </div>
                ),
            }),
            columnHelper.accessor("lines", { header: "Lines", size: 50 }),
            columnHelper.accessor("bill_value", {
                header: "Value", size: 100,
                cell: ({ row }) => (
                    <div
                        className="cursor-pointer"
                        onClick={() => onEdit(row.original.order_no)}
                    >
                        ₹{row.original.bill_value.toFixed(0)}
                    </div>
                ),
            }),
            columnHelper.accessor("allocated_value", {
                header: "Allocated", size: 100,
                cell: ({ row }) => (
                    <div
                        className="cursor-pointer"
                        onClick={() => onEdit(row.original.order_no)}
                    >
                        ₹{row.original.allocated_value.toFixed(0)}
                    </div>
                ),
            }),
            columnHelper.accessor("OS", { header: "OS", size: 200 }),
            columnHelper.accessor("coll", { header: "Coll", size: 100 }),
            columnHelper.accessor("salesman", { header: "Salesman", size: 150 }),
            columnHelper.accessor("beat", { header: "Beat", size: 150 }),
            columnHelper.accessor("type", { header: "Type", size: 50 }),
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
            columnHelper.accessor("phone", { header: "Phone", size: 120 }),

        ];
    }, [selectedOrders, onEdit, onPartyClick]);

    const table = useTable<Order>({
        columns,
        data,
        refineCoreProps: {
            resource: "order", // Dummy resource
            queryOptions: {
                enabled: false, // Disable automatic fetching
            },
            pagination: {
                mode: "off",
            }
        },
        enableRowSelection: false, // We handle selection manually
    });

    const WarningDialog = () => (
        <AlertDialog open={warningDialogOpen} onOpenChange={setWarningDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Warning</AlertDialogTitle>
                    <AlertDialogDescription style={{ whiteSpace: 'pre-wrap' }}>
                        {warningMessage}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setPendingOrderNo(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmSelection}>Confirm</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog >
    );

    return { table, selectedOrders, setSelectedOrders, deleteOrders, setDeleteOrders, WarningDialog };
};

export const useBillingActions = () => {
    const { open } = useNotification();
    const { company } = useCompany();

    const getOrders = async (date: string, lines: number): Promise<BillingResponse | null> => {
        if (!company?.id) {
            open?.({
                type: "error",
                message: "Company not selected",
            });
            return null;
        }

        try {
            const response = await dataProvider.custom?.({
                url: "/get_order/",
                method: "post",
                payload: {
                    order_date: date,
                    lines: lines,
                    company: company.id,
                },
            });
            return response?.data as BillingResponse;
        } catch (error: any) {
            // Return the response even on error if it contains stats
            open?.({
                type: "error",
                message: "Error fetching orders",
                description: error.response?.data?.error,
            });
            if (error.response?.data) {
                return error.response.data as BillingResponse;
            }
            return null;
        }
    };

    const placeOrder = async (date: string, hash: string, selectedOrders: string[], deleteOrders: string[]): Promise<BillingResponse | null> => {
        if (!company?.id) {
            open?.({
                type: "error",
                message: "Company not selected",
            });
            return null;
        }

        try {
            const response = await dataProvider.custom?.({
                url: "/post_order/",
                method: "post",
                payload: {
                    order_date: date,
                    company: company.id,
                    hash: hash,
                    order_numbers: selectedOrders,
                    delete_orders: deleteOrders,
                },
            });

            open?.({
                type: "success",
                message: "Order placed successfully",
                description: response.data.message,
            });

            return response?.data as BillingResponse;

        } catch (error: any) {
            open?.({
                type: "error",
                message: "Error placing order",
                description: `Status: ${error.response?.status} - ${error.response?.data?.error}`,
            });
            // Return the response even on error if it contains stats
            if (error.response?.data) {
                return error.response.data as BillingResponse;
            }
            return null;
        }
    };

    return { getOrders, placeOrder };
};
