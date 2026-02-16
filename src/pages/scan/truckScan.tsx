import * as React from "react"
import { Check, ScanBarcode, X, Pencil, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { useEffect, useMemo } from "react"
import { dataProvider } from "@/lib/dataprovider";
import { useCompany } from "@/providers/company-provider";
import { useCustom, useNotification } from "@refinedev/core"
import { Label } from "@/components/ui/label"
import { EditItemDialog, EditItemDialogProps } from "@/components/scan/edit-item-dialog"
import { ScanConfirmationAlert, ScanConfirmationAlertProps } from "@/components/scan/scan-confirmation-alert"
import { SaveConfirmationDialog, SaveConfirmationDialogProps } from "@/components/scan/save-confirmation-dialog"
import { ScannedItemsTable, QtyMap } from "@/components/scan/scanned-items-table"
import { useScanLogic } from "@/hooks/use-scan-logic"
import { BarcodeInput } from "@/components/scan/barcode-input"

export function TruckScanPage() {
    const { open } = useNotification();
    const { query: { data: loadData, isLoading: isLoadLoading } } = useCustom({
        url: "get_last_load",
        method: "get",
    });

    const loadNo = loadData?.data?.load;

    const form = useForm({
        defaultValues: {
            cbu: "",
            mrp: "",
            qty: ""
        },
    });
    const {
        currentScanned,
        setCurrentScanned,
        lastScanned,
        setLastScanned,
        updateScannedItem,
        scannedCount,
        flattenedScannedItems
    } = useScanLogic();

    const [box, setBox] = React.useState<any>(null);
    const [maxBox, setMaxBox] = React.useState<any>(null);
    const [invoiceMap, setInvoiceMap] = React.useState<QtyMap>({}); // Renamed from purchase
    const [otherScanned, setOtherScanned] = React.useState<QtyMap>({});

    const [editingItem, setEditingItem] = React.useState<{ cbu: string; mrp: number; qty: number } | null>(null);
    const cbuInputRef = React.useRef<HTMLInputElement>(null);
    const [alertOpen, setAlertOpen] = React.useState(false);
    const [alertConfig, setAlertConfig] = React.useState<{
        title: string;
        description: string;
        onConfirm: () => void;
    } | null>(null);
    const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);

    const focusInput = () => {
        setTimeout(() => {
            cbuInputRef.current?.focus();
        }, 300);
    };

    useEffect(() => {
        if (!loadNo) return;
        dataProvider.getOne({
            resource: "load_detail",
            id: loadNo
        }).then((res) => {
            setInvoiceMap(res.data.purchase_qty_map);
            setMaxBox(res.data.box_count);
            setBox(res.data.box_count);
        });
    }, [loadNo]);

    useEffect(() => {
        if (!box || !loadNo) return;
        dataProvider.custom({
            url: "/box",
            method: "get",
            query: {
                box_no: box,
                load: loadNo
            }
        }).then((res) => {
            setOtherScanned(res.data.others_scanned);
            setCurrentScanned(res.data.current_scanned);
        });
    }, [box, loadNo]);

    // Validation wrapper around updateScannedItem
    const validateAndAdd = (cbu: string, mrp: number, qty: number) => {
        if (!invoiceMap[cbu]) {
            setAlertConfig({
                title: "Product not in invoice " + cbu,
                description: "This product is not in invoice. Confirm add?",
                onConfirm: () => updateScannedItem(cbu, mrp, qty, true)
            });
            setAlertOpen(true);
            return;
        } else if (!invoiceMap[cbu][mrp]) {
            setAlertConfig({
                title: "MRP not in invoice " + mrp,
                description: "This MRP is not present in invoice. Confirm is correct?",
                onConfirm: () => updateScannedItem(cbu, mrp, qty, true)
            });
            setAlertOpen(true);
            return;
        } else {
            updateScannedItem(cbu, mrp, qty, true);
        }
        form.reset();
        focusInput();
    };

    const handleScan = (value: string) => {
        try {
            // Parse GS1 from value
            if (value.includes("(241)") && value.includes("(10)") && value.includes("(90)") && value.includes("(21)")) {
                const cbu = value.split("(241)")[1].split("(10)")[0].trim().toUpperCase();
                const mrp = Number(value.split("(90)")[1].split("(21)")[0].trim());
                if (cbu && !isNaN(mrp)) {
                    validateAndAdd(cbu, mrp, 1);
                }
            }
            // User requested "reuse logic", so keep as is.
        } catch (err) {
            console.error("Failed to parse barcode", err);
        }
    };

    const onAddSubmit = (data: any) => {
        validateAndAdd(data.cbu, Number(data.mrp), Number(data.qty));
    }

    const onSave = () => {
        setSaveDialogOpen(true);
    }

    const handleSaveConfirm = (enteredQty: number) => {
        const currentTotalQty = Object.values(currentScanned).reduce((acc, mrpMap) => {
            return acc + Object.values(mrpMap).reduce((sum, qty) => sum + qty, 0);
        }, 0);

        if (enteredQty === currentTotalQty) {
            dataProvider.custom({
                url: "/box/",
                method: "post",
                payload: {
                    box_no: box,
                    load: loadNo,
                    scanned: currentScanned
                }
            }).then((res) => {
                setMaxBox(res.data.box_no);
                setBox(res.data.box_no);
                setSaveDialogOpen(false);
                focusInput();
                open?.({
                    type: "success",
                    message: "Box saved successfully",
                });
            });
        } else {
            open?.({
                type: "error",
                message: "Total quantity mismatch. Please check and try again.",
            });
        }
    };

    const cbuValue = form.watch("cbu");
    const suggestions = useMemo(() => {
        return Object.keys(invoiceMap);
    }, [invoiceMap]);

    return (
        <>
            <div className="flex flex-col gap-4 max-w-sm">
                <div className="flex gap-4">
                    <Label className="w-fit-content">Box No:</Label>
                    <Input className="w-24" value={box || ""} onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value > maxBox) {
                            open?.({ type: "error", message: "Box No > Max Box" });
                            return;
                        }
                        setBox(e.target.value);
                    }} />
                    <Label className="w-fit-content ml-auto font-normal">Last Box: {maxBox - 1}</Label>
                </div>

                <form onSubmit={form.handleSubmit(onAddSubmit)} className="flex gap-3 flex-col relative">
                    <BarcodeInput
                        value={cbuValue}
                        onChange={(val) => form.setValue("cbu", val)}
                        onScan={handleScan}
                        options={suggestions}
                        placeholder="CBU"
                        inputRefProp={cbuInputRef}
                    />

                    <Input className="h-12" placeholder="MRP" type="number" {...form.register("mrp")} />
                    <Input className="h-12" placeholder="Qty" type="number" {...form.register("qty")} />
                    <Button type="submit" className="bg-blue-500 h-12 text-lg">Add ({scannedCount})</Button>
                </form>

                <ScannedItemsTable
                    items={flattenedScannedItems}
                    purchase={invoiceMap}
                    otherScanned={otherScanned}
                    onEdit={setEditingItem}
                    label="CBU"
                />

                <Button onClick={onSave} className="bg-green-500 h-12 text-lg w-[50%] mx-auto mt-2">Save</Button>
            </div>

            <EditItemDialog
                item={editingItem}
                open={!!editingItem}
                onOpenChange={(open) => {
                    if (!open) {
                        setEditingItem(null);
                        focusInput();
                    }
                }}
                onUpdate={updateScannedItem}
                label="CBU"
            />

            <ScanConfirmationAlert
                open={alertOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setAlertOpen(false);
                        focusInput();
                    }
                }}
                title={alertConfig?.title}
                description={alertConfig?.description}
                onConfirm={() => {
                    alertConfig?.onConfirm();
                    form.reset();
                }}
            />
            <SaveConfirmationDialog
                open={saveDialogOpen}
                onOpenChange={(open) => {
                    setSaveDialogOpen(open);
                    if (!open) focusInput();
                }}
                onConfirm={handleSaveConfirm}
            />
        </>
    );
}