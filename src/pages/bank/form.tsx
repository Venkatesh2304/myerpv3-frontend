import { useForm } from "@refinedev/react-hook-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
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
import type { Bank } from "@/pages/bank/types";
import { useNotificationProvider } from "@/components/refine-ui/notification/use-notification-provider";
import { validateCollectionEntries } from "@/components/custom/collectionentires";
import { ReactNode } from "react";
import { ChequeDetailsSection } from "./components/cheque-details-section";
import { CurrencyInput } from "@/components/custom/currency-input";
import { BankCollectionList } from "./components/bank-collection-list";
import { CollectionEntries } from "@/components/custom/collectionentires";

const BANKS = [
  { value: "KVB CA", label: "KVB CA" },
  { value: "SBI OD", label: "SBI OD" },
  { value: "KVB OD", label: "KVB OD" },
  { value: "SBI LAKME", label: "SBI LAKME" },
];

const COLLECTION_TYPES = [
  { value: "cheque", label: "Cheque" },
  { value: "neft", label: "NEFT" },
  { value: "upi", label: "UPI" },
  { value: "cash_deposit", label: "Cash Deposit" },
];

export const BankForm = ({ footer }: { footer: ReactNode }) => {
  const notification = useNotificationProvider();

  const form = useForm<Bank>({
    refineCoreProps: {},
    defaultValues: {
      pushed: false,
      type: "",
      party: "",
      cheque_entry: null,
      cheque_status: null,
    },
    shouldUnregister: false,
  });

  const {
    refineCore: { onFinish, id },
    control,
    handleSubmit,
    setValue,
    watch,
    setError,
  } = form;

  const type = watch("type");
  const pushed = watch("pushed");
  const bankId = id;
  const isDisabled = pushed === true;

  function onSubmit(values: Bank) {
    // Validation based on type
    if (values.type === "neft") {
      const collections = values?.collection || [];
      const total = values?.amt || 0;
      const validation = validateCollectionEntries(total, collections, 50);
      if (!validation.isValid) {
        notification.open({
          type: "error",
          message: validation.message || "Validation failed",
        });

        setError("root", {
          type: "manual",
          message: validation.message || "Validation failed",
        });

        return;
      }
    } else if (values.type === "cheque") {
      if (!values.cheque_entry) {
        notification.open({
          type: "error",
          message: "Cheque number is required",
        });

        setError("cheque_entry", {
          type: "manual",
          message: "Cheque number is required",
        });

        return;
      }

      if (!values.cheque_status) {
        notification.open({
          type: "error",
          message: "Cheque status is required",
        });

        setError("cheque_status", {
          type: "manual",
          message: "Cheque status is required",
        });

        return;
      }
    }

    onFinish(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Bank Entry Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* First Row */}
            <div className="grid grid-cols-1 grid-cols-[1fr_1fr_1fr_1fr_2fr] gap-4">
              <FormField
                control={control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                        disabled
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="amt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Amount</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        {...field}
                        value={field.value || ""}
                        disabled
                        className="text-black"
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
                      value={field.value || undefined}
                      key={field.value}
                      disabled={isDisabled}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select bank" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BANKS.map((bank) => (
                          <SelectItem key={bank.value} value={bank.value}>
                            {bank.label}
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
                name="type"
                rules={{ required: "Type is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      key={field.value}
                      disabled={isDisabled}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COLLECTION_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                name="party"
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
                        disabled={isDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={control}
                name="ref"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Reference</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        disabled
                        className="bg-muted font-mono"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="desc"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs">Description</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        disabled
                        className="bg-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {type === "cheque" && (
          <ChequeDetailsSection
            isDisabled={isDisabled}
            bankId={bankId}
          />
        )}

        {pushed ? (
          <BankCollectionList bankId={bankId} />
        ) : type === "neft" ? (
          <CollectionEntries disabled={isDisabled} />
        ) : null}

        {footer}
      </form>
    </Form>
  );
};
