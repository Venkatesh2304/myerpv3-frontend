import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCaptcha } from "@/components/custom/CaptchaProvider";
import { requestWithCaptcha } from "@/lib/captcha";
import { useNotification } from "@refinedev/core";
import { CheckCircle2, XCircle, Loader2, FileDown, Zap, RefreshCw } from "lucide-react";
import { downloadFromFilePath } from "@/lib/download";
import { httpClient } from "@/lib/dataprovider";
import { ResourceCombobox } from "@/components/custom/resource-combobox";
import { useCompany } from "@/providers/company-provider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/custom/date-picker";
import { subDays, format } from "date-fns";

type StepStatus = "idle" | "loading" | "success" | "error";

const getEwayDefaultDate = () => {
    const yesterday = subDays(new Date(), 1);
    if (yesterday.getDay() === 0) {
        return format(subDays(new Date(), 2), "yyyy-MM-dd");
    }
    return format(yesterday, "yyyy-MM-dd");
};

export const VehicleGenerationDialog = () => {
    const [open, setOpen] = useState(false);
    const [vehicleId, setVehicleId] = useState<string | null>(null);
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);
    const [steps, setSteps] = useState<Record<string, { status: StepStatus; info?: string; filepath?: string }>>({
        eway: { status: "idle" },
        impact: { status: "idle" },
        scan_pdf: { status: "idle" },
    });
    const [ewayDate, setEwayDate] = useState<string>(getEwayDefaultDate());
    const [companyEwayStatus, setCompanyEwayStatus] = useState<{ status: StepStatus; info?: string; filepath?: string }>({ status: "idle" });

    const { company } = useCompany();
    const captcha = useCaptcha();
    const { open: notify } = useNotification();

    const updateStep = (id: string, data: Partial<{ status: StepStatus; info?: string; filepath?: string }>) => {
        setSteps(prev => ({
            ...prev,
            [id]: { ...prev[id], ...data }
        }));
    };

    React.useEffect(() => {
        setSteps({
            eway: { status: "idle" },
            impact: { status: "idle" },
            scan_pdf: { status: "idle" },
        });
        setIsGeneratingAll(false);
    }, [vehicleId]);

    const runEway = async () => {
        if (!vehicleId) return;
        updateStep("eway", { status: "loading", info: "Generating E-way bills..." });
        try {
            const response = await requestWithCaptcha(
                {
                    url: "/upload_vehicle_eway/",
                    method: "post",
                    data: { vehicle: vehicleId },
                },
                captcha
            );
            const data = response.data;
            updateStep("eway", {
                status: "success",
                info: `Filed: ${data.filed}, Not Filed: ${data.not_filed}`,
                filepath: data.filepath
            });
            if (data.filepath) downloadFromFilePath(data.filepath);
        } catch (error: any) {
            updateStep("eway", { status: "error", info: error?.response?.data?.error || error.message });
            throw error;
        }
    };

    const runImpact = async () => {
        if (!vehicleId) return;
        updateStep("impact", { status: "loading", info: "Pushing to Impact..." });
        try {
            const response = await httpClient.post("/push_impact/", { vehicle: vehicleId });
            const data = response.data;
            updateStep("impact", {
                status: "success",
                info: `Pushed: ${data.pushed}, Pending: ${data.pending}`
            });
        } catch (error: any) {
            updateStep("impact", { status: "error", info: error?.response?.data?.error || error.message });
        }
    };

    const runScanSummary = async () => {
        if (!vehicleId) return;
        updateStep("scan_pdf", { status: "loading", info: "Generating Scan PDF..." });
        try {
            const response = await httpClient.post("/download_scan_pdf/", { vehicle: vehicleId, type: "load" });
            const data = response.data;
            updateStep("scan_pdf", {
                status: "success",
                info: `Scan Bill Count: ${data?.scan_bills}`,
                filepath: data.filepath
            });
            if (data.filepath) downloadFromFilePath(data.filepath);
        } catch (error: any) {
            updateStep("scan_pdf", { status: "error", info: error?.response?.data?.error || error.message });
        }
    };

    const runCompanyEway = async () => {
        setCompanyEwayStatus({ status: "loading", info: "Generating Company E-way..." });
        try {
            const response = await requestWithCaptcha(
                {
                    url: "/upload_company_eway/",
                    method: "post",
                    data: {
                        company: company?.id,
                        date: ewayDate
                    },
                },
                captcha
            );
            const data = response.data;
            setCompanyEwayStatus({
                status: "success",
                info: data.info || "E-way generated",
                filepath: data.filepath
            });
            if (data.filepath) downloadFromFilePath(data.filepath);
        } catch (error: any) {
            setCompanyEwayStatus({ status: "error", info: error?.response?.data?.error || error.message });
        }
    };

    const handleGenerateAll = async () => {
        setIsGeneratingAll(true);

        // Start E-way (don't await it yet)
        const ewayPromise = runEway().catch(() => { });

        // Start a 5-second timer
        const timerPromise = new Promise(resolve => setTimeout(resolve, 5000));

        // Wait for the timer to finish
        await timerPromise;

        // Start others in parallel
        const othersPromise = Promise.all([runImpact(), runScanSummary()]);

        // Wait for everything to finish before clearing the loading state
        await Promise.all([ewayPromise, othersPromise]);

        setIsGeneratingAll(false);
    };

    const reset = () => {
        setVehicleId(null);
        setSteps({
            eway: { status: "idle" },
            impact: { status: "idle" },
            scan_pdf: { status: "idle" },
        });
        setIsGeneratingAll(false);
        setCompanyEwayStatus({ status: "idle" });
        setEwayDate(getEwayDefaultDate());
    };

    const StepItem = ({ id, label, runAction }: { id: string; label: string; runAction: () => Promise<void> }) => {
        const step = steps[id];
        return (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div className="flex items-center gap-3">
                    {step.status === "loading" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                    {step.status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                    {step.status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
                    {step.status === "idle" && <div className="h-5 w-5 rounded-full border-2 border-muted" />}

                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{label}</span>
                        {step.info && <span className="text-xs text-muted-foreground">{step.info}</span>}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {step.filepath && step.status === "success" && (
                        <Button variant="ghost" size="icon" onClick={() => downloadFromFilePath(step.filepath!)}>
                            <FileDown className="h-4 w-4" />
                        </Button>
                    )}
                    {(step.status === "error" || step.status === "success") && (
                        <Button variant="ghost" size="icon" onClick={runAction} disabled={isGeneratingAll}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) reset();
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Zap className="h-3.5 w-3.5 text-yellow-500" />
                    Generate
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Generation Center</DialogTitle>
                    <DialogDescription>
                        Generate E-way bills, Impact data, and Scan summaries
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="vehicle" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="vehicle">Vehicle</TabsTrigger>
                        <TabsTrigger value="eway">Eway</TabsTrigger>
                    </TabsList>

                    <TabsContent value="vehicle">
                        <div className="flex flex-col gap-4 py-4">
                            <div className="flex items-end gap-2">
                                <div className="flex flex-col gap-2 flex-1">
                                    <label className="text-sm font-medium">Select Vehicle</label>
                                    <ResourceCombobox
                                        resource="vehicle"
                                        labelKey="name"
                                        valueKey="id"
                                        value={vehicleId || ""}
                                        onValueChange={setVehicleId}
                                        filters={[
                                            {
                                                field: "company",
                                                operator: "eq",
                                                value: company?.id,
                                            }
                                        ]}
                                    />
                                </div>
                                <Button
                                    onClick={handleGenerateAll}
                                    disabled={!vehicleId || isGeneratingAll || (steps.eway.status !== "idle" && steps.eway.status !== "error")}
                                    className="mb-[1px]"
                                >
                                    {isGeneratingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate All"}
                                </Button>
                            </div>

                            <div className="flex flex-col gap-3">
                                <StepItem id="eway" label="E-way Generation" runAction={runEway} />
                                <StepItem id="impact" label="Impact Generation" runAction={runImpact} />
                                <StepItem id="scan_pdf" label="Scan Summary" runAction={runScanSummary} />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="eway">
                        <div className="flex flex-col gap-4 py-4">
                            <div className="flex items-end gap-2">
                                <div className="flex flex-col gap-2 flex-1">
                                    <label className="text-sm font-medium">Select Bill Date</label>
                                    <DatePicker
                                        value={ewayDate}
                                        onChange={(d) => d && setEwayDate(d)}
                                    />
                                </div>
                                <Button
                                    onClick={runCompanyEway}
                                    disabled={companyEwayStatus.status === "loading"}
                                    className="mb-[1px]"
                                >
                                    {companyEwayStatus.status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
                                </Button>
                            </div>

                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                                    <div className="flex items-center gap-3">
                                        {companyEwayStatus.status === "loading" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                                        {companyEwayStatus.status === "success" && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                                        {companyEwayStatus.status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
                                        {companyEwayStatus.status === "idle" && <div className="h-5 w-5 rounded-full border-2 border-muted" />}

                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">Company E-way Generation</span>
                                            {companyEwayStatus.info && <span className="text-xs text-muted-foreground">{companyEwayStatus.info}</span>}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {companyEwayStatus.filepath && companyEwayStatus.status === "success" && (
                                            <Button variant="ghost" size="icon" onClick={() => downloadFromFilePath(companyEwayStatus.filepath!)}>
                                                <FileDown className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {(companyEwayStatus.status === "error" || companyEwayStatus.status === "success") && (
                                            <Button variant="ghost" size="icon" onClick={runCompanyEway}>
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)} className="w-full">
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
