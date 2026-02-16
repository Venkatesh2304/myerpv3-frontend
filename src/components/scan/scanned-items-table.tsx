
import React from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Pencil } from "lucide-react";

export interface ScannedItem {
    cbu: string;
    mrp: number;
    qty: number;
}

export interface QtyMap {
    [cbu: string]: {
        [mrp: number]: number;
    };
}

export interface ScannedItemsTableProps {
    items: ScannedItem[];
    purchase: QtyMap;
    otherScanned: QtyMap;
    onEdit: (item: ScannedItem) => void;
    label?: string;
}

export function ScannedItemsTable({ items, purchase, otherScanned, onEdit, label = "CBU" }: ScannedItemsTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>{label}</TableHead>
                    <TableHead>MRP</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item) => (
                    <TableRow key={`${item.cbu}${item.mrp}`}>
                        <TableCell>{item.cbu}</TableCell>
                        <TableCell>{item.mrp}</TableCell>
                        <TableCell>{(purchase[item.cbu]?.[item.mrp] || 0) - (otherScanned[item.cbu]?.[item.mrp] || 0) - item.qty}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEdit(item)}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
