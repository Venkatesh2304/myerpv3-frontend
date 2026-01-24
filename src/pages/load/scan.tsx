import * as React from "react"
import { Check, ScanBarcode, X, Pencil, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { useEffect, useMemo } from "react"
import { dataProvider } from "@/lib/dataprovider";
import { useCompany } from "@/providers/company-provider";
import { useCustom, useNotification } from "@refinedev/core"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface QtyMap {
    [cbu: string]: {
        [mrp: number]: number;
    };
}

interface EditItemDialogProps {
    item: { cbu: string; mrp: number; qty: number } | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: (cbu: string, mrp: number, qty: number, isAddition: boolean) => void;
}

function EditItemDialog({ item, open, onOpenChange, onUpdate }: EditItemDialogProps) {
    const [newQty, setNewQty] = React.useState("");

    useEffect(() => {
        if (open) {
            setNewQty("");
        }
    }, [open]);

    const handleSave = () => {
        if (newQty && !isNaN(Number(newQty)) && item) {
            onUpdate(item.cbu, item.mrp, Number(newQty), false);
        }
        onOpenChange(false);
    };

    const handleDelete = () => {
        if (item) {
            onUpdate(item.cbu, item.mrp, 0, false);
            onOpenChange(false);
        }
    };

    if (!item) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Quantity</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="cbu" className="text-right">
                            CBU
                        </Label>
                        <Input
                            id="cbu"
                            value={item.cbu}
                            readOnly
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="mrp" className="text-right">
                            MRP
                        </Label>
                        <Input
                            id="mrp"
                            value={item.mrp}
                            readOnly
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="old-qty" className="text-right">
                            Old Qty
                        </Label>
                        <Input
                            id="old-qty"
                            value={item.qty}
                            readOnly
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="new-qty" className="text-right">
                            New Qty
                        </Label>
                        <Input
                            id="new-qty"
                            value={newQty}
                            onChange={(e) => setNewQty(e.target.value)}
                            placeholder="Enter new quantity"
                            className="col-span-3 h-15"
                            type="number"
                        />
                    </div>
                </div>
                <DialogFooter className="flex flex-row justify-between">
                    <Button className="h-12 w-25" variant="destructive" onClick={handleDelete}>Delete</Button>
                    <Button className="h-12 w-25 bg-green-500" onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

interface ScanConfirmationAlertProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: string;
    description?: string;
    onConfirm: () => void;
}

function ScanConfirmationAlert({ open, onOpenChange, title, description, onConfirm }: ScanConfirmationAlertProps) {
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio("/notification.mp3");
    }, []);

    useEffect(() => {
        if (open) {
            window.alert("Sound : " + (title || "") + ", " + (description || ""));
            // audioRef.current?.play().catch(e => console.error("Error playing sound", e));
        }
    }, [open]);

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-row justify-between">
                    <AlertDialogCancel className="h-12 w-24 bg-red-500 text-white">Cancel</AlertDialogCancel>
                    <AlertDialogAction className="h-12 w-24 bg-green-500" onClick={onConfirm}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

interface SaveConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (qty: number) => void;
}

