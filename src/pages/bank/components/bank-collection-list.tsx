import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useDataProvider } from "@refinedev/core";
import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

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
    const [collections, setCollections] = useState<BankCollectionItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
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

    if (!isLoading && collections.length === 0) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bank Collections</CardTitle>
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
