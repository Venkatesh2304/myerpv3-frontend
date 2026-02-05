"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { formatPeriod } from "@/lib/period";

type PeriodProps = {
    // Optional controlled values (if provided, component syncs to them)
    month?: number; // 1-12
    year?: number; // four-digit year
    // Called when month/year changes with the computed "MMYYYY"
    onPeriodChange?: (period: string, parts: { month: number; year: number }) => void;
    // UI
    className?: string;
    disabled?: boolean;
    // label?: string; // no outer label; two internal labels (Month/Year)
};

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const yearOptions = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

export default function Period({
    month,
    year,
    onPeriodChange,
    className,
    disabled,
}: PeriodProps) {
    const today = useMemo(() => new Date(), []);
    const initialM = (typeof month === "number" ? month : today.getMonth() === 0 ? 12 : today.getMonth());
    // Clamp default year to allowed range 2020–2030
    const ty = today.getFullYear();
    const initialY = today.getMonth() === 0 ? (ty - 1) : ty;

    const [m, setM] = useState<number>(initialM);
    const [y, setY] = useState<number>(initialY);

    // Sync when parent controls values
    useEffect(() => {
        if (typeof month === "number") setM(month);
    }, [month]);
    useEffect(() => {
        if (typeof year === "number") setY(year);
    }, [year]);

    // Emit period on change
    useEffect(() => {
        if (!onPeriodChange) return;
        const cm = Math.min(12, Math.max(1, Number(m) || 1));
        const cy = Math.min(2030, Math.max(2020, Number(y) || 2020));
        onPeriodChange(formatPeriod(cm, cy), { month: cm, year: cy });
    }, [m, y, onPeriodChange]);

    const handleMonthChange = (val: string) => {
        const next = Number(val);
        setM(next);
    };

    const handleYearChange = (val: string) => {
        const next = Number(val);
        setY(next);
    };

    return (
        <>
            <div className={className}>
                <div className="flex items-end">
                    <div className="w-35">
                        <Label htmlFor="period-month" className="mb-2 block">Month</Label>
                        <Select disabled={disabled} value={String(m)} onValueChange={handleMonthChange}>
                            <SelectTrigger id="period-month">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {monthNames.map((name, idx) => {
                                    const val = String(idx + 1);
                                    return (
                                        <SelectItem key={val} value={val}>
                                            {name}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-32">
                        <Label htmlFor="period-year" className="mb-2 block">Year</Label>
                        <Select
                            disabled={disabled}
                            value={String(y)}
                            onValueChange={handleYearChange}
                        >
                            <SelectTrigger id="period-year">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {yearOptions.map((yy) => (
                                    <SelectItem key={yy} value={String(yy)}>
                                        {yy}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </>
    );
}
