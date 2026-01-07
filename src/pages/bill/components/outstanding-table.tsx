import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useList } from "@refinedev/core";
import { Loader2 } from "lucide-react";

export const OutstandingTable = ({
    beat,
    party,
    companyId,
}: {
    beat: string;
    party: string;
    companyId?: string | number;
}) => {
    const { query: queryResult } = useList({
        resource: "outstanding",
        filters: [
            { field: "beat", operator: "eq", value: beat },
            { field: "party", operator: "eq", value: party },
            { field: "company", operator: "eq", value: companyId },
        ],
        pagination: { mode: "off" },
        queryOptions: {
            enabled: !!party,
        },
    });

    const { data, isLoading } = queryResult;
    const outstandingBills = data?.data || [];

    if (isLoading) {
        return (
            <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (!party) return null;

    return (
        <div className="border rounded-md mt-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Bill No</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead className="text-right">Days</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {outstandingBills.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">
                                No outstanding bills found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        outstandingBills.map((item: any) => (
                            <TableRow key={item.bill}>
                                <TableCell>{item.bill}</TableCell>
                                <TableCell>{item.party}</TableCell>
                                <TableCell className="text-right">₹{item.balance}</TableCell>
                                <TableCell className="text-right">{item.days}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
};
