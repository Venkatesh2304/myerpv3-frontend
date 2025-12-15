import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import React from "react";

export interface CurrencyInputProps extends React.ComponentProps<"input"> {
    currencySymbol?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ className, currencySymbol = "₹", ...props }, ref) => {
        return (
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                    {currencySymbol}
                </span>
                <Input
                    type="number"
                    step="1"
                    className={cn("pl-8 font-bold", className)}
                    ref={ref}
                    {...props}
                />
            </div>
        );
    }
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
