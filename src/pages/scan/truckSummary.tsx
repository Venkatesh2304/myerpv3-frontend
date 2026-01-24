import React, { useState } from "react";
import { useForm } from "@refinedev/react-hook-form";
import { useCustom, useCustomMutation } from "@refinedev/core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2Icon, UploadCloudIcon, TruckIcon, CalendarIcon, PackageIcon } from "lucide-react";
import { Form } from "@/components/ui/form";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { create } from "domain";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dataProvider } from "@/lib/dataprovider";
import { downloadFile, downloadFromFilePath } from "@/lib/download";
import { LoadingButton } from "@/components/ui/loading-button";

export const TruckSummaryPage = () => {
    // 1. Get the last load number
    const { query: { data: loadData, isLoading: isLoadLoading, refetch: refetchLastLoad } } = useCustom({
        url: "get_last_load",
        method: "get",
    });

    const loadNo = loadData?.data?.load;

    // 2. Setup Refine Form for load_summary
    const form = useForm({
        refineCoreProps: {
            resource: "load_summary",
            action: "edit",
            id: loadNo,
            queryOptions: {
                enabled: !!loadNo,
            },
            invalidates: ["detail"],
        },
    });

    const {
        refineCore: { onFinish, query }, // @ts-ignore
        handleSubmit,
        setValue,
        watch,
    } = form;

    const purchaseInums = query?.data?.data?.purchase_inums || [];
    const purchaseStats = query?.data?.data?.purchase_stats || [];
    const scannedStats = query?.data?.data?.scanned_stats || [];
    const createdAt = query?.data?.data?.created_at || "";
    const totalInvoiceCases: number = Object.values(purchaseStats).reduce((acc: any, cur: any) => acc + cur?.cases, 0); //@ts-ignore
    const [isUploading, setIsUploading] = useState(false);

    // 3. File Upload Logic
    const { mutate: uploadInvoice } = useCustomMutation();
    const [file, setFile] = useState<File | null>(null);

    const handleUpload = () => {
        if (!file || !loadNo) return;
        const formData = new FormData();
        formData.append("load", loadNo);
        formData.append("file", file);
        setIsUploading(true);
        uploadInvoice({
            url: "upload_purchase_invoice/",
            method: "post",
            values: formData,
            successNotification: () => ({
                message: "Invoice uploaded successfully",
                type: "success",
            }),
        }, {
            onSuccess: () => {
                setFile(null);
                query?.refetch();
            },
            onSettled: () => {
                setIsUploading(false);
            },
        });
    };

    const handleRemoveInum = (inum: string) => {
        const updatedInums = purchaseInums.filter((i) => i !== inum);
        setValue("purchase_inums", updatedInums, { shouldDirty: true });
        const currentValues = form.getValues();
        onFinish({ id: currentValues.id, purchase_inums: updatedInums });
    };

    const downloadSummary = () => (
        dataProvider.custom({
            url: "download_load_summary/",
            method: "get",
            query: {
                load: loadNo,
            }
        }).then((res) =>
            downloadFromFilePath(res.data.file_path)
        )
    )

    const handleComplete = () => {
        const currentValues = form.getValues();
        if (window.confirm("Are you sure you want to complete this load?")) {
            onFinish({ id: currentValues.id, completed: true }).then(() => refetchLastLoad());
        }
    }

    if (isLoadLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="text-muted-foreground">Loading load details...</div>
            </div>
        );
    }

    if (!loadNo) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="text-muted-foreground">No active load found.</div>
            </div>
        );
    }

    return (
        <div className="container grid grid-cols-2 gap-8 mx-auto p-6 max-w-5xl space-y-8">
            {/* Left Column: Load Details & List & Upload */}
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Load #{loadNo}</span>
                            {createdAt && (
                                <Badge variant="outline" className="font-normal">
                                    <CalendarIcon className="mr-2 h-3 w-3" />
                                    {format(new Date(createdAt), "PPP p")}
                                </Badge>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                                <span>Invoice Number</span>
                                <span>Lines</span>
                                <span>Cases</span>
                                <span>Action</span>
                            </div>
                            <Separator />
                            {purchaseInums.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <PackageIcon className="h-8 w-8 mb-2 opacity-20" />
                                    <p>No purchase invoices added yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {purchaseInums.map((inum: string) => (
                                        <div key={inum} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                            <span className="font-mono text-sm">{inum}</span>
                                            <span className="font-mono text-sm">{purchaseStats[inum]?.lines}</span>
                                            <span className="font-mono text-sm">{purchaseStats[inum]?.cases}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleRemoveInum(inum)}
                                                title="Remove Invoice"
                                            >
                                                <Trash2Icon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Invoice</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full max-w-sm items-center gap-1.5">
                            <Input
                                id="invoice-file"
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                        </div>
                        <Button
                            className="w-full"
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                        >
                            {isUploading ? (
                                <>Uploading...</>
                            ) : (
                                <>
                                    <UploadCloudIcon className="mr-2 h-4 w-4" />
                                    Upload Invoice
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
            <div className="grid">
                <Card>
                    <CardHeader>
                        <CardTitle>Scan Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 flex flex-col gap-2">
                            <Table className="w-full h-full">
                                {/* Table with two columns Type Count*/}
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Count</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>Scanned Boxes</TableCell>
                                        <TableCell>{scannedStats?.box_count}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Invoice Cases</TableCell>
                                        <TableCell>{totalInvoiceCases}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Scanned Cases</TableCell>
                                        <TableCell>{scannedStats?.case_count}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                            <LoadingButton onClick={downloadSummary} className="w-50 bg-green-500">Download Summary</LoadingButton>
                            <LoadingButton onClick={handleComplete} className="w-30 bg-red-500 mt-5 ml-auto">Finish Load</LoadingButton>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Hidden form to handle state if needed, though we are using onFinish directly */}
            <Form {...form}>
                <form onSubmit={handleSubmit(onFinish)}></form>
            </Form>
        </div>
    );
};
