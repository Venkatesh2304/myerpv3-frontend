"use client"

import * as React from "react"
import { format, parse } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { Control, FieldValues, Path } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>
    name: Path<TFieldValues>
    label?: string
    placeholder?: string
    disabled?: boolean
}

export function DatePicker<TFieldValues extends FieldValues>({
    control,
    name,
    label,
    placeholder = "Select date",
    disabled,
}: DatePickerProps<TFieldValues>) {
    const [open, setOpen] = React.useState(false);
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => {
                const dateValue = field.value
                    ? typeof field.value === "string"
                        ? parse(field.value, "yyyy-MM-dd", new Date())
                        : field.value
                    : undefined

                return (
                    <FormItem className="flex flex-col">
                        {label && <FormLabel className="text-xs">{label}</FormLabel>}
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full pl-3 text-left font-normal",
                                            !dateValue && "text-muted-foreground"
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
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    className="w-full"
                                    mode="single"
                                    selected={dateValue}
                                    onSelect={(date) => {
                                        field.onChange(
                                            date ? format(date, "yyyy-MM-dd") : ""
                                        );
                                        setOpen(false);
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                )
            }}
        />
    )
}
