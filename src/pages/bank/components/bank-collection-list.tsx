import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { LoadingButton } from "@/components/ui/loading-button";
import { useDataProvider, useNotification, useInvalidate } from "@refinedev/core";
import { Check, X } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface BankCollectionItem {
    bill: string;
    amt: number;
    pushed: boolean;
}

export const BankCollectionList = ({
    bankId,
}: {
    bankId: string | number | undefined;
}) => {
    const dataProvider = useDataProvider();
    const { open } = useNotification();
    const invalidate = useInvalidate();
    const [collections, setCollections] = useState<BankCollectionItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCollections = useCallback(() => {
        if (bankId) {
            setIsLoading(true);
            dataProvider()
                .custom({
                    url: `/bank_collection/`,
                    method: "post",
                    payload: {
                        bank_id: bankId,
                    },
                })
                .then((response) => {
                    setCollections((response.data as any) || []);
                })
                .catch((error) => {
                    console.error("Error fetching bank collections:", error);
                    setCollections([]);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            setCollections([]);
        }
    }, [bankId, dataProvider]);

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    const handleUnpush = async () => {
        if (!bankId) return;
        if (window.confirm("Are you sure you want to unpush all bills for this bank statement?")) {
            return dataProvider()
                .custom({
                    url: `/unpush_collection/`,
                    method: "post",
                    payload: {
                        bankstatement_id: bankId,
                    },
                })
                .then(() => {
                    open?.({
                        type: "success",
                        message: "Successfully unpushed bills",
                    });
                    invalidate({ invalidates: ["all"] });
                })
                .catch((error) => {
                    const errorMessage = error?.response?.data?.error || "Failed to unpush bills";
                    open?.({
                        type: "error",
                        message: errorMessage,
                    });
                });
        }
    };

    if (!isLoading && collections.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Bank Collections</CardTitle>
                <LoadingButton
                    variant="destructive"
                    size="sm"
                    onClick={async (e) => { e.preventDefault(); return handleUnpush(); }}
                    disabled={isLoading}
                >
                    Unpush Bills
                </LoadingButton>
            </CardHeader>
            <CardContent className="space-y-2 w-2/5 mx-auto">
                {isLoading ? (
                    <div className="text-center text-muted-foreground">
                        Loading collections...
                    </div>
                ) : (
                    collections.map((item, index) => (
                        <div
                            key={index}
                            className="grid grid-cols-3 gap-4 items-center p-3 border rounded-md"
                        >
                            <div className="flex items-center gap-2">
                                {item.pushed ? (
                                    <Check className="h-5 w-5 text-green-600" />
                                ) : (
                                    <X className="h-5 w-5 text-red-600" />
                                )}
                                <span className="text-sm font-medium">
                                    {item.pushed ? "Pushed" : "Not Pushed"}
                                </span>
                            </div>
                            <div className="font-mono text-sm">{item.bill}</div>
                            <div className="text-right font-semibold">
                                ₹{item.amt.toLocaleString("en-IN")}
                            </div>
                        </div>
                    ))
                )}
            </CardContent>
        </Card>
    );
};
