import React, { useState } from "react";
import { useList } from "@refinedev/core";
import { useCompany } from "@/providers/company-provider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft } from "lucide-react";
import { dataProvider } from "@/lib/dataprovider";
import { downloadFromFilePath } from "@/lib/download";
import { LoadingButton } from "@/components/ui/loading-button";

interface VehicleSelectorProps {
    onSelect: (vehicle: any) => void;
    mode?: "load" | "delivery";
    onBack?: () => void;
}

export const VehicleSelector: React.FC<VehicleSelectorProps> = ({ onSelect, mode, onBack }) => {
    const { company } = useCompany();
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

    const { query: { data: vehicleData, isLoading: isLoadingVehicles } } = useList({
        resource: "vehicle",
        filters: [
            {
                field: "company",
                operator: "eq",
                value: company?.id,
            },
        ],
        pagination: {
            mode: "off"
        },
        queryOptions: {
            enabled: !!company?.id,
        }
    });

    const vehicles = vehicleData?.data || [];
    const selectedVehicle = vehicles.find((v: any) => v.id === selectedVehicleId);

    const handleNext = () => {
        if (selectedVehicle) {
            onSelect(selectedVehicle);
        }
    };

    const downloadScanPdf = async () => {
        if (selectedVehicle) {
            return dataProvider.custom({
                url: "/download_scan_pdf/",
                method: "post",
                payload: {
                    vehicle: selectedVehicle.id,
                    type: mode,
                }
            }).then((res) => downloadFromFilePath(res.data.filepath))
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-md mx-auto mt-10 p-4 border rounded-lg shadow-sm bg-card">
            <div className="flex items-center gap-2">
                {onBack && (
                    <Button variant="ghost" size="icon" onClick={onBack} className="-ml-2">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                )}
                <h2 className="text-2xl font-bold">{mode === "load" ? "Out for Delivery" : "Delivery In"}</h2>
                <LoadingButton onClick={downloadScanPdf} disabled={!selectedVehicleId} className="ml-auto">
                    Download
                </LoadingButton>
            </div>
            <div className="flex flex-col gap-2">
                <Label>Vehicle Name</Label>
                <Select value={selectedVehicleId || ""} onValueChange={setSelectedVehicleId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                        {isLoadingVehicles ? (
                            <div className="p-2 flex justify-center"><Loader2 className="animate-spin" /></div>
                        ) : (
                            vehicles.map((v: any) => (
                                <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            </div>

            {selectedVehicle && (
                <div className="flex flex-col gap-2">
                    <Label>Vehicle No</Label>
                    <Input value={selectedVehicle.vehicle_no} readOnly className="bg-muted" />
                </div>
            )}

            <Button onClick={handleNext} disabled={!selectedVehicleId} className="w-full">
                Next
            </Button>
        </div>
    );
};
