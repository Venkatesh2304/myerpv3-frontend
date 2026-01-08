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
import { useCompany } from "@/providers/company-provider";
import { useDataProvider } from "@refinedev/core";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigation } from "@refinedev/core";

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
    const { company } = useCompany();
    const dataProvider = useDataProvider();
    const { edit } = useNavigation();
    const [chequeOptions, setChequeOptions] = useState<ChequeOption[]>([]);
    const [isLoadingCheques, setIsLoadingCheques] = useState(false);

    const chequeEntry = useWatch({
        control,
        name: "cheque_entry",
    });

    useEffect(() => {
        if (bankId) {
            setIsLoadingCheques(true);
            dataProvider()
                .custom({
                    url: `/cheque_match/`,
                    method: "post",
                    payload: {
                        bank_id: bankId,
                        company: company?.id,
                    },
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
                                <div className="flex items-center">
                                    <FormLabel className="text-xs">
                                        Cheque Number
                                    </FormLabel>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 px-5"
                                        disabled={!chequeEntry}
                                        onClick={() => edit("cheque", chequeEntry)}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>
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
