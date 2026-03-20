import React, { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { Loader2, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { dataProvider } from "@/lib/dataprovider";
import { useNotification } from "@refinedev/core";
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { EditItemDialog } from "@/components/scan/edit-item-dialog";
import { ScanConfirmationAlert } from "@/components/scan/scan-confirmation-alert";
import { SaveConfirmationDialog } from "@/components/scan/save-confirmation-dialog";
import { ScannedItemsTable, QtyMap } from "@/components/scan/scanned-items-table";
import { useScanLogic } from "@/hooks/use-scan-logic";
import { BarcodeInputSales, SuggestionOption } from "@/components/scan/barcode-input-sales";
import { downloadFromFilePath } from "@/lib/download";
import { AddBarcodeDialog } from "@/components/scan/add-barcode-dialog";
import { CBUVerificationDialog } from "@/components/scan/cbu-verification-dialog";
import { NegativeQuantityDialog } from "@/components/scan/negative-quantity-dialog";
import { BarcodeCaseDialog } from "@/components/scan/barcode-case-dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

export interface SalesScanSummary {
    id: string | number;
    status: boolean;
    bill_no: string;
    party_name: string;
    is_posted: boolean;
    box_count: number;
    mismatches?: MismatchItem[];
    bill_date?: string;
    scanned_time?: string;
}

export interface SalesScanDetail {
    id: string | number;
    status: boolean;
    party_name: string;
    is_posted: boolean;
    bill_qty_map: QtyMap;
    case_config: Record<string, number>;
    box_count: number;
    barcode_map: Record<string, string[]>;
    cbu_map: Record<string, string[]>;
    sku_name_map?: Record<string, string>;
    mismatches?: MismatchItem[];
    bill_date?: string;
    scanned_time?: string;
    logs?: ScanLogItem[][] | ScanLogItem[];
}

export interface MismatchItem {
    sku: string;
    name?: string;
    mrp: number;
    billed: number;
    scanned: number;
}

interface ScanLogItem {
    type: string;
    sku?: string;
    value: string | number;
    desc: string;
    timestamp: any;
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
                            className="justify-start h-auto py-2 px-4 w-full whitespace-normal"
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

export function BillSummaryDialog({ open, onOpenChange, detail, items, onDownload, onDownloadVideo, isVideoLoading }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    detail?: SalesScanDetail | SalesScanSummary | null;
    items: MismatchItem[];
    onDownload: () => void;
    onDownloadVideo?: (timestamp?: any) => Promise<void>;
    isVideoLoading?: boolean;
}) {
    const flattenedLogs = useMemo(() => {
        if (!detail || !("logs" in detail) || !detail.logs) return [];
        return detail.logs.flat();
    }, [detail]);

    if (!open) return null;
    const partyName = detail?.party_name;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[90vw] lg:max-w-6xl w-[95vw] max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-4 border-b">
                    <div className="flex justify-between items-center pr-10">
                        <div>
                            <DialogTitle>Details</DialogTitle>
                            {partyName && <div className="text-xs text-muted-foreground mt-0.5">{partyName}</div>}
                        </div>
                        <div className="flex gap-2">
                            {onDownloadVideo && (
                                <Button onClick={onDownloadVideo} variant="outline" size="sm" disabled={isVideoLoading}>
                                    {isVideoLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                                    {isVideoLoading ? "Processing..." : "Download Video"}
                                </Button>
                            )}
                            <Button onClick={onDownload} variant="secondary" size="sm">
                                Download PDF
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <Tabs defaultValue="mismatch" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 pt-2 border-b">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="mismatch">Mismatch</TabsTrigger>
                            <TabsTrigger value="detail">Detail</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="mismatch" className="flex-1 overflow-auto p-4 space-y-3 mt-0">
                        {items.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No mismatches found
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
                    </TabsContent>

                    <TabsContent value="detail" className="flex-1 overflow-auto p-0 mt-0">
                        {flattenedLogs.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground px-4">
                                No logs found
                            </div>
                        ) : (
                            <div className="border-rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="text-xs uppercase bg-muted/50">
                                            <TableHead className="h-10 px-4">Time</TableHead>
                                            <TableHead className="h-10 px-4">Product</TableHead>
                                            <TableHead className="h-10 px-4">MRP</TableHead>
                                            <TableHead className="h-10 px-4">Type</TableHead>
                                            <TableHead className="h-10 px-4 text-center">Action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {flattenedLogs.map((log, idx) => {
                                            const productName = log.sku && detail && ("sku_name_map" in detail) ? detail.sku_name_map?.[log.sku] : null;
                                            const mrps = log.sku && detail && ("bill_qty_map" in detail) ? Object.keys(detail.bill_qty_map[log.sku] || {}) : [];
                                            const mrpDisplay = mrps.length > 0 ? `₹${mrps.join(", ")}` : "-";

                                            const formattedTime = log.timestamp ? (typeof log.timestamp === "number" || !isNaN(Number(log.timestamp)) ? format(new Date(Number(log.timestamp)), "HH:mm:ss") : log.timestamp) : "-";

                                            return (
                                                <TableRow key={idx} className="text-sm hover:bg-muted/30">
                                                    <TableCell className="py-3 px-4 whitespace-nowrap">{formattedTime}</TableCell>
                                                    <TableCell className="py-3 px-4 min-w-[200px]">
                                                        <div className="font-medium">{productName || log.sku || "-"}</div>
                                                        {productName && <div className="text-xs text-muted-foreground">{log.sku}</div>}
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 font-mono">{mrpDisplay}</TableCell>
                                                    <TableCell className="py-3 px-4">
                                                        <span className="bg-muted px-2 py-1 rounded text-xs font-bold">{log.type}</span>
                                                    </TableCell>
                                                    <TableCell className="py-3 px-4 text-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            onClick={() => onDownloadVideo?.(log.timestamp)}
                                                            disabled={isVideoLoading}
                                                            title="Download video for this log"
                                                        >
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </TabsContent>

                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

interface ScanningInterfaceProps {
    scanId: string;
    billNo: string;
    onBack: () => void;
}

export function ScanningInterface({ scanId, billNo, onBack }: ScanningInterfaceProps) {
    const { open } = useNotification();
    const [config, setConfig] = useState<SalesScanDetail | null>(null);

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

    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        description: React.ReactNode;
        onConfirm: () => void;
        extraAction?: { label: string; onClick: () => void };
    } | null>(null);
    const [alertOpen, setAlertOpen] = useState(false);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [conflictDialog, setConflictDialog] = useState<{
        open: boolean;
        title: string;
        options: { label: string; value: any }[];
        onSelect: (value: any) => void;
    }>({ open: false, title: "", options: [], onSelect: () => { } });

    // New Features States
    const [scanLogs, setScanLogs] = useState<ScanLogItem[]>([]);
    const [addBarcodeDialog, setAddBarcodeDialog] = useState<{ open: boolean, barcode: string }>({ open: false, barcode: "" });

    // Summary Dialog State
    const [summaryDialogOpen, setSummaryDialogOpen] = useState(false);
    const [mismatchData, setMismatchData] = useState<MismatchItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isVideoLoading, setIsVideoLoading] = useState(false);
    const [cbuVerificationDialog, setCbuVerificationDialog] = useState<{
        open: boolean;
        sku: string;
        productName: string;
        mrp: number;
        expectedCbus: string[];
        caseQty: number;
    }>({ open: false, sku: "", productName: "", mrp: 0, expectedCbus: [], caseQty: 0 });

    const [negativeQuantityDialog, setNegativeQuantityDialog] = useState<{
        open: boolean;
        sku: string;
        productName: string;
        mrp: number;
        qty: number;
        isAdd: boolean;
        logData?: { type: string, value: string | number, desc: string };
    }>({ open: false, sku: "", productName: "", mrp: 0, qty: 0, isAdd: false });

    const [barcodeCaseDialog, setBarcodeCaseDialog] = useState<{
        open: boolean;
        sku: string;
        productName: string;
        mrp: number;
        caseQty: number;
        type: string;
        value: string;
    }>({ open: false, sku: "", productName: "", mrp: 0, caseQty: 0, type: "", value: "" });

    const inputRef = useRef<HTMLInputElement>(null);
    const form = useForm({ defaultValues: { input: "" } });

    const focusInput = () => setTimeout(() => inputRef.current?.focus(), 300);

    // Calculate total items in current box
    const currentBoxTotal = useMemo(() => {
        return Object.values(currentScanned).reduce((acc, m) => acc + Object.values(m).reduce((s, q) => s + q, 0), 0);
    }, [currentScanned]);

    // Helpers
    const getInvoiceItem = (sku: string) => config?.bill_qty_map[sku];

    const addLog = (type: string, value: string | number, desc: string, sku?: string) => {
        setScanLogs(prev => [...prev, {
            type,
            sku,
            value,
            desc,
            timestamp: Date.now()
        }]);
    };

    // Wrapper for updateScannedItem to include logging and negative qty check
    const handleUpdateScannedItem = (sku: string, mrp: number, qty: number, isAdd: boolean, logData?: { type: string, value: string | number, desc: string }) => {
        if (isAdd && config) {
            const billedQty = config.bill_qty_map[sku]?.[mrp] || 0;
            const otherScannedQty = otherScanned[sku]?.[mrp] || 0;
            const currentScannedQty = currentScanned[sku]?.[mrp] || 0;
            const remQty = billedQty - (otherScannedQty + currentScannedQty);

            if (remQty - qty < 0) {
                setNegativeQuantityDialog({
                    open: true,
                    sku,
                    productName: config.sku_name_map?.[sku] || sku,
                    mrp,
                    qty,
                    isAdd,
                    logData
                });
                return;
            }
        }

        updateScannedItem(sku, mrp, qty, isAdd);
        if (isAdd && logData) {
            addLog(logData.type, logData.value, logData.desc, sku);
        }
    };


    const handleDownloadVideo = async (timestamp?: any) => {
        if (!scanId) return;
        setIsVideoLoading(true);
        try {
            const res = await dataProvider.custom({
                url: "video_process/",
                method: "post",
                payload: {
                    scan_id: scanId,
                    ...(timestamp && { timestamp })
                }
            });
            if (res.data?.filepath) {
                await downloadFromFilePath(res.data.filepath);
                open?.({ type: "success", message: "Video Processed and Downloaded" });
            } else {
                open?.({ type: "error", message: "Video processing failed" });
            }
        } catch (error) {
            open?.({ type: "error", message: "Video Processing Error" });
        } finally {
            setIsVideoLoading(false);
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
            // Refresh detail to get latest logs
            dataProvider.getOne({
                resource: "sales_scan",
                id: scanId,
            }).then((res) => {
                setConfig(res.data as SalesScanDetail);
            });

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
        if (scanId) {
            dataProvider.getOne({
                resource: "sales_scan",
                id: scanId,
            }).then((res) => {
                setConfig(res.data as SalesScanDetail);
                setBox(res.data.box_count);
                setMaxBox(res.data.box_count);
            });
        }
    }, [scanId]);

    useEffect(() => {
        if (!box || !scanId) return;
        dataProvider.custom({
            url: "sales_box",
            method: "get",
            query: { box_no: box, scan_id: scanId }
        }).then((res) => {
            setOtherScanned(res.data.others_scanned || {});
            setCurrentScanned(res.data.current_scanned || {});
            setScanLogs([]); // Reset logs when box changes/loads
        });
    }, [box, scanId]);

    // Navigation Guards
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (currentBoxTotal > 0) {
                e.preventDefault();
                e.returnValue = ""; // Standard way to trigger browser confirmation
            }
        };

        const handlePopState = () => {
            if (currentBoxTotal > 0) {
                if (window.confirm("You have unsaved scans in this box. Are you sure you want to exit?")) {
                    // User clicked OK, we let them go back.
                } else {
                    // User clicked Cancel, we push the state back to keep them here.
                    window.history.pushState(null, "", window.location.href);
                }
            }
        };

        // Push initial state to handle back button interceptionfed
        window.history.pushState(null, "", window.location.href);

        window.addEventListener("beforeunload", handleBeforeUnload);
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
            window.removeEventListener("popstate", handlePopState);
        };
    }, [currentBoxTotal]);


    const handlePotentialMatches = (matches: { sku: string; mrp: number }[], qty: number = 1, type: string, data: string) => {
        if (matches.length === 0) {
            return;
        } else if (matches.length === 1) {
            const { sku, mrp } = matches[0];
            if (type === "scan_barcode") {
                const caseQty = config?.case_config?.[sku] || 0;
                const billedQty = config?.bill_qty_map[sku]?.[mrp] || 0;
                const otherScannedQty = otherScanned[sku]?.[mrp] || 0;
                const currentScannedQty = currentScanned[sku]?.[mrp] || 0;
                const remQty = billedQty - (otherScannedQty + currentScannedQty);

                if (caseQty > 1 && remQty >= caseQty) {
                    setBarcodeCaseDialog({
                        open: true,
                        sku,
                        productName: config?.sku_name_map?.[sku] || sku,
                        mrp,
                        caseQty,
                        type,
                        value: data
                    });
                    return;
                }
            }
            handleUpdateScannedItem(sku, mrp, qty, true, { type, value: data, desc: `Scanned ${type === "scan_barcode" ? "barcode" : "CBU"}: ${data}` });
        } else {
            setConflictDialog({
                open: true,
                title: "Select Product",
                options: matches.map(o => {
                    const name = config?.sku_name_map?.[o.sku];
                    return {
                        label: `${o.sku} ${name ? `(${name})` : ""} - Rs. ${o.mrp}`,
                        value: o
                    };
                }),
                onSelect: (val) => {
                    if (type === "scan_barcode") {
                        const { sku, mrp } = val;
                        const caseQty = config?.case_config?.[sku] || 0;
                        const billedQty = config?.bill_qty_map[sku]?.[mrp] || 0;
                        const otherScannedQty = otherScanned[sku]?.[mrp] || 0;
                        const currentScannedQty = currentScanned[sku]?.[mrp] || 0;
                        const remQty = billedQty - (otherScannedQty + currentScannedQty);

                        if (caseQty > 1 && remQty >= caseQty) {
                            setBarcodeCaseDialog({
                                open: true,
                                sku,
                                productName: config?.sku_name_map?.[sku] || sku,
                                mrp,
                                caseQty,
                                type,
                                value: data
                            });
                            return;
                        }
                    }
                    handleUpdateScannedItem(val.sku, val.mrp, qty, true, { type, value: data, desc: `Selected ${val.sku} from multiple matches for ${type === "scan_barcode" ? "barcode" : "CBU"}: ${data}` })
                }
            });
        }
    };

    const processInput = async (input: string) => {
        input = input.trim();
        if (!input || !config) return;

        // --- CBU Detection ---
        let cbuCode = input;
        const isCbu = input.length > 20 && input.includes("(241)");

        if (isCbu) {
            if (input.includes("(241)") && input.includes("(10)")) {
                try {
                    cbuCode = input.split("(241)")[1].split("(10)")[0].trim().toUpperCase();
                } catch (e) {
                    console.error("Error parsing GS1 CBU", e);
                }
            }

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
                    return;
                }

                const validOptions: { sku: string; mrp: number }[] = [];
                let detectedCaseQty = 0;

                skuList.forEach(sku => {
                    if (config.bill_qty_map[sku]) {
                        const q = config.case_config?.[sku];
                        if (q && detectedCaseQty === 0) detectedCaseQty = q;
                        Object.keys(config.bill_qty_map[sku]).forEach(mrp => {
                            validOptions.push({ sku, mrp: Number(mrp) });
                        });
                    }
                });

                if (validOptions.length > 0) {
                    handlePotentialMatches(validOptions, detectedCaseQty || 1, "scan_cbu", input);
                } else {
                    addLog("product_not_in_bill", input, `CBU ${input} mapped SKUs not in this bill`);
                    setAlertConfig({
                        title: "SKU Not in Invoice",
                        description: `CBU mapped SKUs (${skuList.join(", ")}) not found in this bill.`,
                        onConfirm: () => { }
                    });
                    setAlertOpen(true);
                }
                return;
            } else {
                addLog("unknown_cbu", input, `Scanned unknown CBU: ${input}`);
                setAlertConfig({
                    title: "Unknown Scan",
                    description: "Unknown CBU Code.",
                    onConfirm: () => { }
                });
                setAlertOpen(true);
                return;
            }
        }

        // --- Barcode Detection ---
        // Assume non-CBU logic treats as potential Barcode or Manual fallback

        // 1. Check Local Config
        if (config.barcode_map[input]) {
            const skus = config.barcode_map[input];
            const validOptions: { sku: string; mrp: number }[] = [];
            skus.forEach(sku => {
                if (config.bill_qty_map[sku]) {
                    Object.keys(config.bill_qty_map[sku]).forEach(mrp => {
                        validOptions.push({ sku, mrp: Number(mrp) });
                    });
                }
            });
            // Recognized barcode will always be in bill
            handlePotentialMatches(validOptions, 1, "scan_barcode", input);
            return;
        }

        // 2. Not in Local Config -> API Lookup
        try {
            const res = await dataProvider.custom({
                url: "barcode/",
                method: "get",
                query: { code: input }
            });

            // Expected response: { products: [{ sku: string, mrp: number, name: string }], basepack: string | null }
            const responseData = res.data || { products: [], basepack: null };
            const products: { sku: string, mrp: number, name?: string }[] = responseData.products || [];
            const basepack = responseData.basepack;

            if (basepack === null) {
                // No products found or truly unknown
                addLog("unknown_barcode", input, `Scanned unknown barcode: ${input}`);
                setAddBarcodeDialog({ open: true, barcode: input });
            } else {
                // basepack is not null -> found products
                if (products.length > 0) {
                    // Update local name map
                    if (config) {
                        const newNameMap = { ...config.sku_name_map };
                        products.forEach(item => {
                            if (item.name && !newNameMap[item.sku]) {
                                newNameMap[item.sku] = item.name.trim();
                            }
                        });
                        setConfig({ ...config, sku_name_map: newNameMap });
                    }

                    // Check if any product is in the current bill
                    const validOptions = products.filter(item =>
                        config.bill_qty_map[item.sku] &&
                        config.bill_qty_map[item.sku][item.mrp] !== undefined
                    );

                    if (validOptions.length > 0) {
                        handlePotentialMatches(validOptions, 1, "scan_barcode", input);
                    } else {
                        // SKU matches exist but NOT in this bill
                        const first = products[0];
                        addLog("product_not_in_bill", input, `Barcode ${input} (SKU: ${first.sku}) not in this bill`);
                        setAlertConfig({
                            title: "Product Not in Bill",
                            description: (
                                <div className="space-y-2 mt-2">
                                    <div className="text-sm font-medium">Scanned: {input}</div>
                                    <div className="p-3 bg-muted rounded-lg border">
                                        <div className="font-bold text-primary">{first.sku}</div>
                                        <div className="text-xs text-muted-foreground uppercase mt-1 leading-tight">{first.name}</div>
                                        <div className="text-sm font-semibold mt-2">MRP: ₹{first.mrp}</div>
                                    </div>
                                    <div className="text-xs text-destructive font-medium mt-1">
                                        This product is listed in the master but is not present in the current bill.
                                    </div>
                                </div>
                            ),
                            onConfirm: () => { },
                            extraAction: {
                                label: "Is this Other product?",
                                onClick: () => setAddBarcodeDialog({ open: true, barcode: input })
                            }
                        });
                        setAlertOpen(true);
                    }
                } else {
                    // basepack not null but products empty? fallback to dialog
                    setAddBarcodeDialog({ open: true, barcode: input });
                }
            }
        } catch (error) {
            // API Error or 404
            setAddBarcodeDialog({ open: true, barcode: input });
        }
    };

    const handleScan = (input: string) => {
        processInput(input);
        form.setValue("input", "");
    };

    const handleManualSelect = (option: SuggestionOption, searchTerm: string) => {
        const sku = option.value.sku;
        const mrp = option.value.mrp;
        const caseQty = config?.case_config?.[sku];
        const billedQty = config?.bill_qty_map?.[sku]?.[mrp] || 0;

        if (caseQty && caseQty <= billedQty) {
            // Find all expected CBUs for this SKU
            const expectedCbus: string[] = [];
            if (config?.cbu_map) {
                Object.entries(config.cbu_map).forEach(([cbu, skus]) => {
                    if (skus.includes(sku)) {
                        expectedCbus.push(cbu);
                    }
                });
            }

            // Optimization: If the user searched by the exact CBU, skip the dialog
            const normalizedSearch = searchTerm.trim().toUpperCase();
            const isCbuSearch = expectedCbus.some(cbu => cbu.trim().toUpperCase() === normalizedSearch);

            if (isCbuSearch) {
                handleUpdateScannedItem(sku, mrp, caseQty, true, {
                    type: "manual_cbu",
                    value: sku,
                    desc: `Added case of ${sku} via direct CBU search`
                });
                focusInput();
            } else {
                setCbuVerificationDialog({
                    open: true,
                    sku,
                    productName: config.sku_name_map?.[sku] || sku,
                    mrp,
                    expectedCbus,
                    caseQty
                });
            }
        } else {
            handleUpdateScannedItem(sku, mrp, 1, true, {
                type: "manual_piece",
                value: sku,
                desc: `Added single unit of ${sku} via manual selection`
            });
            focusInput();
        }
    };


    const suggestions = useMemo(() => {
        if (!config) return [];
        const options: SuggestionOption[] = [];

        // Create a reverse mapping of SKU to CBUs for faster lookup
        const skuToCbus: Record<string, string[]> = {};
        if (config.cbu_map) {
            Object.entries(config.cbu_map).forEach(([cbu, skus]) => {
                skus.forEach(sku => {
                    if (!skuToCbus[sku]) skuToCbus[sku] = [];
                    if (!skuToCbus[sku].includes(cbu)) skuToCbus[sku].push(cbu);
                });
            });
        }

        Object.entries(config.bill_qty_map).forEach(([sku, mrpMap]) => {
            const name = config.sku_name_map?.[sku];
            const cbusForSku = skuToCbus[sku] || [];
            const cbuString = cbusForSku.length > 0 ? ` (CBU: ${cbusForSku.join(", ")})` : "";

            Object.keys(mrpMap).forEach(mrp => {
                options.push({
                    label: `${sku} ${name ? `- ${name}` : ""} - ₹${mrp}${cbuString}`,
                    value: { sku, mrp: Number(mrp), name }
                });
            });
        });
        return options;
    }, [config]);

    return (
        <div className="flex flex-col gap-4 max-w-sm mx-auto">

            <div className="flex items-center justify-between bg-muted/50 p-3 rounded-lg border">
                <div
                    className="text-xl font-bold font-mono cursor-pointer hover:underline text-blue-600"
                    onClick={handleBillClick}
                    title="Click to View Summary"
                >
                    {billNo?.toUpperCase()}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        if (currentBoxTotal > 0) {
                            if (window.confirm("You have unsaved scans in this box. Are you sure you want to exit?")) {
                                onBack();
                            }
                        } else {
                            onBack();
                        }
                    }}
                    className="h-8 hover:bg-red-100 hover:text-red-600"
                >
                    Exit
                </Button>
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
                        <BarcodeInputSales
                            value={form.watch("input")}
                            onChange={(val) => form.setValue("input", val)}
                            onScan={handleScan}
                            onManualSelect={handleManualSelect}
                            options={suggestions}
                            placeholder="Scan / Type SKU"
                            inputRefProp={inputRef}
                        />
                    </div>
                    {/* <Button type="button" onClick={() => handleScan(form.getValues("input"))} className="h-12 w-20">
                        Enter
                    </Button> */}
                </div>
                <div className="text-center font-bold text-lg">Total Scanned: {scannedCount}</div>
            </form>

            <ScannedItemsTable
                items={flattenedScannedItems}
                purchase={config?.bill_qty_map || {}}
                otherScanned={otherScanned}
                onEdit={setEditingItem}
                label="SKU"
            />

            <Button
                onClick={() => setSaveDialogOpen(true)}
                disabled={currentBoxTotal === 0 || isSaving}
                className="bg-green-500 h-12 text-lg w-[50%] mx-auto mt-2 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
                {isSaving ? "Saving..." : "Save Box"}
            </Button>

            <ScanConfirmationAlert
                open={alertOpen}
                onOpenChange={(o) => { if (!o) { setAlertOpen(false); focusInput(); } }}
                title={alertConfig?.title}
                description={alertConfig?.description}
                onConfirm={alertConfig?.onConfirm || (() => { })}
                extraAction={alertConfig?.extraAction}
            />

            <BarcodeCaseDialog
                open={barcodeCaseDialog.open}
                onOpenChange={(o) => setBarcodeCaseDialog(prev => ({ ...prev, open: o }))}
                sku={barcodeCaseDialog.sku}
                productName={barcodeCaseDialog.productName}
                mrp={barcodeCaseDialog.mrp}
                caseQty={barcodeCaseDialog.caseQty}
                onSelect={(isCase) => {
                    const finalQty = isCase ? barcodeCaseDialog.caseQty : 1;
                    handleUpdateScannedItem(
                        barcodeCaseDialog.sku,
                        barcodeCaseDialog.mrp,
                        finalQty,
                        true,
                        {
                            type: barcodeCaseDialog.type,
                            value: barcodeCaseDialog.value,
                            desc: `Added ${isCase ? "Case" : "Piece"} of ${barcodeCaseDialog.sku}`
                        }
                    );
                    focusInput();
                }}
            />

            <SaveConfirmationDialog
                open={saveDialogOpen}
                onOpenChange={(o) => { if (!isSaving) setSaveDialogOpen(o); if (!o) focusInput(); }}
                loading={isSaving}
                onConfirm={(qty) => {
                    if (qty === currentBoxTotal) {
                        setIsSaving(true);
                        dataProvider.custom({
                            url: "sales_box/",
                            method: "post",
                            payload: {
                                box_no: box,
                                scan_id: scanId,
                                scanned: currentScanned,
                                logs: scanLogs
                            }
                        }).then((res) => {
                            setCurrentScanned({});
                            setScanLogs([]);
                            if (res.data.box_no) {
                                setBox(res.data.box_no);
                                setMaxBox(res.data.box_no);
                            }
                            setSaveDialogOpen(false);
                            focusInput();
                            open?.({ type: "success", message: "Box Saved" });
                        }).catch(() => {
                            open?.({ type: "error", message: "Failed to save box" });
                        }).finally(() => {
                            setIsSaving(false);
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
                onUpdate={(sku, mrp, qty, isAdd) => {
                    //allow qty increase only if mrp < 50
                    if (editingItem && qty > editingItem.qty && editingItem.mrp > 50) {
                        open?.({ type: "error", message: "Quantity increase not allowed for MRP > 50. Only decreasing is permitted." });
                        return;
                    }
                    if (editingItem && !isAdd) {
                        addLog("edit_qty", qty, `Manually adjusted quantity of ${sku} from ${editingItem.qty} to ${qty}`, sku);
                    }
                    handleUpdateScannedItem(sku, mrp, qty, isAdd);
                }}
                label="SKU"
            />

            <ConflictResolverDialog
                open={conflictDialog.open}
                onOpenChange={(o) => { if (!o) { setConflictDialog(prev => ({ ...prev, open: false })); focusInput(); } }}
                title={conflictDialog.title}
                options={conflictDialog.options}
                onSelect={conflictDialog.onSelect} // This calls regular updateScannedItem logic, handled inside
            />

            <BillSummaryDialog
                open={summaryDialogOpen}
                onOpenChange={(o) => { if (!o) { setSummaryDialogOpen(false); focusInput(); } }}
                detail={config}
                items={mismatchData}
                onDownload={handleDownloadSummary}
                onDownloadVideo={handleDownloadVideo}
                isVideoLoading={isVideoLoading}
            />

            <AddBarcodeDialog
                open={addBarcodeDialog.open}
                onOpenChange={(open) => {
                    if (!open) {
                        setAddBarcodeDialog(prev => ({ ...prev, open: false }));
                        focusInput();
                    }
                }}
                barcode={addBarcodeDialog.barcode}
                invoiceMap={config?.bill_qty_map || {}}
                skuNameMap={config?.sku_name_map}
                onSuccess={(sku, mrp) => {
                    // Update local barcode map and process the item
                    if (config) {
                        const newBarcodeMap = { ...(config.barcode_map || {}) };
                        if (!newBarcodeMap[addBarcodeDialog.barcode]) {
                            newBarcodeMap[addBarcodeDialog.barcode] = [];
                        }
                        if (!newBarcodeMap[addBarcodeDialog.barcode].includes(sku)) {
                            newBarcodeMap[addBarcodeDialog.barcode].push(sku);
                        }

                        setConfig({
                            ...config,
                            barcode_map: newBarcodeMap
                        });

                        // Directly add the item as we know it's valid (selected from bill)
                        addLog("barcode_mapping", addBarcodeDialog.barcode, `Mapped barcode ${addBarcodeDialog.barcode} to SKU ${sku}`, sku);
                        handleUpdateScannedItem(sku, mrp, 1, true, {
                            type: "scan_barcode",
                            value: addBarcodeDialog.barcode,
                            desc: `Scanned newly mapped barcode: ${addBarcodeDialog.barcode}`
                        });
                    }
                }}
            />

            <CBUVerificationDialog
                open={cbuVerificationDialog.open}
                onOpenChange={(open) => {
                    if (!open) {
                        setCbuVerificationDialog(prev => ({ ...prev, open: false }));
                        focusInput();
                    }
                }}
                sku={cbuVerificationDialog.sku}
                productName={cbuVerificationDialog.productName}
                mrp={cbuVerificationDialog.mrp}
                expectedCbus={cbuVerificationDialog.expectedCbus}
                onVerified={(sku, mrp) => {
                    handleUpdateScannedItem(sku, mrp, cbuVerificationDialog.caseQty, true, {
                        type: "manual_cbu",
                        value: sku,
                        desc: `Added case of ${sku} after CBU verification`
                    });
                }}
            />

            <NegativeQuantityDialog
                open={negativeQuantityDialog.open}
                onOpenChange={(open) => setNegativeQuantityDialog(prev => ({ ...prev, open }))}
                sku={negativeQuantityDialog.sku}
                productName={negativeQuantityDialog.productName}
                mrp={negativeQuantityDialog.mrp}
                onConfirm={() => {
                    updateScannedItem(negativeQuantityDialog.sku, negativeQuantityDialog.mrp, negativeQuantityDialog.qty, negativeQuantityDialog.isAdd);
                    if (negativeQuantityDialog.isAdd && negativeQuantityDialog.logData) {
                        addLog(negativeQuantityDialog.logData.type, negativeQuantityDialog.logData.value, `${negativeQuantityDialog.logData.desc} (Forced negative addition confirmed)`, negativeQuantityDialog.sku);
                    }
                    focusInput();
                }}
            />
        </div >
    );
}
