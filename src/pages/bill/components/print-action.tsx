import { ResourceCombobox } from "@/components/custom/resource-combobox";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { dataProvider } from "@/lib/dataprovider";
import { useCustomMutation, useNotification } from "@refinedev/core";
import { Printer } from "lucide-react";
import React, { useEffect } from "react";
import { OutstandingTable } from "./outstanding-table";
import { useCompany } from "@/providers/company-provider";
import { useCaptcha } from "@/components/custom/CaptchaProvider";
import { requestWithCaptcha } from "@/lib/captcha";

const PRINT_TYPE_OPTIONS = [
    { value: "both_copy", label: "Both Copy" },
    { value: "loading_sheet_salesman", label: "Loading Sheet Salesman" },
    { value: "loading_sheet", label: "Loading Sheet" },
    { value: "first_copy", label: "First Copy" },
    { value: "double_first_copy", label: "Double First Copy" },
    { value: "second_copy", label: "Second Copy" },
    { value: "reload_bill", label: "Reload Bill" },
];

export const PrintAction = ({ table }: { table: any }) => {
    const [printType, setPrintType] = React.useState("both_copy");
    const [showPrintedWarning, setShowPrintedWarning] = React.useState(false);
    const [showLoadingSheetDialog, setShowLoadingSheetDialog] =
        React.useState(false);
    const [selectedParty, setSelectedParty] = React.useState("");
    const { open } = useNotification();
    const { company } = useCompany();
    const { mutation } = useCustomMutation();
    const captcha = useCaptcha();
    const isLoading = mutation.isPending;
    // Get selected rows
    const selectedRows = table.reactTable.getSelectedRowModel().rows;
    const selectedIds = selectedRows.map((row: any) => row.original.bill);
    const firstBill = selectedRows[0]?.original;

    const handlePrintClick = () => {
        if (selectedIds.length === 0) {
            open?.({
                type: "error",
                message: "No bills selected",
                description: "Please select at least one bill to print.",
            });
            return Promise.resolve();
        }

        const typesCheckingPrintTime = [
            "both_copy",
            "first_copy",
            "double_first_copy",
            "loading_sheet_salesman",
        ];

        if (typesCheckingPrintTime.includes(printType)) {
            const printedBills = selectedRows.filter(
                (row: any) => row.original.print_time !== null
            );
            if (printedBills.length > 0) {
                setShowPrintedWarning(true);
                return Promise.resolve();
            }
        }

        return proceedToPrintFlow();
    };

    const proceedToPrintFlow = () => {
        if (printType === "loading_sheet_salesman") {
            setShowPrintedWarning(false);
            setShowLoadingSheetDialog(true);
            return Promise.resolve();
        } else {
            return executePrint({});
        }
    };

    const executePrint = (additionalData: any) => {
        const payload = {
            bills: selectedIds,
            print_type: printType,
            beat: "",
            party: "",
            salesman: "",
            company: company?.id,
            ...additionalData,
        };
        return requestWithCaptcha(
            {
                url: "/print_bills/",
                method: "post",
                headers: { "Content-Type": "application/json" },
                data: payload,
            },
            captcha
        )
            .then((res) => {
                if (res?.data?.filepath) {
                    return dataProvider
                        .custom({
                            url: res.data.filepath,
                            method: "get",
                            meta: {
                                responseType: "blob",
                            },
                        })
                        .then(async (response) => {
                            const blob = response.data;
                            const url = URL.createObjectURL(blob);
                            const iframe = document.createElement("iframe");
                            iframe.style.display = "none";
                            iframe.src = url;
                            document.body.appendChild(iframe);
                            iframe.onload = () => {
                                const frameWindow = iframe?.contentWindow;

                                // 1. Tell the iframe what to do AFTER printing
                                frameWindow.onafterprint = () => {
                                    document.body.removeChild(iframe);
                                    window.URL.revokeObjectURL(url);
                                };

                                // 2. Trigger the print
                                frameWindow?.focus(); // Good practice for Chrome
                                frameWindow?.print();
                            };
                            table.reactTable.resetRowSelection();
                        });
                }
            })
            .catch((err) => {
                open?.({
                    type: "error",
                    message: "Error printing bills",
                    description: err.error,
                });
            })
            .finally(() => {
                setShowPrintedWarning(false);
                setSelectedParty("");
                setShowLoadingSheetDialog(false);
                table.refineCore.tableQuery.refetch();
            });
    };

    const handleLoadingSheetSubmit = () => {
        if (!selectedParty) {
            open?.({
                type: "error",
                message: "Party required",
                description: "Please select a party.",
            });
            return Promise.resolve();
        }

        return executePrint({
            beat: firstBill?.beat,
            salesman: firstBill?.salesman,
            party: selectedParty,
        });
    };

    return (
        <>
            <div className="flex flex-col md:flex-row gap-8 mt-4">
                <div className="flex-grow md:max-w-xs">
                    <Select value={printType} onValueChange={setPrintType}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Print Type" />
                        </SelectTrigger>
                        <SelectContent>
                            {PRINT_TYPE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center gap-4">
                    <LoadingButton
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={handlePrintClick}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        PRINT
                    </LoadingButton>
                </div>
            </div>

            <AlertDialog
                open={showPrintedWarning}
                onOpenChange={setShowPrintedWarning}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Bills Are Already Printed</AlertDialogTitle>
                        <AlertDialogDescription />
                        The following bills have already been printed:
                        <ul className="list-disc list-inside mt-2 max-h-40 overflow-y-auto">
                            {selectedRows
                                .filter((row: any) => row.original.print_time !== null)
                                .map((row: any) => (
                                    <li key={row.original.bill}>{row.original.bill}</li>
                                ))}
                        </ul>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <LoadingButton onClick={proceedToPrintFlow}>Confirm</LoadingButton>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog
                open={showLoadingSheetDialog}
                onOpenChange={(open) => { setShowLoadingSheetDialog(open); setSelectedParty(""); }}
            >
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Salesman Loading Sheet</DialogTitle>
                        <DialogDescription>
                            Select a party to view outstanding bills and proceed.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="beat" className="text-right">
                                Beat
                            </Label>
                            <Input
                                id="beat"
                                value={firstBill?.beat || ""}
                                disabled
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="party" className="text-right">
                                Party
                            </Label>
                            <div className="col-span-3">
                                <ResourceCombobox
                                    resource="party"
                                    value={selectedParty}
                                    onValueChange={setSelectedParty}
                                    placeholder="Select Party"
                                    valueKey="value"
                                    labelKey="label"
                                    filters={[
                                        {
                                            field: "beat",
                                            operator: "eq",
                                            value: firstBill?.beat,
                                        },
                                        {
                                            field: "company",
                                            operator: "eq",
                                            value: company.id,
                                        }
                                    ]}
                                />
                            </div>
                        </div>
                    </div>

                    <OutstandingTable beat={firstBill?.beat} party={selectedParty} companyId={company?.id} />

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowLoadingSheetDialog(false)}
                        >
                            Cancel
                        </Button>
                        <LoadingButton onClick={handleLoadingSheetSubmit}>
                            Submit
                        </LoadingButton>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
