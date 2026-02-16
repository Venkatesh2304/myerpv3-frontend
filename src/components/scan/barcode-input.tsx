
import React, { useRef, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

interface BarcodeInputProps {
    value: string;
    onChange: (value: string) => void;
    onScan: (value: string) => void;
    options: string[];
    placeholder?: string;
    inputRefProp?: React.RefObject<HTMLInputElement>;
}

export function BarcodeInput({
    value,
    onChange,
    onScan,
    options,
    placeholder = "Scan or Type...",
    inputRefProp
}: BarcodeInputProps) {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const internalInputRef = useRef<HTMLInputElement>(null);
    const inputRef = inputRefProp || internalInputRef;

    const suggestions = useMemo(() => {
        if (!value || value.length < 2) return [];
        return options.filter(opt => opt.toLowerCase().includes(value.toLowerCase())).slice(0, 50);
    }, [value, options]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if ((e.key === 'Enter') || (e.currentTarget.value?.endsWith("\n")) || (e.currentTarget.value?.endsWith("\r"))) {
            e.preventDefault();
            const val = e.currentTarget.value;
            onScan(val);
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
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    autoComplete="off"
                    onKeyDown={handleKeyDown}
                    ref={inputRef}
                />
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                        {suggestions.map((suggestion) => (
                            <div
                                key={suggestion}
                                className="px-4 py-2 h-12 hover:bg-gray-100 cursor-pointer border-b border-gray-100 truncate flex items-center"
                                onClick={() => {
                                    onChange(suggestion);
                                    setShowSuggestions(false);
                                }}
                            >
                                {suggestion}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
