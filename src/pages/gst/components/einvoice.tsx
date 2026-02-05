"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Period from "@/components/common/Period";
import { useCaptcha } from "@/components/custom/CaptchaProvider";
import { requestWithCaptcha } from "@/lib/captcha";
import { downloadFile } from "@/lib/download";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { httpClient } from "@/lib/dataprovider";

type EInvoiceRow = { company: string; amt: number; filed: number; not_filed: number, type: string };

export function EInvoiceContent() {
    const [period, setPeriod] = useState<string>("");
    const [type, setType] = useState<string>("all");
    const [rows, setRows] = useState<EInvoiceRow[] | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [filing, setFiling] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [downloadingPdf, setDownloadingPdf] = useState(false);
    const [loadingIrn, setLoadingIrn] = useState(false);
    const captcha = useCaptcha();

    const isFirstRun = useRef(true);

    // Generate manually
    const onGenerate = useCallback(async () => {
        if (!period) return;
        setSubmitting(true);
        // Clear previous data
        setRows(null);

        try {
            const res = await requestWithCaptcha(
                {
                    url: "/einvoice/stats",
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    data: { period, type },
                },
                captcha
            );
            const stats = res.data?.stats;
            if (stats && typeof stats === "object" && Array.isArray(stats)) {
                setRows(stats);
            } else {
                setRows([]);
            }
        } catch (err: any) {
            alert(err?.message ?? "Request failed");
            setRows([]);
        } finally {
            setSubmitting(false);
        }
    }, [period, type, captcha]);


    const canFile = Array.isArray(rows) && rows.length > 0 && rows.some((r) => Number(r.not_filed) > 0);

    const onFile = async () => {
        if (!canFile) return;
        setFiling(true);
        try {
            const res = await requestWithCaptcha(
                {
                    url: "/einvoice/file",
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    data: { period, type },
                    responseType: "blob",
                },
                captcha
            );
            const blob = res.data;
            const contentDisposition = res.headers["content-disposition"];
            downloadFile(blob, contentDisposition, `einvoice_${period}.xlsx`);
            await onGenerate(); // refresh after filing
        } catch (err: any) {
            alert(err?.message ?? "Filing failed");
        } finally {
            setFiling(false);
        }
    };

    const onDownload = async () => {
        if (!period) return;
        setDownloading(true);
        try {
            // NOTE: Using general httpClient here as in original code, but check if captcha is needed?
            // Original user code used `api.post`. Here we use `httpClient` from dataprovider.
            const res = await httpClient.post(
                "/einvoice/excel",
                { period, type },
                {
                    responseType: "blob",
                }
            );
            const blob = res.data;
            const contentDisposition = res.headers["content-disposition"];
            downloadFile(blob, contentDisposition, `einvoice_${period}.xlsx`);
        } catch (err: any) {
            alert(err?.message ?? "Download failed");
        } finally {
            setDownloading(false);
        }
    };

    const onDownloadPdf = async () => {
        if (!period) return;
        setDownloadingPdf(true);
        try {
            const res = await requestWithCaptcha(
                {
                    url: "/einvoice/pdf",
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    responseType: "blob",
                    data: { period, type },
                },
                captcha
            );
            const blob = res.data;
            const contentDisposition = res.headers["content-disposition"];
            downloadFile(blob, contentDisposition, `einvoice_${period}.pdf`);
        } catch (err: any) {
            console.log(err)
            alert(err?.message ?? "Download failed");
        } finally {
            setDownloadingPdf(false);
        }
    };

    const onLoadIrn = async () => {
        if (!period) return;
        setLoadingIrn(true);
        try {
            await requestWithCaptcha(
                {
                    url: "/einvoice/reload",
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    data: { period },
                },
                captcha
            );
        } catch (err: any) {
            alert("Load IRNs failed");
            console.log(err);
        } finally {
            setLoadingIrn(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <div className="flex flex-row items-center justify-end px-0 pt-0 mb-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onLoadIrn}
                    disabled={!period || loadingIrn || submitting}
                >
                    {loadingIrn ? "Loading IRN..." : "Load IRN"}
                </Button>
            </div>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row">
                    <Period className="flex-1" onPeriodChange={useCallback((p: string) => { setPeriod(p); setRows(null); }, [])} />
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="einvoice-type">Type</Label>
                        <Select value={type} onValueChange={(v) => { setType(v); setRows(null); }}>
                            <SelectTrigger id="einvoice-type">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="damage">Damage</SelectItem>
                                <SelectItem value="sales">Sales</SelectItem>
                                <SelectItem value="salesreturn">SalesReturn</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-start items-end ml-5">
                        <Button onClick={onGenerate} disabled={!period || submitting}>
                            {submitting ? "Generating..." : "Generate"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Loading skeleton */}
            {submitting || loadingIrn ? (
                <div className="mt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Company</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead className="text-right">Amount (Not Filed)</TableHead>
                                <TableHead className="text-right">Filed</TableHead>
                                <TableHead className="text-right">Not Filed</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><div className="h-4 rounded bg-muted animate-pulse" /></TableCell>
                                    <TableCell><div className="h-4 rounded bg-muted animate-pulse" /></TableCell>
                                    <TableCell className="text-right"><div className="h-4 rounded bg-muted animate-pulse" /></TableCell>
                                    <TableCell className="text-right"><div className="h-4 rounded bg-muted animate-pulse" /></TableCell>
                                    <TableCell className="text-right"><div className="h-4 rounded bg-muted animate-pulse" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                Array.isArray(rows) && (
                    <div className="mt-6">
                        {rows.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No data</div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Company</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">Amount (Not Filed)</TableHead>
                                            <TableHead className="text-right">Filed</TableHead>
                                            <TableHead className="text-right">Not Filed</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((r) => (
                                            <TableRow key={r.company + r.type} className={r.not_filed == 0 ? "text-gray-600" : ""}>
                                                <TableCell>{r.company}</TableCell>
                                                <TableCell>{r.type}</TableCell>
                                                <TableCell className="text-right">{r.amt}</TableCell>
                                                <TableCell
                                                    className={`text-right  ${r.not_filed > 0 && "font-medium text-green-600"}`}
                                                >{r.filed}</TableCell>
                                                <TableCell
                                                    className={`text-right  ${r.not_filed > 0 && "font-medium text-red-600"}`}
                                                >
                                                    {r.not_filed}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <div className="mt-4 flex items-center justify-between">
                                    {type === "all" ? (
                                        <span className="text-gray-500 font-bold text-sm">Please go to respective invoice types to file einvoice</span>
                                    ) : (
                                        <>
                                            <Button variant="outline" onClick={onDownloadPdf} disabled={(type != "damage") || downloadingPdf || !rows?.length}>
                                                {downloadingPdf ? "Downloading..." : "Download PDF"}
                                            </Button>
                                            <div className="flex gap-2">
                                                <Button variant="outline" onClick={onDownload} disabled={downloading || !rows?.length}>
                                                    {downloading ? "Downloading..." : "Download Excel"}
                                                </Button>
                                                {canFile && (
                                                    <Button onClick={onFile} disabled={filing}>
                                                        {filing ? "Filing..." : "File E-Invoice"}
                                                    </Button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )
            )}
        </div>
    );
}
