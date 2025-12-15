import { Button } from "@/components/ui/button";
import { downloadFromResponse } from "@/lib/download";
import { useDataProvider, useNotification } from "@refinedev/core";
import React from "react";

interface DepositSlipButtonProps {
    selectedIds: (string | number)[];
    onSuccess: () => void;
}

export const DepositSlipButton = ({
    selectedIds,
    onSuccess,
}: DepositSlipButtonProps) => {
    const dataProvider = useDataProvider();
    const { open: openNotification } = useNotification();
    const [isDownloading, setIsDownloading] = React.useState(false);

    const handleDepositSlip = async () => {
        if (selectedIds.length === 0) {
            openNotification?.({
                type: "error",
                message: "No cheques selected",
                description:
                    "Please select at least one cheque to generate a deposit slip.",
            });
            return;
        }

        setIsDownloading(true);

        try {
            const response = await dataProvider().custom({
                url: "/deposit_slip/",
                method: "post",
                payload: { ids: selectedIds },
                meta: {
                    responseType: "blob",
                },
            });

            if (response?.data instanceof Response) {
                await downloadFromResponse(response.data, "deposit_slip.xlsx");
            } else {
                throw new Error("Invalid response format");
            }

            openNotification?.({
                type: "success",
                message: "Deposit slip generated",
                description: `Successfully generated deposit slip for ${selectedIds.length} cheque(s).`,
            });

            onSuccess();
        } catch (error) {
            console.error("Error generating deposit slip:", error);
            openNotification?.({
                type: "error",
                message: "Failed to generate deposit slip",
                description:
                    "An error occurred while generating the deposit slip. Please try again.",
            });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Button
            variant={"outline"}
            onClick={handleDepositSlip}
            disabled={isDownloading}
        >
            {isDownloading ? "Generating..." : "Deposit Slip"}
        </Button>
    );
};
