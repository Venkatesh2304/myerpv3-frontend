
import { useFieldArray, useFormContext } from "react-hook-form";
import { useList, useDataProvider } from "@refinedev/core";
import { useMemo } from "react";
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
import { Plus, Trash2 } from "lucide-react";
import { useCompany } from "@/providers/company-provider";

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

export const CollectionEntries = ({
    disabled,
}: {
    disabled?: boolean;
}) => {
    const { control, setValue, watch } = useFormContext();
    const { company } = useCompany();
    const dataProvider = useDataProvider();
    const partyId = watch("party_id");
    const { fields, append, remove } = useFieldArray({
        control,
        name: "collection",
    });

    const { query: { data: billData, isLoading: isBillsLoading } } = useList<{
        bill: string;
        balance: number;
        party: string;
        days: number;
    }>({
        resource: "outstanding",
        filters: partyId ? [
            { field: "party", operator: "eq", value: partyId },
            { field: "company", operator: "eq", value: company?.id }
        ] : [],
        pagination: {
            mode: "off"
        },
        queryOptions: {
            enabled: !!partyId,
        },
    });

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
    );
};