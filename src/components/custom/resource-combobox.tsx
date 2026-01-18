import { CrudFilters, useList } from "@refinedev/core";
import { useMemo } from "react";
import { Combobox } from "./combobox";

interface ResourceComboboxProps {
  resource: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minSearchLength?: number;
  labelKey?: string;
  valueKey?: string;
  filters?: CrudFilters;
  getLabel?: (item: any) => string;
}

export function ResourceCombobox({
  resource,
  value,
  onValueChange,
  placeholder = "Select option",
  disabled = false,
  minSearchLength = 0,
  labelKey = "label",
  valueKey = "value",
  filters,
  getLabel,
}: ResourceComboboxProps) {
  const { query: { data: resourceData, isLoading } } = useList<Record<string, any>>({
    resource,
    filters,
    pagination: { mode: "off" },
  });

  const options = useMemo(() => {
    const data = resourceData?.data || [];
    return data.map((item) => ({
      label: item[labelKey],
      value: item[valueKey],
    }));
  }, [resourceData?.data, labelKey, valueKey]);
  
  return (
    <Combobox
      options={options}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      disabled={disabled}
      isLoading={isLoading}
      minSearchLength={minSearchLength}
    />
  );
}
