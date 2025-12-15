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

export const ChequeList = () => {
  const [showOnlyDepositable, setShowOnlyDepositable] = React.useState(false);

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
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <EditButton
            recordItemId={row.original.id}
          />
        ),
        size: 100
      }),
    ];
  }, []);

  const table = useTable({
    columns,
    refineCoreProps: {
      syncWithLocation: true,
      filters: {
        permanent: showOnlyDepositable
          ? [
            {
              field: "is_depositable",
              operator: "eq",
              value: true,
            },
          ]
          : [],
      },
    },
    enableRowSelection: true
  });


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
      <DataTable table={table} />
    </ListView>
  );
};
