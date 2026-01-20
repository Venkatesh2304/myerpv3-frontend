"use client"

import * as React from "react"
import { Input } from "@/components/ui/input" // Import your existing shadcn input

interface DebouncedInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange'> {
    value: string | number
    onChange: (value: string | number) => void
    debounce?: number
}

export function DebouncedInput({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
}: DebouncedInputProps) {
    const [value, setValue] = React.useState(initialValue)

    // Sync internal state with external value (e.g., when filters are reset)
    React.useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    // Trigger the actual onChange after the timeout
    React.useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value)
        }, debounce)

        return () => clearTimeout(timeout)
    }, [value, debounce, onChange])

    return (
        <Input
            {...props}
            value={value}
            onChange={(e) => setValue(e.target.value)}
        />
    )
}