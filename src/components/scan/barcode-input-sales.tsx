import React, { useRef, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface SuggestionOption {
    label: string;
    value: { sku: string; mrp: number; name?: string };
}

interface BarcodeInputProps {
    value: string;
    onChange: (value: string) => void;
    onScan: (value: string) => void;
    onManualSelect: (option: SuggestionOption, value: string) => void;
    options: SuggestionOption[];
    placeholder?: string;
    inputRefProp?: React.RefObject<HTMLInputElement>;
}

export function BarcodeInputSales({
    value,
    onChange,
    onScan,
    onManualSelect,
    options,
    placeholder = "Scan or Type...",
    inputRefProp
}: BarcodeInputProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const internalInputRef = useRef<HTMLInputElement>(null);
    const inputRef = inputRefProp || internalInputRef;

    const filteredSuggestions = useMemo(() => {
        if (!value || value.length < 2) return [];
        const lowerVal = value.toLowerCase();
        return options.filter(opt =>
            opt.label.toLowerCase().includes(lowerVal) ||
            opt.value.sku.toLowerCase().includes(lowerVal) ||
            (opt.value.name && opt.value.name.toLowerCase().includes(lowerVal))
        ).slice(0, 50);
    }, [value, options]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter')) {
            e.preventDefault();
            // Enter defaults to SCAN action (barcode/cbu/manual text)
            onScan(value);
            setShowSuggestions(false);
        }
    };

    return (
        <div className="flex gap-3 flex-col relative w-full">
            <div className="relative">
                <Input
                    className="h-12"
                    placeholder={placeholder}
                    autoFocus
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    autoComplete="off"
                    onKeyDown={handleKeyDown}
                    ref={inputRef}
                />
                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-background border border-border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                        {filteredSuggestions.map((option, idx) => (
                            <div
                                key={`${option.value.sku}-${option.value.mrp}-${idx}`}
                                className={cn(
                                    "px-4 py-3 hover:bg-muted cursor-pointer border-b border-border/40 last:border-0 flex flex-col justify-center",
                                    "transition-colors"
                                )}
                                onMouseDown={(e) => {
                                    e.preventDefault(); // Prevent blur
                                    onManualSelect(option, value);
                                    setShowSuggestions(false);
                                    onChange(""); // Clear input on selection
                                }}
                            >
                                <div className="font-medium text-sm">
                                    {option.value.name ? (
                                        <span className="text-foreground">{option.value.name}</span>
                                    ) : (
                                        <span>{option.value.sku}</span>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground flex justify-between">
                                    <span>{option.value.sku}</span>
                                    <span>MRP: ₹{option.value.mrp}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