function SaveConfirmationDialog({ open, onOpenChange, onConfirm }: SaveConfirmationDialogProps) {
    const [qty, setQty] = React.useState("");

    useEffect(() => {
        if (open) {
            setQty("");
        }
    }, [open]);

    const handleConfirm = () => {
        if (qty && !isNaN(Number(qty))) {
            onConfirm(Number(qty));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Confirm Box Total</DialogTitle>
                    <DialogDescription>
                        Please enter the total number of cases to confirm.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="total-qty" className="text-right">
                            Total Qty
                        </Label>
                        <Input
                            id="total-qty"
                            value={qty}
                            onChange={(e) => setQty(e.target.value)}
                            placeholder="Enter total quantity"
                            className="col-span-3 h-12"
                            type="number"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleConfirm();
                                }
                            }}
                        />
                    </div>
                </div>
                <DialogFooter className="flex flex-row justify-between">
                    <Button className="h-12 w-24 bg-red-500 text-white" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button className="h-12 w-24 bg-green-500" onClick={handleConfirm}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function ScanLoadPage() {
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
    const [box, setBox] = React.useState<any>(null);
    const [maxBox, setMaxBox] = React.useState<any>(null);
    const [purchase, setPurchase] = React.useState<QtyMap>({});
    const [otherScanned, setOtherScanned] = React.useState<QtyMap>({});
    const [currentScanned, setCurrentScanned] = React.useState<QtyMap>({});
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
            setPurchase(res.data.purchase_qty_map);
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

    const updateScannedItem = (cbu: string, mrp: number, qty: number, isAddition: boolean) => {
        setCurrentScanned((prev) => {
            const currentQty = prev?.[cbu]?.[mrp] || 0;
            const newQty = isAddition ? currentQty + qty : qty;

            if (newQty <= 0) {
                const newState = { ...prev };
                if (newState[cbu]) {
                    const newMrpMap = { ...newState[cbu] };
                    delete newMrpMap[mrp];
                    if (Object.keys(newMrpMap).length === 0) {
                        delete newState[cbu];
                    } else {
                        newState[cbu] = newMrpMap;
                    }
                }
                return newState;
            }

            return {
                ...prev,
                [cbu]: {
                    ...prev[cbu],
                    [mrp]: newQty
                }
            };
        });
    };

    const onAdd = (data: any) => {
        const cbu = data.cbu;
        const mrp = Number(data.mrp);
        const qty = Number(data.qty);

        if (!purchase[cbu]) {
            setAlertConfig({
                title: "Product not in purchase " + cbu,
                description: "This product is not in purchase. Confirm add?",
                onConfirm: () => updateScannedItem(cbu, mrp, qty, true)
            });
            setAlertOpen(true);
            return;
        } else if (!purchase[cbu][mrp]) {
            setAlertConfig({
                title: "MRP not in purchase",
                description: "This MRP is not present in purchase. Confirm is correct?",
                onConfirm: () => updateScannedItem(cbu, mrp, qty, true)
            });
            setAlertOpen(true);
            return;
        } else {
            updateScannedItem(cbu, mrp, qty, true);
        }
        form.reset();
        focusInput();
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter') || (e.currentTarget.value?.endsWith("\n")) || (e.currentTarget.value?.endsWith("\r"))) {
            const value = e.currentTarget.value;
            //Basic check to see if it looks like the barcode format
            if (value.includes("(241)") && value.includes("(10)") && value.includes("(90)") && value.includes("(21)")) {
                e.preventDefault();
                try {
                    const cbu = value.split("(241)")[1].split("(10)")[0].trim().toUpperCase();
                    const mrp = Number(value.split("(90)")[1].split("(21)")[0].trim());
                    if (cbu && !isNaN(mrp)) {
                        onAdd({ cbu, mrp, qty: 1 });
                    }
                } catch (err) {
                    console.error("Failed to parse barcode", err);
                }
            }
        }
    };

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

    const flattenedScannedItems = useMemo(() => (
        Object.entries(currentScanned).flatMap(([cbu, mrps]) =>
            Object.entries(mrps).map(([mrp, qty]) => ({
                cbu,
                mrp: Number(mrp),
                qty,
            }))
        )
    ), [currentScanned]);

    const cbuValue = form.watch("cbu");
    const [showSuggestions, setShowSuggestions] = React.useState(false);

    const suggestions = useMemo(() => {
        if (!cbuValue || (cbuValue?.length < 3)) return [];
        return Object.keys(purchase).filter((key) =>
            key.toLowerCase().includes(cbuValue.toLowerCase())
        );
    }, [cbuValue, purchase]);

    return (
        <>
            <div className="flex flex-col gap-4 max-w-sm">
                <div className="flex gap-4">
                    <Label className="w-fit-content">Box No:</Label>
                    <Input className="w-24" value={box || ""} onChange={(e) => {
                        const value = Number(e.target.value);
                        console.log(maxBox)
                        if (value > maxBox) {
                            open?.({
                                type: "error",
                                message: "Box No is greater than max box",
                            });
                            return;
                        }
                        setBox(e.target.value);
                    }} />
                    <Label className="w-fit-content ml-auto font-normal">Last Box: {maxBox}</Label>
                </div>
                <form onSubmit={form.handleSubmit(onAdd)} className="flex gap-3 flex-col relative">
                    <div className="relative">
                        <Input
                            className="h-12"
                            placeholder="CBU"
                            autoFocus={true}
                            {...form.register("cbu")}
                            onFocus={() => setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay to allow click
                            autoComplete="off"
                            onKeyDown={handleKeyDown}
                            ref={(e) => {
                                form.register("cbu").ref(e);
                                cbuInputRef.current = e;
                            }}
                        />
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border border-black-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                                {suggestions.map((suggestion) => (
                                    <div
                                        key={suggestion}
                                        className="px-4 py-2 h-12 hover:bg-gray-100 cursor-pointer border-b border-gray-400 "
                                        onClick={() => {
                                            form.setValue("cbu", suggestion);
                                            setShowSuggestions(false);
                                        }}
                                    >
                                        {suggestion}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <Input className="h-12" placeholder="MRP" type="number" {...form.register("mrp")} />
                    <Input className="h-12" placeholder="Qty" type="number" {...form.register("qty")} />
                    <Button type="submit" className="bg-blue-500 h-12 text-lg">Add</Button>
                </form>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>CBU</TableHead>
                            <TableHead>MRP</TableHead>
                            <TableHead>Remaining</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {flattenedScannedItems.map((item) => (
                            <TableRow key={`${item.cbu}${item.mrp}`}>
                                <TableCell>{item.cbu}</TableCell>
                                <TableCell>{item.mrp}</TableCell>
                                <TableCell>{(purchase[item.cbu]?.[item.mrp] || 0) - (otherScanned[item.cbu]?.[item.mrp] || 0) - item.qty}</TableCell>
                                <TableCell>{item.qty}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingItem(item)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
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