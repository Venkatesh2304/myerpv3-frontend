import React, { useState } from "react";
import { VehicleSelector } from "./components/VehicleSelector";
import { BillScanner } from "./components/BillScanner";
import { MissingBillsDialog } from "./components/MissingBillsDialog";

interface GenericVehicleScanPageProps {
    mode: "load" | "delivery";
    onBack?: () => void;
}

export const GenericVehicleScanPage: React.FC<GenericVehicleScanPageProps> = ({ mode, onBack }) => {
    const [step, setStep] = useState<"select" | "scan">("select");
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

    const handleVehicleSelect = (vehicle: any) => {
        setSelectedVehicle(vehicle);
        setStep("scan");
    };

    const handleBack = () => {
        setStep("select");
        setSelectedVehicle(null);
    };

    if (step === "select") {
        return <VehicleSelector onSelect={handleVehicleSelect} mode={mode} onBack={onBack} />;
    }

    return (
        <BillScanner
            vehicle={selectedVehicle}
            mode={mode}
            onBack={handleBack}
            headerAction={mode === "delivery" ? <MissingBillsDialog vehicleId={selectedVehicle.id} /> : undefined}
        />
    );
};

export const LoadScanPage = ({ onBack }: { onBack?: () => void }) => <GenericVehicleScanPage mode="load" onBack={onBack} />;
export const DeliveryScanPage = ({ onBack }: { onBack?: () => void }) => <GenericVehicleScanPage mode="delivery" onBack={onBack} />;

// Deprecated: Use LoadScanPage instead
export const VehicleScanPage = LoadScanPage;
