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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ResourceCombobox } from "@/components/custom/resource-combobox";
import { CurrencyInput } from "@/components/custom/currency-input";
import { useFormContext } from "react-hook-form";
import { useCompany } from "@/providers/company-provider";

const BANKS = [
    "KVB 650",
    "SBI",
    "CANARA",
    "BARODA",
    "UNION BANK",
    "AXIS",
    "HDFC",
    "CENTRAL BANK",
    "INDIAN BANK",
    "IOB",
    "ICICI",
    "CUB",
    "KOTAK",
    "SYNDICATE",
    "TMB",
    "UNITED BANK",
    "TCB",
    "PGB",
];

export const ChequeDetailsCard = () => {
    const { control } = useFormContext();
    const { company } = useCompany();
    return (
        <Card>
            <CardHeader>
                <CardTitle>Cheque Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_2.67fr_1fr] gap-4">
                    <FormField
                        control={control}
                        name="cheque_no"
                        rules={{ required: "Cheque number is required" }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">Cheque No</FormLabel>
                                <FormControl>
                                    <Input {...field} value={field.value || ""} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="cheque_date"
                        rules={{ required: "Cheque date is required" }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">Cheque Date</FormLabel>
                                <FormControl>
                                    <Input
                                        type="date"
                                        {...field}
                                        value={field.value || ""}
                                        className="block"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="amt"
                        rules={{
                            required: "Amount is required",
                        }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">Amount</FormLabel>
                                <FormControl>
                                    <CurrencyInput
                                        {...field}
                                        value={field.value || ""}
                                        className="font-bold"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="party_id"
                        rules={{ required: "Party is required" }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">Party</FormLabel>
                                <FormControl>
                                    <ResourceCombobox
                                        resource="party"
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        placeholder="Select party"
                                        minSearchLength={3}
                                        labelKey="label"
                                        valueKey="value"
                                        filters={
                                            [{ "field": "company", "operator": "eq", "value": company?.id }]
                                        }
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={control}
                        name="bank"
                        rules={{ required: "Bank is required" }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-xs">Bank</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    value={field.value}
                                    key={field.value}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select bank" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {BANKS.map((bank) => (
                                            <SelectItem key={bank} value={bank}>
                                                {bank}
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
