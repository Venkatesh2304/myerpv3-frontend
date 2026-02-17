import React, { useState } from "react";
import { BillSelection } from "@/pages/scan/bill-selection";
import { ScanningInterface } from "@/pages/scan/scanning-interface";

export function SalesScanPage({ onBack }: { onBack: () => void }) {
    const [step, setStep] = useState<"bill-entry" | "scanning">("bill-entry");
    const [scanId, setScanId] = useState<string | null>(null);
    const [billNo, setBillNo] = useState("");

    const handleScanStart = (id: string, bill: string) => {
        setScanId(id);
        setBillNo(bill);
        setStep("scanning");
    };

    if (step === "bill-entry") {
        return (
            <BillSelection
                onBack={onBack}
                onScanStart={handleScanStart}
            />
        );
    }

    return (
        <ScanningInterface
            scanId={scanId!}
            billNo={billNo}
            onBack={onBack}
        />
    );
}
