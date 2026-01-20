"use client"

import * as React from "react"
import { format, parse } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { FormControl } from "@/components/ui/form"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export function DatePicker({
    value,
    onChange,
    placeholder = "Select date",
    disabled,
    className,
}: {
    value?: string | Date;
    onChange?: (date: string | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}) {
    const [open, setOpen] = React.useState(false);

    const dateValue = value
        ? typeof value === "string"
            ? parse(value, "yyyy-MM-dd", new Date())
            : value
        : undefined;


    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full pl-3 text-left font-normal",
                        !dateValue && "text-muted-foreground",
                        className
                    )}
                    disabled={disabled}
                >
                    {dateValue ? (
                        format(dateValue, "PPP")
                    ) : (
                        <span>{placeholder}</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={dateValue}
                    onSelect={(date) => {
                        onChange?.(
                            date ? format(date, "yyyy-MM-dd") : undefined
                        );
                        setOpen(false);
                    }}
                    initialFocus
                />
            </PopoverContent>
        </Popover>
    );
}
