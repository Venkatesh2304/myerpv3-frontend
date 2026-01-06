import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import React from "react";
import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { ListView, ListViewHeader } from "@/components/refine-ui/views/list-view";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { formatDate } from "@/lib/common";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { Bank } from "./types";
import type { CrudFilters } from "@refinedev/core";

import { LoadingButton } from "@/components/ui/loading-button";
import { dataProvider } from "@/lib/dataprovider";
import { useNotification, useInvalidate } from "@refinedev/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/custom/date-picker";
import { downloadFile, downloadFromResponse } from "@/lib/download";

import { useSelect } from "@refinedev/core";
import { RefreshCw } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { getFilterValue, handleFilterChange } from "@/lib/filters";
import { useCompany } from "@/providers/company-provider";
import { cn } from "@/lib/utils";

const COLLECTION_TYPES = [
  { value: "all", label: "All" },
  { value: "cheque", label: "Cheque" },
  { value: "neft", label: "NEFT" },
  { value: "upi", label: "UPI (IKEA)" },
  { value: "cash_deposit", label: "Cash Deposit" },
  { value: "self_transfer", label: "Self Transfer" },
  { value: "others", label: "Others" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "not_saved", label: "Not Saved" },
  { value: "not_pushed", label: "Not Pushed" },
];



