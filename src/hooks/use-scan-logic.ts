
import { useState, useMemo, useCallback } from "react";
import { QtyMap } from "@/components/scan/scanned-items-table";

export function useScanLogic() {
    const [currentScanned, setCurrentScanned] = useState<QtyMap>({});
    const [lastScanned, setLastScanned] = useState<Record<string, number>>({});

    const updateScannedItem = useCallback((cbu: string, mrp: number, qty: number, isAddition: boolean) => {
        setLastScanned(prev => ({ ...prev, [`${cbu}-${mrp}`]: Date.now() }));
        setCurrentScanned((prev) => {
            const currentQty = prev?.[cbu]?.[mrp] || 0;
            const newQty = isAddition ? currentQty + qty : qty;

            if (newQty <= 0) {
                const newState = { ...prev };
                if (newState[cbu]) {
                    const newMrpMap = { ...newState[cbu] };
                    delete newMrpMap[mrp];
                    if (Object.keys(newMrpMap).length === 0) {
                        delete newState[cbu];
                    } else {
                        newState[cbu] = newMrpMap;
                    }
                }
                return newState;
            }

            return {
                ...prev,
                [cbu]: {
                    ...prev[cbu],
                    [mrp]: newQty
                }
            };
        });
    }, []);

    const scannedCount = useMemo(() => {
        return Object.values(currentScanned).reduce((acc, mrpMap) => {
            return acc + Object.values(mrpMap).reduce((sum, qty) => sum + qty, 0);
        }, 0);
    }, [currentScanned]);

    const flattenedScannedItems = useMemo(() => {
        const items = Object.entries(currentScanned).flatMap(([cbu, mrps]) =>
            Object.entries(mrps).map(([mrp, qty]) => ({
                cbu,
                mrp: Number(mrp),
                qty,
            }))
        );
        return items.sort((a, b) => {
            const timeA = lastScanned[`${a.cbu}-${a.mrp}`] || 0;
            const timeB = lastScanned[`${b.cbu}-${b.mrp}`] || 0;
            return timeB - timeA;
        });
    }, [currentScanned, lastScanned]);

    return {
        currentScanned,
        setCurrentScanned,
        lastScanned,
        setLastScanned,
        updateScannedItem,
        scannedCount,
        flattenedScannedItems
    };
}
