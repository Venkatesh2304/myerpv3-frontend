
import { useFieldArray, useFormContext } from "react-hook-form";
import { useList, useDataProvider, BaseRecord, HttpError } from "@refinedev/core";
import { useTable, UseTableReturnType } from "@refinedev/react-table";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/custom/combobox";
import { useHotkeys } from "react-hotkeys-hook";
import { Plus, Trash2 } from "lucide-react";
import { useCompany } from "@/providers/company-provider";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "../refine-ui/data-table/data-table";
import { createColumnHelper } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

export interface ValidationResult {
    isValid: boolean;
    message?: string;
}

export const validateCollectionEntries = (
    total: number,
    collections: any,
    threshold: number = 50
): ValidationResult => {

    for (const collection of collections) {
        if ((!!collection.balance) && (collection.amt > collection.balance)) {
            return {
                isValid: false,
                message: `Collection amount (₹${collection.amt.toLocaleString("en-IN")}) cannot exceed balance (₹${collection.balance.toLocaleString("en-IN")})`,
            };
        }
    }

    // Calculate sum of collection amounts
    const collectionSum = collections.reduce(
        (sum: number, collection: any) => sum + (collection.amt || 0),
        0
    );

    // Calculate difference
    const difference = Math.abs(total - collectionSum);
    // Check if difference is within threshold
    if (difference > threshold) {
        return {
            isValid: false,
            message: `Collection amounts (₹${collectionSum.toLocaleString("en-IN")}) do not match cheque amount (₹${total.toLocaleString("en-IN")}). Difference: ₹${difference.toLocaleString("en-IN")}`,
        };
    }

    return {
        isValid: true,
    };
}

const OutstandingDialog = ({ table, setValue, amt }: { table: UseTableReturnType<BaseRecord, HttpError>, setValue: any, amt: number }) => {

    useHotkeys("o", () => setOutstandingOpen(true), {
        enableOnFormTags: false,
    });

    const handleLoadBillsFromOutstanding = () => {
        const selectedRows = table.reactTable.getSelectedRowModel().rows;
        const newCollections = selectedRows.map((row: any) => ({
            bill: row.original.bill,
            party: row.original.party,
            balance: row.original.balance,
            amt: row.original.balance
        }));
        setValue("collection", newCollections, { shouldValidate: true });
        setOutstandingOpen(false);
    }

    const selectedTotal = table.reactTable.getSelectedRowModel().rows.reduce((sum, row) => sum + (Number(row.original.balance) || 0), 0)
    const [outstandingOpen, setOutstandingOpen] = useState(false);
    return (
        <Dialog open={outstandingOpen} onOpenChange={setOutstandingOpen} >
            <DialogContent className="max-w-3xl h-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Party Outstanding</DialogTitle>
                </DialogHeader>
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border mb-2">
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Selected Total</span>
                        <span className="text-xl font-bold text-primary">
                            ₹{selectedTotal.toLocaleString("en-IN")}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Balance</span>
                        <span className={cn("text-xl font-bold text-primary", selectedTotal > amt ? "text-red-500" : "text-green-500")}>
                            ₹{(amt - selectedTotal).toLocaleString("en-IN")}
                        </span>
                    </div>

                    <Button
                        size="lg"
                        className="px-8 font-bold shadow-lg transition-all hover:scale-105 active:scale-95"
                        onClick={handleLoadBillsFromOutstanding}
                        disabled={table.reactTable.getSelectedRowModel().rows.length === 0}
                    >
                        Load {table.reactTable.getSelectedRowModel().rows.length} Bills
                    </Button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <DataTable table={table} />
                </div>
            </DialogContent>
        </Dialog >
    );
};

export const CollectionEntries = ({
    disabled,
}: {
    disabled?: boolean;
}) => {
    const { control, setValue, watch } = useFormContext();
    const { company } = useCompany();
    const dataProvider = useDataProvider();
    const partyId = watch("party_id");
    const amt = watch("amt");
    const { fields, append, remove } = useFieldArray({
        control,
        name: "collection",
    });


    const columns = useMemo(() => [
        { accessorKey: "bill", header: "Bill Number", size: 100 },
        { accessorKey: "balance", header: "Balance", size: 100 },
        { accessorKey: "days", header: "Days", size: 100 },
    ], []);

    const table = useTable({
        columns,
        enableRowSelection: true,
        refineCoreProps: {
            resource: "outstanding",
            filters: {
                permanent: [
                    { field: "party", operator: "eq", value: partyId || "wrong" },
                    { field: "company", operator: "eq", value: company?.id }
                ]
            },
            pagination: {
                mode: "off"
            },
            queryOptions: {
                enabled: !!partyId,
            },
        }
    });
    const { refineCore: { tableQuery: { data: billData, isLoading: isBillsLoading } } } = table;



    const billOptions = useMemo(() => {
        const data = billData?.data || [];
        return data.map((item) => ({
            label: item.bill,
            value: item.bill,
        }));
    }, [billData?.data]);



    const handleBillSelect = async (billNumber: string, index: number) => {
        if (!billNumber) return;

        try {
            const { data } = await dataProvider().getList({
                resource: "outstanding",
                filters: [
                    { field: "inum", operator: "eq", value: billNumber },
                    { field: "company", operator: "eq", value: company?.id }
                ],
                pagination: {
                    mode: "off"
                }
            });
            if (data && data.length > 0) {
                const party = data[0].party;
                const balance = data[0].balance;
                setValue(`collection.${index}.party`, party);
                setValue(`collection.${index}.balance`, balance);
                setValue(`collection.${index}.amt`, balance);
            }
        } catch (error) {
            console.error("Error fetching bill details:", error);
        }
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Collection Entries</CardTitle>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ bill: "", party: "", balance: 0, amt: 0 })}
                        disabled={disabled}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Entry
                    </Button>
                </CardHeader>
                <CardContent className="space-y-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-[minmax(8rem,1fr)_40%_minmax(8rem,1fr)_minmax(8rem,1fr)_auto] gap-4">
                            <FormField
                                control={control}
                                name={`collection.${index}.bill`}
                                rules={{ required: "Bill number is required" }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">Bill No</FormLabel>
                                        <FormControl>
                                            <Combobox
                                                options={billOptions}
                                                value={field.value}
                                                onValueChange={(value) => {
                                                    field.onChange(value);
                                                    handleBillSelect(value, index);
                                                }}
                                                placeholder="Enter Bill number"
                                                isLoading={isBillsLoading}
                                                allowCustom={true}
                                                searchPlaceholder="Search Bill"
                                                emptyMessage={partyId ? "No outstanding bills found." : "Select a party first"}
                                                disabled={disabled}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name={`collection.${index}.party`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">Party Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={field.value || ""}
                                                readOnly
                                                className="bg-muted text-muted-foreground"
                                                disabled={disabled}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name={`collection.${index}.balance`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">Balance</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="1"
                                                {...field}
                                                value={field.value}
                                                readOnly
                                                className="bg-muted text-muted-foreground"
                                                disabled={disabled}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={control}
                                name={`collection.${index}.amt`}
                                rules={{
                                    required: "Amount is required",
                                    min: { value: 1, message: "Amount must be greater than 0" },
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs text-muted-foreground">Amount</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="1"
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value === "" ? "" : +e.target.value)}
                                                value={field.value || ""}
                                                disabled={disabled}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex items-center pt-5">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => remove(index)}
                                    disabled={disabled}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
            {partyId && <OutstandingDialog table={table} setValue={setValue} amt={amt} />}
        </>
    );
};