const BankFilters: React.FC<{
  filters: CrudFilters;
  setFilters: (filters: CrudFilters) => void;
}> = ({ filters, setFilters }) => {

  const { company } = useCompany();

  const { options: bankOptions } = useSelect({
    resource: "bank",
    optionLabel: "name",
    pagination: {
      mode: "off",
    },
    optionValue: "id",
    filters: [
      {
        field: "company",
        operator: "eq",
        value: company?.id,
      },
    ]
  });



  const resetFilters = () => {
    setFilters(["date", "type", "bank", "status"].map((field) => ({
      field,
      operator: "eq",
      value: null,
    })));
  };

  return (
    <Card className="mb-2 pt-4 pb-4">
      <CardContent className="">
        <div className="grid grid-cols-5 gap-8 items-end">
          <div className="flex flex-col space-y-2">
            <Label className="text-xs">Date</Label>

            <DatePicker
              value={getFilterValue(filters, "date", null)}
              onChange={(date) => handleFilterChange(setFilters, "date", date)}
            />

          </div>

          <div className="flex flex-col space-y-2">
            <Label className="text-xs">Collection Type</Label>
            <Select
              value={getFilterValue(filters, "type")}
              onValueChange={(value) => handleFilterChange(setFilters, "type", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent>
                {COLLECTION_TYPES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-2">
            <Label className="text-xs">Bank</Label>
            <Select
              value={getFilterValue(filters, "bank")}
              onValueChange={(value) => handleFilterChange(setFilters, "bank", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {bankOptions.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col space-y-2">
            <Label className="text-xs">Status</Label>
            <Select
              value={getFilterValue(filters, "status")}
              onValueChange={(value) => handleFilterChange(setFilters, "status", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="button" variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};



const MatchUpiButton = () => {
  const { open } = useNotification();
  const { company } = useCompany();

  const invalidate = useInvalidate();

  const handleMatchUpi = () => {
    return dataProvider.custom({
      url: "/match_upi/",
      method: "post",
      payload: {
        company: company?.id,
      },
      meta: {
        responseType: "blob",
      },
    }).then((response) => {
      open?.({
        type: "success",
        message: "UPI Matched",
        description: "UPI transactions have been matched successfully.",
      });
      invalidate({
        resource: "bankstatement",
        invalidates: ["list"],
      });
      return downloadFromResponse(response, "match_upi.xlsx");
    }).catch((err) => {
      open?.({
        type: "error",
        message: "Error matching UPI",
        description: err.message,
      });
    });
  };

  return (
    <LoadingButton
      variant="default"
      onClick={handleMatchUpi}
    >
      Match UPI
    </LoadingButton>
  );
};

const UploadStatementDialog = () => {
  const [openDialog, setOpenDialog] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [bank, setBank] = React.useState<string>("sbi");
  const { open } = useNotification();

  const invalidate = useInvalidate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  //Upload hot key
  useHotkeys("u", () => setOpenDialog(true), {
    enableOnFormTags: false,
  });

  const handleUpload = () => {
    if (!file) {
      open?.({
        type: "error",
        message: "File required",
        description: "Please select a file to upload.",
      });
      return Promise.resolve();
    }

    if (!bank) {
      open?.({
        type: "error",
        message: "Bank required",
        description: "Please select a bank.",
      });
      return Promise.resolve();
    }

    const formData = new FormData();
    formData.append("excel_file", file);
    formData.append("bank_type", bank);

    return dataProvider.custom({
      url: "/bank_statement_upload/",
      method: "post",
      payload: formData,
    }).then(() => {
      open?.({
        type: "success",
        message: "Statement Uploaded",
        description: "Bank statement has been uploaded successfully.",
      });
      setOpenDialog(false);
      setFile(null);
      setBank("");
      invalidate({
        resource: "bankstatement",
        invalidates: ["list"],
      });
    }).catch((err) => {
      open?.({
        type: "error",
        message: "Error uploading statement",
        description: err?.response?.data?.error,
      });
    });
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button variant="default">Upload Statement</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Bank Statement</DialogTitle>
          <DialogDescription>
            Upload an Excel file containing the bank statement.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bank" className="text-right">
              Bank
            </Label>
            <Select value={bank} onValueChange={setBank}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kvb">KVB</SelectItem>
                <SelectItem value="sbi">SBI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              File
            </Label>
            <Input
              id="file"
              type="file"
              accept=".xlsx, .xls"
              className="col-span-3"
              onChange={handleFileChange}
            />
          </div>
        </div>
        <DialogFooter>
          <LoadingButton onClick={handleUpload}>Upload</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const PushCollectionButton = ({ table }: { table: any }) => {
  const { open } = useNotification();
  const { company } = useCompany();
  const invalidate = useInvalidate();

  const handlePushCollection = async () => {
    const selectedIds = table.reactTable.getSelectedRowModel().rows.map((row: any) => row.original.id);
    if (selectedIds.length === 0) return;

    await dataProvider.custom({
      url: "/push_collection/",
      method: "post",
      payload: {
        ids: selectedIds,
        company: company?.id,
      },
    }).then(async (res) => {
      await dataProvider.custom({
        url: res.data.filepath,
        method: "get",
        meta: {
          responseType: "blob",
        },
      }).then((res) => {
        downloadFromResponse(res, "collection_push.xlsx");
      });
      table.reactTable.resetRowSelection();
      open?.({
        type: "success",
        message: "Collection Pushed",
        description: "Selected collections have been pushed successfully.",
      });

      invalidate({
        resource: "bankstatement",
        invalidates: ["list"],
      });
    }).catch((err: any) => {
      open?.({
        type: "error",
        message: "Error pushing collection",
        description: err?.message || "Something went wrong",
      });
    });
  };

  return (
    <LoadingButton
      variant="default"
      onClick={handlePushCollection}
      hidden={table.reactTable.getSelectedRowModel().rows.length === 0}
    >
      Push Collection
    </LoadingButton>
  );
};

const RefreshBankButton = () => {
  const { open } = useNotification();
  const { company } = useCompany();
  const invalidate = useInvalidate();

  const handleRefresh = () => {
    return dataProvider.custom({
      url: "/refresh_bank/",
      method: "post",
      payload: {
        company: company?.id,
      },
    }).then(() => {
      open?.({
        type: "success",
        message: "Bank Refreshed",
        description: "Bank list has been refreshed successfully.",
      });
      invalidate({
        resource: "bank",
        invalidates: ["list"],
      });
    }).catch((err) => {
      open?.({
        type: "error",
        message: "Error refreshing bank",
        description: err?.response?.data || "Something went wrong",
      });
    });
  };

  return (
    <LoadingButton
      variant="outline"
      size="icon"
      onClick={handleRefresh}
    >
      <RefreshCw className="h-4 w-4" />
    </LoadingButton>
  );
};

const SmartMatchButton = ({ table }: { table: any }) => {
  const { open } = useNotification();
  const invalidate = useInvalidate();

  const handleSmartMatch = () => {
    const selectedIds = table.reactTable.getSelectedRowModel().rows.map((row: any) => row.original.id);
    if (selectedIds.length === 0) return;

    return dataProvider.custom({
      url: "/smart_match/",
      method: "post",
      payload: {
        ids: selectedIds,
      },
    }).then(() => {
      open?.({
        type: "success",
        message: "Smart Match Successful",
        description: "Smart match process completed successfully.",
      });
      table.reactTable.resetRowSelection();
      invalidate({
        resource: "bankstatement",
        invalidates: ["list"],
      });
    });
  };

  return (
    <LoadingButton
      variant="default"
      onClick={handleSmartMatch}
      hidden={table.reactTable.getSelectedRowModel().rows.length === 0}
    >
      Smart Match
    </LoadingButton>
  );
};

export const BankList = () => {
  // const [filters, setFilters] = React.useState<CrudFilters>([]);
  const { company } = useCompany();
  // const [permanentFilters, setPermanentFilters] = React.useState<CrudFilters>([]);

  // React.useEffect(() => {
  //   setPermanentFilters([
  //     ...filters,
  //     {
  //       field: "company",
  //       operator: "eq",
  //       value: company?.id,
  //     }
  //   ]);
  // }, [filters, company]);

  const columns = React.useMemo(() => {
    const columnHelper = createColumnHelper<Bank>();

    return [
      columnHelper.accessor("date", {
        id: "date",
        header: "Date",
        enableSorting: true,
        cell: ({ getValue }) => formatDate(getValue()),
        size: 75,
      }),
      columnHelper.accessor("ref", {
        id: "ref",
        header: "Reference",
        enableSorting: true,
        cell: ({ row, getValue }) => <span className={
          cn("font-mono font-bold",
            {
              "not_saved": "text-gray-500",
              "saved": "text-blue-500",
              "pushed": "text-green-500"
            }[row?.original?.status]
          )
        }>{getValue()}</span>,
        size: 200,
      }),
      columnHelper.accessor("desc", {
        id: "desc",
        header: "Description",
        enableSorting: true,
        cell: ({ getValue }) => <span className="truncate">{getValue()}</span>,
        size: 400,
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
        size: 100,
      }),
      columnHelper.accessor("type", {
        id: "type",
        header: "Type",
        enableSorting: true,
        cell: ({ getValue }) => getValue()?.toUpperCase() ?? "",
        size: 100,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => <EditButton recordItemId={row.original.id} />,
        size: 50,
      }),
    ];
  }, []);

  const table = useTable({
    columns,
    enableRowSelection: true,
    refineCoreProps: {
      syncWithLocation: true,
      filters: {
        initial: [
          {
            field: "company",
            operator: "eq",
            value: company?.id,
          }
        ],
      },
      pagination: {
        mode: "server",
      },
      queryOptions: {
        enabled: !!company?.id
      },
    },
  });
  const { refineCore: { filters, setFilters } } = table;


  //Reset Hot key
  useHotkeys("r", () => setFilters(["date", "type", "bank", "status"].map((field) => ({
    field,
    operator: "eq",
    value: null,
  })))
    , {
      enableOnFormTags: false,
    });

  useHotkeys("t", () => setFilters([
    {
      field: "date",
      operator: "eq",
      value: new Date().toISOString().split("T")[0],
    }
  ]), {
    enableOnFormTags: false,
  });
  useHotkeys("s", () => setFilters([
    {
      field: "status",
      operator: "eq",
      value: "not_saved",
    }
  ]), {
    enableOnFormTags: false,
  });
  useHotkeys("p", () => setFilters([
    {
      field: "status",
      operator: "eq",
      value: "not_pushed",
    }
  ]), {
    enableOnFormTags: false,
  });
  useHotkeys("a", () => setFilters([
    {
      field: "status",
      operator: "eq",
      value: null,
    }
  ]), {
    enableOnFormTags: false,
  });

  return (
    <ListView>
      <ListViewHeader title="" canCreate={false} >
        <div className="flex items-center gap-4">
          <SmartMatchButton table={table} />
          <PushCollectionButton table={table} />
          <MatchUpiButton />
          <UploadStatementDialog />
          <RefreshBankButton />
        </div>
      </ListViewHeader>
      <BankFilters filters={filters} setFilters={setFilters} />
      <DataTable table={table} />
    </ListView>
  );
};
