import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import React from "react";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { formatDate } from "@/lib/common";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Cheque } from "./types";
import { DepositSlipButton } from "./components/deposit-slip-button";
import { useCompany } from "@/providers/company-provider";
import { CrudFilter, CrudFilters, useNavigation, useNotification } from "@refinedev/core";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/custom/date-picker";
import { ResourceCombobox } from "@/components/custom/resource-combobox";
import { getFilterValue, handleFilterChange } from "@/lib/filters";

const ChequeFilters: React.FC<{
  filters: CrudFilters;
  setFilters: (filters: CrudFilters) => void;
}> = ({ filters, setFilters }) => {
  const { company } = useCompany();

  const resetFilters = () => {
    setFilters([
      { field: "deposit_date", operator: "eq", value: null },
      { field: "party", operator: "eq", value: null },
    ]);
  };

  return (
    <Card className="mb-2 pt-4 pb-4">
      <CardContent>
        <div className="grid grid-cols-4 gap-4 items-end">
          <div className="flex flex-col space-y-2">
            <Label className="text-xs">Deposit Date</Label>
            <DatePicker
              value={getFilterValue(filters, "deposit_date", null)}
              onChange={(date) => handleFilterChange(setFilters, "deposit_date", date)}
            />
          </div>
          <div className="flex flex-col space-y-2">
            <Label className="text-xs">Party</Label>
            <ResourceCombobox
              resource="party"
              labelKey="label"
              valueKey="value"
              minSearchLength={3}
              value={getFilterValue(filters, "party", null)}
              onValueChange={(value) => handleFilterChange(setFilters, "party", value)}
              filters={[
                {
                  field: "company",
                  operator: "eq",
                  value: company?.id,
                }
              ]}
            />
          </div>
          <Button type="button" variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export const ChequeList = () => {
  const [showOnlyDepositable, setShowOnlyDepositable] = React.useState(false);
  const { company } = useCompany();
  const { open } = useNotification();
  const { edit } = useNavigation();
  const columns = React.useMemo(() => {
    const columnHelper = createColumnHelper<Cheque>();
    return [
      columnHelper.accessor("cheque_date", {
        id: "cheque_date",
        header: "Cheque Date",
        enableSorting: true,
        cell: ({ getValue }) => formatDate(getValue()),
        size: 100,
      }),
      columnHelper.accessor("cheque_no", {
        id: "cheque_no",
        header: "Cheque No",
        enableSorting: true,
        cell: ({ getValue }) => (
          <span className="font-mono">{getValue()}</span>
        ),
        size: 100,
      }),
      columnHelper.accessor("party_name", {
        id: "party_name",
        header: "Party",
        enableSorting: true,
        size: 300,
        cell: ({ row, getValue }) => (
          <span className={cn("font-mono font-bold",
            !!row.original.bank_entry ? "text-green-500" :
              (!!row.original?.deposit_date ? "text-blue-500" : "text-gray-500")
          )}>{getValue()}</span>
        ),
      }),
      columnHelper.accessor("amt", {
        id: "amt",
        header: "Amount",
        enableSorting: true,
        cell: ({ getValue }) =>
          `₹${getValue().toLocaleString("en-IN", { minimumFractionDigits: 0 })}`,
        size: 100,
      }),
      columnHelper.accessor("bank", {
        id: "bank",
        header: "Bank",
        enableSorting: true,
        cell: ({ getValue }) => getValue() ?? "",
        size: 100
      }),
      columnHelper.accessor("deposit_date", {
        id: "deposit_date",
        header: "Deposit Date",
        enableSorting: true,
        cell: ({ getValue }) => formatDate(getValue()),
        size: 100
      })
    ];
  }, []);

  const permanentFilters: CrudFilter[] = React.useMemo(() => {
    const filters: CrudFilter[] = [
      { field: "company", operator: "eq", value: company?.id },
    ];
    if (showOnlyDepositable) {
      filters.push({ field: "is_depositable", operator: "eq", value: "true" });
    }
    return filters;
  }, [company?.id, showOnlyDepositable]);

  const table = useTable({
    columns,
    refineCoreProps: {
      filters: {
        permanent: permanentFilters,
      },
      pagination: {
        pageSize: 50
      }
    },
    enableRowSelection: true
  });

  const { refineCore: { filters, setFilters } } = table;

  const onRowEnter = (row: Cheque) => {
    if (row.bank_entry) {
      open?.({
        type: "error",
        message: `Cheque is already mapped to a bank entry ${row.bank_entry}`,
      });
      edit("bankstatement", row.bank_entry);
    } else {
      edit("cheque", row.id);
    }
  }
  return (
    <ListView>
      <ListViewHeader title="">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-depositable"
              checked={showOnlyDepositable}
              onCheckedChange={(checked) => setShowOnlyDepositable(!!checked)}
            />
            <Label htmlFor="show-depositable" className="cursor-pointer text-muted-foreground">
              Show only depositable
            </Label>
          </div>
          <DepositSlipButton
            selectedIds={table.reactTable.getSelectedRowModel().rows.map(
              (row) => row.original.id
            )}
            onSuccess={() => {
              table.refineCore.tableQuery.refetch();
              table.reactTable.resetRowSelection();
            }}
          />
        </div>
      </ListViewHeader>
      <ChequeFilters filters={filters} setFilters={setFilters} />
      <DataTable table={table} onRowEnter={onRowEnter} />
    </ListView>
  );
};
