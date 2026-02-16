import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dataProvider } from "@/lib/dataprovider";
import { useCompany } from "@/providers/company-provider";
import { useNotification } from "@refinedev/core";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { EditItemDialog } from "@/components/scan/edit-item-dialog";
import { ScanConfirmationAlert } from "@/components/scan/scan-confirmation-alert";
import { SaveConfirmationDialog } from "@/components/scan/save-confirmation-dialog";
import { ScannedItemsTable, QtyMap } from "@/components/scan/scanned-items-table";
import { useScanLogic } from "@/hooks/use-scan-logic";
import { BarcodeInput } from "@/components/scan/barcode-input";
import { downloadFromFilePath } from "@/lib/download";

interface SalesScanConfig {
    invoiceMap: QtyMap; // Renamed from bill_qty_map
    case_config: Record<string, number>; // Maps SKU -> Case Qty
    barcode_map: Record<string, string[]>;
    sku_list: string[];
    box_count: number;
    cbu_map: Record<string, string[]>; // Maps CBU -> List of SKUs
}

interface MismatchItem {
    sku: string;
    name?: string; // Add name field
    mrp: number;
    billed: number;
    scanned: number;
}

function ConflictResolverDialog({ open, onOpenChange, title, options, onSelect }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    options: { label: string; value: any }[];
    onSelect: (value: any) => void;
}) {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio("/notification.mp3");
    }, []);

    useEffect(() => {
        if (open) {
            audioRef.current?.play().catch(e => console.error("Error playing sound", e));
        }
    }, [open]);

    if (!open) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        Please select the correct product.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-2">
                    {options.map((option, idx) => (
                        <Button
                            key={idx}
                            variant="outline"
                            className="justify-start h-auto py-2 px-4"
                            onClick={() => {
                                onSelect(option.value);
                                onOpenChange(false);
                            }}
                        >
                            {option.label}
                        </Button>
                    ))}
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

