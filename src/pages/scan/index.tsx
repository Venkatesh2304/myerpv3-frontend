import React, { useState } from "react";
import { TruckScanPage } from "./truckScan";
import { VehicleScanPage } from "./vehicleScan";
import { Button } from "@/components/ui/button";
import { TruckIcon, CarIcon } from "lucide-react";

export const ScanPage = () => {
    const [mode, setMode] = useState<"truck" | "vehicle" | null>(null);

    if (!mode) {
        return (
            <div className="flex flex-col items-center justify-center gap-8">
                <Button
                    variant="outline"
                    className="h-40 w-40 flex flex-col gap-4 text-xl hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setMode("truck")}
                >
                    <TruckIcon className="h-12 w-12" />
                    Truck Scan
                </Button>
                <Button
                    variant="outline"
                    className="h-40 w-40 flex flex-col gap-4 text-xl hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setMode("vehicle")}
                >
                    <CarIcon className="h-12 w-12" />
                    Vehicle Scan
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4">
            {mode === "truck" ? <TruckScanPage /> : <VehicleScanPage />}
        </div>
    );
};
