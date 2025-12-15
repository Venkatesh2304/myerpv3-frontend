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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { Bank } from "@/pages/bank/types";
import { useDataProvider } from "@refinedev/core";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

const CHEQUE_STATUS = [
    { value: "passed", label: "Passed" },
    { value: "bounced", label: "Bounced" },
];

interface ChequeOption {
    label: string;
    value: number;
}

export const ChequeDetailsSection = ({
    isDisabled,
    bankId,
}: {
    isDisabled: boolean;
    bankId?: string | number;
}) => {
    const { control } = useFormContext<Bank>();
    const dataProvider = useDataProvider();
    const [chequeOptions, setChequeOptions] = useState<ChequeOption[]>([]);
    const [isLoadingCheques, setIsLoadingCheques] = useState(false);

    useEffect(() => {
        if (bankId) {
            setIsLoadingCheques(true);
            dataProvider()
                .custom({
                    url: `/cheque_match/${bankId}/`,
                    method: "get",
                })
                .then((response) => {
                    setChequeOptions((response.data as any) || []);
                })
                .catch((error) => {
                    console.error("Error fetching cheque options:", error);
                    setChequeOptions([]);
                })
                .finally(() => {
                    setIsLoadingCheques(false);
                });
        }
    }, [bankId, dataProvider]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cheque Details</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={control}
                        name="cheque_entry"
                        rules={{ required: "Cheque number is required" }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">
                                    Cheque Number {field.value}
                                </FormLabel>
                                <Select
                                    onValueChange={(value) =>
                                        field.onChange(value ? parseInt(value) : null)
                                    }
                                    value={field.value?.toString() || ""}
                                    key={field.value}
                                    disabled={isDisabled || isLoadingCheques}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue
                                                placeholder={
                                                    isLoadingCheques ? "Loading..." : "Select cheque"
                                                }
                                            />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {chequeOptions.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value.toString()}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="cheque_status"
                        rules={{ required: "Cheque status is required" }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">Cheque Status</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value || undefined}
                                    key={field.value}
                                    disabled={isDisabled}
                                >
                                    <FormControl>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {CHEQUE_STATUS.map((status) => (
                                            <SelectItem key={status.value} value={status.value}>
                                                {status.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </CardContent>
        </Card>
    );
};
