import React, { useState } from "react";
import { TruckScanPage } from "./truckScan";
import { LoadScanPage, DeliveryScanPage } from "./vehicleScan";
import { Button } from "@/components/ui/button";
import { Truck, PackagePlus, PackageCheck } from "lucide-react";

export const ScanPage = () => {
    const [mode, setMode] = useState<"truck" | "load" | "delivery" | null>(null);

    if (!mode) {
        return (
            <div className="flex flex-col items-center justify-center gap-8 mt-10">
                <h1 className="text-3xl font-bold">Select Scan Mode</h1>
                <div className="flex gap-6 flex-wrap justify-center">
                    <Button
                        variant="outline"
                        className="h-40 w-40 flex flex-col gap-4 text-xl hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setMode("truck")}
                    >
                        <Truck className="h-12 w-12" />
                        Truck Scan
                    </Button>
                    <Button
                        variant="outline"
                        className="h-40 w-40 flex flex-col gap-4 text-xl hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setMode("load")}
                    >
                        <PackagePlus className="h-12 w-12" />
                        Vehicle Load
                    </Button>
                    <Button
                        variant="outline"
                        className="h-40 w-40 flex flex-col gap-4 text-xl hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setMode("delivery")}
                    >
                        <PackageCheck className="h-12 w-12" />
                        Vehicle Delivery
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="">
            {mode === "truck" && <TruckScanPage />}
            {mode === "load" && <LoadScanPage onBack={() => setMode(null)} />}
            {mode === "delivery" && <DeliveryScanPage onBack={() => setMode(null)} />}
        </div>
    );
};
