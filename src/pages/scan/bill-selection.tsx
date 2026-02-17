import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingButton } from "@/components/ui/loading-button";
import { dataProvider } from "@/lib/dataprovider";
import { useCompany } from "@/providers/company-provider";
import { useNotification } from "@refinedev/core";

interface BillSelectionProps {
    onBack: () => void;
    onScanStart: (scanId: string, billNo: string) => void;
}

export function BillSelection({ onBack, onScanStart }: BillSelectionProps) {
    const { company } = useCompany();
    const { open } = useNotification();
    const [billNo, setBillNo] = useState("");
    const handleBillSubmit = async () => {
        if (!billNo) return;
        try {
            const res = await dataProvider.custom({
                url: "sales_scan_id/",
                method: "post",
                payload: { company_id: company?.id, bill_no: billNo },
            });
            if (res.data?.id) {
                onScanStart(String(res.data.id), billNo);
            }
        } catch (error: any) {
            open?.({ type: "error", message: error?.response?.data?.error || "Error starting scan" });
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-10 gap-6 relative min-h-[60vh] w-full max-w-2xl mx-auto">

            <div className="w-full max-w-md flex flex-col gap-6">
                <div className="space-y-2">
                    <Input
                        value={billNo}
                        onChange={e => setBillNo(e.target.value)}
                        placeholder="Bill No"
                        className="h-16 text-2xl px-6 w-full shadow-sm"
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                handleBillSubmit();
                            }
                        }}
                    />
                </div>
                <LoadingButton
                    onClick={handleBillSubmit}
                    className="h-14 text-xl w-full shadow-md transition-all hover:scale-[1.02]"
                >
                    Start Scan
                </LoadingButton>
            </div>
        </div>
    );
}