function BillSummaryDialog({ open, onOpenChange, items, onDownload }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    items: MismatchItem[];
    onDownload: () => void;
}) {
    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md w-[95vw] max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-4 border-b">
                    <div className="flex justify-between items-center pr-10">
                        <DialogTitle>Mismatch</DialogTitle>
                        <Button onClick={onDownload} variant="secondary" size="sm">
                            Download
                        </Button>
                    </div>
                </DialogHeader>
                <div className="flex-1 overflow-auto p-4 space-y-3">
                    {items.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No data found
                        </div>
                    ) : (
                        items.map((item, idx) => {
                            const isMismatch = item.billed !== item.scanned;
                            return (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-lg border ${isMismatch
                                        ? "bg-red-50/50 border-red-200"
                                        : "bg-card border-border"
                                        }`}
                                >
                                    <div className="font-medium text-sm leading-tight mb-2">
                                        {item.name || item.sku}
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                        <div>
                                            <div className="text-muted-foreground mb-0.5">MRP</div>
                                            <div className="font-semibold">₹{item.mrp}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground mb-0.5 text-center">Billed</div>
                                            <div className="font-semibold text-center">{item.billed}</div>
                                        </div>
                                        <div>
                                            <div className="text-muted-foreground mb-0.5 text-right">Scanned</div>
                                            <div className={`font-bold text-right ${isMismatch ? "text-red-600" : "text-green-600"}`}>
                                                {item.scanned}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export function SalesScanPage({ onBack }: { onBack: () => void }) {
    const { company } = useCompany();
    const { open } = useNotification();
    const [step, setStep] = useState<"bill-entry" | "scanning">("bill-entry");
    const [scanId, setScanId] = useState<string | null>(null);
    const [billNo, setBillNo] = useState("");
    const [config, setConfig] = useState<SalesScanConfig | null>(null);

    const {
        currentScanned,
        setCurrentScanned,
        lastScanned,
        setLastScanned,
        updateScannedItem,
        scannedCount,
        flattenedScannedItems
    } = useScanLogic();

    const [box, setBox] = useState<any>(null);
    const [maxBox, setMaxBox] = useState<any>(null);
    const [otherScanned, setOtherScanned] = useState<QtyMap>({});
    const [editingItem, setEditingItem] = useState<{ cbu: string; mrp: number; qty: number } | null>(null);

    const [alertConfig, setAlertConfig] = useState<{ title: string; description: string; onConfirm: () => void } | null>(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [conflictDialog, setConflictDialog] = useState<{
        open: boolean;
        title: string;
        options: { label: string; value: any }[];
        onSelect: (value: any) => void;
    }>({ open: false, title: "", options: [], onSelect: () => { } });

    // Summary Dialog State
    const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
    const [mismatchData, setMismatchData] = useState<MismatchItem[]>([]);

    const inputRef = useRef<HTMLInputElement>(null);
    const form = useForm({ defaultValues: { input: "" } });

    const focusInput = () => setTimeout(() => inputRef.current?.focus(), 300);

    const handleBillSubmit = async () => {
        if (!billNo) return;
        try {
            const res = await dataProvider.custom({
                url: "sales_scan_id/",
                method: "post",
                payload: { company_id: company?.id, bill_no: billNo },
            });
            if (res.data?.id) {
                setScanId(res.data.id);
                setStep("scanning");
            }
        } catch (error) {
            open?.({ type: "error", message: "Failed to verify bill number" });
        }
    };

    const handleDownloadSummary = async () => {
        if (!scanId) return;
        try {
            const res = await dataProvider.custom({
                url: "sales_scan_summary/",
                method: "post",
                payload: { scan_id: scanId }
            });
            if (res.data?.filepath) {
                await downloadFromFilePath(res.data.filepath);
                open?.({ type: "success", message: "Summary Downloaded" });
            } else {
                open?.({ type: "error", message: "No file generated" });
            }
        } catch (error) {
            open?.({ type: "error", message: "Download Failed" });
        }
    };

    const handleBillClick = async () => {
        if (!scanId) return;
        setSummaryDialogOpen(true);
        setMismatchData([]); // Clear previous data
        try {
            const res = await dataProvider.custom({
                url: "sales_scan_mismatch/",
                method: "post",
                payload: { scan_id: scanId }
            });

            if (Array.isArray(res.data)) {
                setMismatchData(res.data);
            } else {
                // Fallback attempt
                setMismatchData(res.data?.mismatches || []);
            }
        } catch (error) {
            open?.({ type: "error", message: "Failed to fetch scan summary" });
        }
    };

    useEffect(() => {
        if (step === "scanning" && scanId) {
            dataProvider.getOne({
                resource: "sales_scan",
                id: scanId,
            }).then((res) => {
                setConfig({
                    ...res.data,
                    invoiceMap: res.data.bill_qty_map || res.data.invoiceMap,
                    cbu_map: res.data.cbu_map || res.data.cbu_to_sku_map // Map cbu_map if present
                });
                setBox(res.data.box_count);
                setMaxBox(res.data.box_count);
            });
        }
    }, [step, scanId]);

    useEffect(() => {
        if (!box || !scanId) return;
        dataProvider.custom({
            url: "sales_box",
            method: "get",
            query: { box_no: box, scan_id: scanId }
        }).then((res) => {
            setOtherScanned(res.data.others_scanned || {});
            setCurrentScanned(res.data.current_scanned || {});
        });
    }, [box, scanId]);

    const handlePotentialMatches = (matches: { sku: string; mrp: number }[], qty: number = 1) => {
        if (matches.length === 0) {
            setAlertConfig({
                title: "Not Found",
                description: "Product not found in bill.",
                onConfirm: () => { }
            });
            setAlertOpen(true);
        } else if (matches.length === 1) {
            updateScannedItem(matches[0].sku, matches[0].mrp, qty, true);
        } else {
            setConflictDialog({
                open: true,
                title: "Select Product",
                options: matches.map(o => ({
                    label: `${o.sku} - Rs. ${o.mrp}`,
                    value: o
                })),
                onSelect: (val) => updateScannedItem(val.sku, val.mrp, qty, true)
            });
        }
    };

    const handleScan = (input: string) => {
        input = input.trim();
        if (!input || !config) return;

        // Try to parse GS1 CBU pattern "(241)...(10)..."
        let cbuCode = input;
        if (input.includes("(241)") && input.includes("(10)")) {
            try {
                cbuCode = input.split("(241)")[1].split("(10)")[0].trim().toUpperCase();
            } catch (e) {
                console.error("Error parsing GS1 CBU", e);
            }
        }

        // 1. Check Barcode (Raw Input)
        if (config.barcode_map[input]) {
            const skus = config.barcode_map[input];
            const validOptions: { sku: string; mrp: number }[] = [];

            skus.forEach(sku => {
                if (config.invoiceMap[sku]) {
                    Object.keys(config.invoiceMap[sku]).forEach(mrp => {
                        validOptions.push({ sku, mrp: Number(mrp) });
                    });
                }
            });

            if (validOptions.length > 0) {
                handlePotentialMatches(validOptions);
                form.setValue("input", "");
                return;
            }
        }

        // 2. Check CBU
        if (config.cbu_map && config.cbu_map[cbuCode]) {
            const mappedSkus = config.cbu_map[cbuCode];
            const skuList = Array.isArray(mappedSkus) ? mappedSkus : [mappedSkus];

            if (skuList.length === 0) {
                setAlertConfig({
                    title: "Unknown CBU",
                    description: "CBU Code mapped to empty SKU list",
                    onConfirm: () => { }
                });
                setAlertOpen(true);
                form.setValue("input", "");
                return;
            }

            // Valid SKUs found for this CBU. Check invoiceMap and determine Case Qty.
            const validOptions: { sku: string; mrp: number }[] = [];
            let detectedCaseQty = 0;

            skuList.forEach(sku => {
                if (config.invoiceMap[sku]) {
                    // Get case qty for this SKU (assume from config.case_config[sku])
                    const q = config.case_config?.[sku];
                    if (q && detectedCaseQty === 0) detectedCaseQty = q; // Take first found qty

                    Object.keys(config.invoiceMap[sku]).forEach(mrp => {
                        validOptions.push({ sku, mrp: Number(mrp) });
                    });
                }
            });

            if (validOptions.length > 0) {
                handlePotentialMatches(validOptions, detectedCaseQty || 1);
            } else {
                setAlertConfig({
                    title: "SKU Not in Invoice",
                    description: `CBU mapped SKUs (${skuList.join(", ")}) not found in this bill.`,
                    onConfirm: () => { }
                });
                setAlertOpen(true);
            }
            form.setValue("input", "");
            return;
        }

        // Unknown
        setAlertConfig({
            title: "Unknown Scan",
            description: "Input not found in Barcodes or CBUs configuration.",
            onConfirm: () => { }
        });
        setAlertOpen(true);
        form.setValue("input", "");
    };

    const handleManualAdd = (input: string) => {
        if (!input || !config) return;

        // Check for "SKU - Rs.MRP" format
        if (input.includes(" - Rs.")) {
            const parts = input.split(" - Rs.");
            const mrpPart = parts[parts.length - 1];
            const skuPart = parts.slice(0, parts.length - 1).join(" - Rs.");

            const mrp = Number(mrpPart.trim());
            const sku = skuPart.trim();

            if (sku && !isNaN(mrp)) {
                if (config.invoiceMap[sku] && config.invoiceMap[sku][mrp] !== undefined) {
                    updateScannedItem(sku, mrp, 1, true);
                    form.setValue("input", "");
                    focusInput();
                    return;
                }
            }
        }

        // Fallback: Check as pure SKU
        if (config.invoiceMap[input]) {
            const mrps = Object.keys(config.invoiceMap[input]).map(k => Number(k));
            const matches = mrps.map(mrp => ({ sku: input, mrp }));
            handlePotentialMatches(matches);
            form.setValue("input", "");
            focusInput();
            return;
        }

        setAlertConfig({
            title: "Not Found",
            description: "SKU not found in invoice.",
            onConfirm: () => { }
        });
        setAlertOpen(true);
        form.setValue("input", "");
    };

    const suggestions = useMemo(() => {
        const inputValue = form.watch("input");
        if (!inputValue || inputValue.length < 2 || !config) return [];

        const options: string[] = [];
        Object.entries(config.invoiceMap).forEach(([sku, mrpMap]) => {
            Object.keys(mrpMap).forEach(mrp => {
                options.push(`${sku} - Rs.${mrp}`);
            });
        });

        return options.filter(opt => opt.toLowerCase().includes(inputValue.toLowerCase())).slice(0, 50);
    }, [form.watch("input"), config]);

    if (step === "bill-entry") {
        return (
            <div className="flex flex-col items-center justify-center p-10 gap-4 relative">
                <Button
                    variant="ghost"
                    className="absolute top-4 right-4 text-gray-500"
                    onClick={onBack}
                >
                    Exit
                </Button>
                <Label>Enter Bill Number</Label>
                <Input
                    value={billNo}
                    onChange={e => setBillNo(e.target.value.toUpperCase())}
                    placeholder="Bill No"
                    className="w-64"
                />
                <Button onClick={handleBillSubmit}>Start Scan</Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 max-w-sm mx-auto p-4">
            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border">
                <div
                    className="text-xl font-bold font-mono cursor-pointer hover:underline text-blue-600"
                    onClick={handleBillClick}
                    title="Click to View Summary"
                >
                    {billNo}
                </div>
                <Button variant="ghost" size="sm" onClick={onBack} className="h-8 hover:bg-red-100 hover:text-red-600">Exit</Button>
            </div>

            <div className="flex gap-4">
                <Label className="w-fit-content">Box No:</Label>
                <Input className="w-24" value={box || ""} onChange={(e) => {
                    const val = Number(e.target.value);
                    if (val > maxBox) {
                        open?.({ type: "error", message: "Box No > Max Box" });
                        return;
                    }
                    setBox(e.target.value);
                }} />
                <Label className="w-fit-content ml-auto text-sm">Max Box: {maxBox}</Label>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); }} className="flex gap-3 flex-col relative">
                <div className="flex w-full items-start gap-2">
                    <div className="flex-1">
                        <BarcodeInput
                            value={form.watch("input")}
                            onChange={(val) => form.setValue("input", val)}
                            onScan={handleScan}
                            options={suggestions}
                            placeholder="Scan / Type SKU"
                            inputRefProp={inputRef}
                        />
                    </div>
                    <Button type="button" onClick={() => handleManualAdd(form.getValues("input"))} className="h-12 w-20">
                        Add
                    </Button>
                </div>
                <div className="text-center font-bold text-lg">Total Scanned: {scannedCount}</div>
            </form>

            <ScannedItemsTable
                items={flattenedScannedItems}
                purchase={config?.invoiceMap || {}}
                otherScanned={otherScanned}
                onEdit={setEditingItem}
                label="SKU"
            />

            <Button onClick={() => setSaveDialogOpen(true)} className="bg-green-500 h-12 text-lg w-[50%] mx-auto mt-2">Save Box</Button>

            <ScanConfirmationAlert
                open={alertOpen}
                onOpenChange={(o) => { if (!o) { setAlertOpen(false); focusInput(); } }}
                title={alertConfig?.title}
                description={alertConfig?.description}
                onConfirm={alertConfig?.onConfirm || (() => { })}
            />

            <SaveConfirmationDialog
                open={saveDialogOpen}
                onOpenChange={(o) => { setSaveDialogOpen(o); if (!o) focusInput(); }}
                onConfirm={(qty) => {
                    const currentTotal = Object.values(currentScanned).reduce((acc, m) => acc + Object.values(m).reduce((s, q) => s + q, 0), 0);
                    if (qty === currentTotal) {
                        dataProvider.custom({
                            url: "sales_box/",
                            method: "post",
                            payload: {
                                box_no: box,
                                scan_id: scanId,
                                scanned: currentScanned
                            }
                        }).then((res) => {
                            if (res.data.box_no) {
                                setBox(res.data.box_no);
                                setMaxBox(res.data.box_no);
                            }
                            setSaveDialogOpen(false);
                            focusInput();
                            open?.({ type: "success", message: "Box Saved" });
                        });
                    } else {
                        open?.({ type: "error", message: "Quantity Mismatch" });
                    }
                }}
            />

            <EditItemDialog
                item={editingItem}
                open={!!editingItem}
                onOpenChange={(o) => { if (!o) { setEditingItem(null); focusInput(); } }}
                onUpdate={updateScannedItem}
                label="SKU"
            />

            <ConflictResolverDialog
                open={conflictDialog.open}
                onOpenChange={(o) => { if (!o) { setConflictDialog(prev => ({ ...prev, open: false })); focusInput(); } }}
                title={conflictDialog.title}
                options={conflictDialog.options}
                onSelect={conflictDialog.onSelect}
            />

            <BillSummaryDialog
                open={summaryDialogOpen}
                onOpenChange={(o) => { if (!o) { setSummaryDialogOpen(false); focusInput(); } }}
                items={mismatchData}
                onDownload={handleDownloadSummary}
            />
        </div>
    );
}
