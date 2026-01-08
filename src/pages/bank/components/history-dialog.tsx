import { useTable } from "@refinedev/react-table";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { BankEvent } from "../types";
import { History } from "lucide-react";

interface HistoryDialogProps {
    events: BankEvent[];
}

export const HistoryDialog = ({ events }: HistoryDialogProps) => {
    const columns = useMemo<ColumnDef<BankEvent>[]>(
        () => [
            {
                accessorKey: "time",
                header: "Time",
                size: 100,
            },
            {
                accessorKey: "by",
                header: "By",
                size: 70,
            },
            {
                accessorKey: "type",
                header: "Type",
                size: 150,
            },
            {
                accessorKey: "message",
                header: "Message",
                cell: ({ getValue }) => (
                    <div style={{ whiteSpace: "pre-wrap" }} className="py-2">
                        {getValue<string>()}
                    </div>
                ),
                size: 400,
            },
        ],
        []
    );
    const table = useTable<BankEvent>({
        columns,
        data: events,
        refineCoreProps: {
            resource: "bank_events", // Dummy resource since we provide data manually
            queryOptions: {
                enabled: false,
            },
            pagination: {
                mode: "off"
            }
        },
        enableRowSelection: false
    });

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    History
                </Button>
            </DialogTrigger>
            <DialogContent className="min-w-6xl flex flex-col">
                <DialogHeader>
                    <DialogTitle>Event History</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-auto py-4 max-h-[60vh] overflow-y-scroll">
                    <DataTable table={table} />
                </div>
            </DialogContent>
        </Dialog>
    );
};
