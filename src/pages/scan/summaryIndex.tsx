import React, { useState } from "react";
import { TruckSummaryPage } from "./truckSummary";
import { VehicleSummaryPage } from "./vehicleSummary";
import { Button } from "@/components/ui/button";
import { Truck, Car } from "lucide-react";

export const SummaryPage = () => {
    const [mode, setMode] = useState<"truck" | "vehicle" | null>(null);

    if (!mode) {
        return (
            <div className="flex flex-col items-center justify-center gap-8 mt-10">
                <h1 className="text-3xl font-bold">Select Summary</h1>
                <div className="flex gap-6 flex-wrap justify-center">
                    <Button
                        variant="outline"
                        className="h-40 w-40 flex flex-col gap-4 text-xl hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setMode("truck")}
                    >
                        <Truck className="h-12 w-12" />
                        Lorry
                    </Button>
                    <Button
                        variant="outline"
                        className="h-40 w-40 flex flex-col gap-4 text-xl hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setMode("vehicle")}
                    >
                        <Car className="h-12 w-12" />
                        Delivery
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div>
            {mode === "truck" && <TruckSummaryPage />}
            {mode === "vehicle" && <VehicleSummaryPage />}
        </div>
    );
};
