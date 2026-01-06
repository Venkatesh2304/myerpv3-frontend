import { CrudFilters, CrudOperators } from "@refinedev/core";

export const getFilterValue = (filters: CrudFilters, field: string, defaultValue: any = "all") => {
    const filter = filters.find((f) => "field" in f && f.field === field);
    return filter?.value || defaultValue;
};

export const handleFilterChange = (
    setFilters: (filters: CrudFilters) => void,
    field: string,
    value: any,
    operator: CrudOperators = "eq"
) => {
    setFilters([
        {
            field,
            operator,
            value: value === "all" ? null : value,
        },
    ]);
};
