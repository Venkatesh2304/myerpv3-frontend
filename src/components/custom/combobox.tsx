import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface ComboboxOption {
  label: string;
  value: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  allowCustom?: boolean;
  isLoading?: boolean;
  minSearchLength?: number;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select option",
  disabled = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  allowCustom = false,
  isLoading = false,
  minSearchLength = 0,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const shouldShowOptions = search.length >= minSearchLength;
  const filteredOptions = shouldShowOptions
    ? options.filter((option) =>
      option?.label?.toLowerCase()?.includes(search.toLowerCase())
    )
    : [];

  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label || value || placeholder;

  const handleSelect = (currentValue: string) => {
    onValueChange(currentValue);
    setOpen(false);
    setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>Loading...</CommandEmpty>
            ) : !shouldShowOptions ? (
              <CommandEmpty>
                {minSearchLength > 0
                  ? `Type at least ${minSearchLength} letter${minSearchLength > 1 ? 's' : ''} to search.`
                  : emptyMessage}
              </CommandEmpty>
            ) : filteredOptions.length === 0 && !allowCustom ? (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    keywords={[option.label]}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
                {allowCustom && search && filteredOptions.length === 0 && (
                  <CommandItem
                    value={search}
                    onSelect={() => handleSelect(search)}
                  >
                    <span className="">Add "{search}"</span>
                  </CommandItem>
                )}
                {allowCustom && search && filteredOptions.length > 0 && !filteredOptions.find(opt => opt.value === search) && (
                  <CommandItem
                    value={search}
                    onSelect={() => handleSelect(search)}
                    className="border-t"
                  >
                    <span className="">Add "{search}"</span>
                  </CommandItem>
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
