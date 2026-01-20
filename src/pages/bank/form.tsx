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
import { ReactNode, useRef, useState } from "react";
import { ChequeDetailsSection } from "./components/cheque-details-section";
import { CurrencyInput } from "@/components/custom/currency-input";
import { BankCollectionList } from "./components/bank-collection-list";
import { CollectionEntries } from "@/components/custom/collectionentires";
import { useCompany } from "@/providers/company-provider";
import { dataProvider } from "@/lib/dataprovider";
import { LoadingButton } from "@/components/ui/loading-button";
import { useHotkeys } from "react-hotkeys-hook";
import { useBack } from "@refinedev/core";
import { HistoryDialog } from "./components/history-dialog";
import { DifferenceConfirmationDialog } from "@/components/custom/difference-confirmation-dialog";



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
  { value: "others", label: "Others" },
];

export const BankForm = ({ footer }: { footer: ReactNode }) => {
  const notification = useNotificationProvider();
  const back = useBack();
  const { company } = useCompany();
  const form = useForm<Bank>({
    refineCoreProps: {
      redirect: false,
      onMutationSuccess: () => {
        back();
      }
    },
    defaultValues: {
      status: "not_pushed",
      type: "",
      party_id: "",
      company: null,
      cheque_entry: null,
      cheque_status: null,
      collection: [],
      events: []
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
  const status = watch("status");
  const partyId = watch("party_id");
  const bankId = id;
  const companyId = watch("company");
  const isPushed = ["partially_pushed", "pushed"].includes(status);
  const isOtherCompany = (companyId && (company?.id != companyId));
  const isDisabled = isPushed || isOtherCompany;

  useHotkeys("c", () => !isDisabled && setValue("type", "cheque"), {
    enableOnFormTags: false,
  });
  useHotkeys("n", () => !isDisabled && setValue("type", "neft"), {
    enableOnFormTags: false,
  });
  useHotkeys("u", () => !isDisabled && setValue("type", "upi"), {
    enableOnFormTags: false,
  });

  useHotkeys(["ctrl+s", "meta+s"], (e) => {
    e.preventDefault();
    handleSubmit(onSubmit as any)();
  }, {
    enableOnFormTags: true,
  });

  const handleAutoMatch = async () => {
    if (!partyId || !bankId) return;

    try {
      const response = await dataProvider.custom({
        url: "/match_outstanding/",
        method: "post",
        payload: {
          company: company?.id,
          party_id: partyId,
          bankstatement_id: bankId,
        },
      });

      if (response.data.status === "success") {
        setValue("collection", response.data.matched_outstanding);
        notification.open({
          type: "success",
          message: "Auto match successful",
          description: `Matched ${response.data.matched_outstanding.length} invoices.`,
        });
      }
    } catch (error: any) {
      notification.open({
        type: "error",
        message: "Auto match failed",
        description: error?.response?.data?.error || "Something went wrong",
      });
    }
  };

  const [diffDialog, setDiffDialog] = useState<{ open: boolean; values: Bank | null; difference: number }>({
    open: false,
    values: null,
    difference: 0,
  });

  const handleDiffConfirm = () => {
    if (diffDialog.values) {
      onFinish(diffDialog.values);
      setDiffDialog({ open: false, values: null, difference: 0 });
    }
  };

  const handleUnsave = () => {
    if (window.confirm("Are you sure you want to unsave this entry? This will reset the type, company, and collections.")) {
      const values = form.getValues();
      onFinish({
        ...values,
        type: null,
        company: null,
        cheque_entry: null,
        collection: [],
      });
    }
  };

  function onSubmit(values: Bank) {
    // Validation based on type
    if (values.type === "neft") {
      const collections = values?.collection || [];
      const total = values?.amt || 0;
      const validation = validateCollectionEntries(total, collections, 50);
      if (!validation?.isValid) {
        if (values.allow_diff) {
          setDiffDialog({
            open: true,
            values: { ...values, company: company?.id },
            difference: validation.difference || 0,
          });
          return;
        }
        else {
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
      }
    }
    else if (values.type === "cheque") {
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
    } else {
      values = { ...values, collection: [] }
    }
    values = { ...values, company: company?.id }
    onFinish(values);
  }
  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Bank Entry Details</CardTitle>
            <div className="flex items-center gap-2">
              {type === "neft" && partyId && !isDisabled && (
                <LoadingButton
                  type="button"
                  variant="secondary"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  size="sm"
                  onClick={handleAutoMatch}
                >
                  Auto Match
                </LoadingButton>
              )}
              {id && (
                <>
                  {(!isPushed && type) && (<LoadingButton
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUnsave}
                  >
                    Unsave
                  </LoadingButton>
                  )}
                  <HistoryDialog events={watch("events")} />
                </>
              )}
            </div>
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
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ""}
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
                        readOnly
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
                    <Input
                      type="text"
                      {...field}
                      value={field.value || ""}
                      disabled
                      className="bg-muted"
                    />
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
                name="party_id"
                // rules={{ required: type == "neft" ? "Party is required" : false }}
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
                        filters={[
                          {
                            field: "company",
                            operator: "eq",
                            value: company?.id,
                          },
                        ]}
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

        {isPushed ? (
          (["cheque", "neft"].includes(type) ? <BankCollectionList bankId={bankId} disabled={isOtherCompany} /> : null)
        ) : type === "neft" ? (
          <CollectionEntries disabled={isDisabled} />
        ) : null}

        {!isDisabled && footer}
      </form>
      <DifferenceConfirmationDialog
        open={diffDialog.open}
        onOpenChange={(open) => setDiffDialog((prev) => ({ ...prev, open }))}
        onConfirm={handleDiffConfirm}
        difference={diffDialog.difference}
      />
    </Form>
  );
};
