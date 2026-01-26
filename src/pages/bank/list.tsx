import { useTable } from "@refinedev/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import React, { useEffect } from "react";
import { format, subDays } from "date-fns";

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
import { useNotification, useInvalidate, useNavigation } from "@refinedev/core";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ResourceCombobox } from "@/components/custom/resource-combobox";
import { DebouncedInput } from "@/components/ui/debounced-input";

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
    setFilters(["fromd", "tod", "type", "bank", "status", "amt", "party"].map((field) => ({
      field,
      operator: "eq",
      value: null,
    })));
  };

  return (
    <Card className="mb-2 pt-4 pb-4">
      <CardContent className="">
        <div className="grid grid-cols-8 gap-4 items-end">
          <div className="flex flex-col space-y-2">
            <Label className="text-xs">From Date</Label>

            <DatePicker
              value={getFilterValue(filters, "fromd", null)}
              onChange={(date) => {
                handleFilterChange(setFilters, "fromd", date);
                if (!getFilterValue(filters, "tod", null)) {
                  handleFilterChange(setFilters, "tod", date);
                }
              }}
            />

          </div>

          <div className="flex flex-col space-y-2">
            <Label className="text-xs">To Date</Label>

            <DatePicker
              value={getFilterValue(filters, "tod", null)}
              onChange={(date) => {
                handleFilterChange(setFilters, "tod", date);
                if (!getFilterValue(filters, "fromd", null)) {
                  handleFilterChange(setFilters, "fromd", date);
                }
              }}
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

          {/* 
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
          </div> */}

          <div className="flex flex-col space-y-2">
            <Label className="text-xs">Amount</Label>
            <DebouncedInput
              value={getFilterValue(filters, "amt", null)}
              onChange={(value) => handleFilterChange(setFilters, "amt", value)}
              placeholder="Amount"
            />
          </div>

          <div className="flex flex-col space-y-2 col-span-2">
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


const UploadStatementDialog = () => {
  const StatsDialog = ({ open, onOpenChange, stats }: { open: boolean, onOpenChange: (open: boolean) => void, stats: any[] | null }) => {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Upload Summary</DialogTitle>
            <DialogDescription>
              Summary of transactions from the uploaded statement.
            </DialogDescription>
          </DialogHeader>
          {stats && (
            <div className="mt-4 border rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-2 text-left font-medium">Type</th>
                    <th className="p-2 text-right font-medium">Count</th>
                    <th className="p-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.map((stat, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="p-2">{stat.type || "Unknown"}</td>
                      <td className="p-2 text-right">{stat.count}</td>
                      <td className="p-2 text-right">
                        ₹{stat.total.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  const [openDialog, setOpenDialog] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [bank, setBank] = React.useState<string>("sbi");
  const [stats, setStats] = React.useState<any[] | null>(null);
  const [showStatsDialog, setShowStatsDialog] = React.useState(false);
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
    }).then((res) => {
      open?.({
        type: "success",
        message: "Statement Uploaded",
        description: "Bank statement has been uploaded successfully.",
      });
      setOpenDialog(false);
      setFile(null);
      setStats(res.data.stats);
      setShowStatsDialog(true);
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
    <>
      <Dialog open={openDialog} onOpenChange={(open) => {
        setOpenDialog(open);
        if (open) setStats(null);
      }}>
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
      <StatsDialog open={showStatsDialog} onOpenChange={setShowStatsDialog} stats={stats} />
    </>
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
        type: res?.data?.status == "success" ? "success" : "error",
        message: ({ "success": "All Collections Pushed", "partial_success": "Some Collections Not Pushed" })[res?.data?.status],
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


const BankSummaryDialog = () => {
  const [openDialog, setOpenDialog] = React.useState(false);
  const [fromDate, setFromDate] = React.useState<string | null>(format(subDays(new Date(), 3), "yyyy-MM-dd"));
  const [toDate, setToDate] = React.useState<string | null>(format(new Date(), "yyyy-MM-dd"));

  const [downloadCollection, setDownloadCollection] = React.useState<boolean>(false);
  const { open } = useNotification();

  const handleDownload = () => {
    if (!fromDate || !toDate) {
      open?.({
        type: "error",
        message: "Dates required",
        description: "Please select both from and to dates.",
      });
      return Promise.resolve();
    }

    return dataProvider.custom({
      url: "/bank_summary/",
      method: "post",
      payload: {
        fromd: fromDate,
        tod: toDate,
        download_collection: downloadCollection,
      },
    }).then(async (response) => {
      await dataProvider.custom({
        url: response.data.filepath,
        method: "get",
        meta: {
          responseType: "blob",
        },
      }).then((res) => {
        downloadFromResponse(res, `bank_summary_${fromDate}_to_${toDate}.xlsx`);
      });
      open?.({
        type: "success",
        message: "Summary Downloaded",
        description: "Bank summary has been downloaded successfully.",
      });
      setOpenDialog(false);
    }).catch((err) => {
      open?.({
        type: "error",
        message: "Error downloading summary",
        description: err?.response?.data?.error || err.message,
      });
    });
  };

  return (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button variant="outline">Summary</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Bank Summary</DialogTitle>
          <DialogDescription>
            Select a date range to download the bank summary.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="fromDate" className="text-right">
              From Date
            </Label>
            <div className="col-span-3">
              <Input
                type="date"
                value={fromDate || ""}
                onChange={(e) => setFromDate(e.target.value || null)}
              />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="toDate" className="text-right">
              To Date
            </Label>
            <div className="col-span-3">
              <Input
                type="date"
                value={toDate || ""}
                onChange={(e) => setToDate(e.target.value || null)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="downloadCollection"
              checked={downloadCollection}
              onCheckedChange={(checked) => setDownloadCollection(!!checked)}
            />
            <Label
              htmlFor="downloadCollection"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Fresh Download Ikea Collection
            </Label>
          </div>
        </div>
        <DialogFooter>
          <LoadingButton onClick={handleDownload}>Download</LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const BankList = () => {
  const { company } = useCompany();
  
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
              "not_pushed": "text-blue-500",
              "partially_pushed": "text-orange-500",
              "pushed": "text-green-500",
              "not_applicable": "text-green-500"
            }[row?.original?.status],
            (row?.original?.company && row?.original?.company != company?.id) && "text-pink-200"
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
      // columnHelper.display({
      //   id: "actions",
      //   header: "",
      //   cell: ({ row }) => <EditButton recordItemId={row.original.id} />,
      //   size: 50,
      // }),
    ];
  }, [company]);

  const table = useTable({
    columns,
    enableRowSelection: true,
    refineCoreProps: {
      syncWithLocation: true,
      filters: {
        permanent: [
          {
            field: "company",
            operator: "eq",
            value: company?.id,
          }
        ],
      },
      pagination: {
        mode: "server",
        pageSize: 20
      },
      queryOptions: {
        enabled: !!company?.id
      },
    },
  });

  const { refineCore: { filters, setFilters } } = table;
  const { edit: navigateEdit } = useNavigation();

  //Reset Hot key
  useHotkeys("r", () => setFilters(["fromd", "tod", "type", "bank", "status", "amt", "party"].map((field) => ({
    field,
    operator: "eq",
    value: null,
  })))
    , {
      enableOnFormTags: false,
    });

  useHotkeys("t", () => setFilters([
    {
      field: "fromd",
      operator: "eq",
      value: new Date().toISOString().split("T")[0],
    },
    {
      field: "tod",
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
          <BankSummaryDialog />
          <UploadStatementDialog />
          <RefreshBankButton />
        </div>
      </ListViewHeader>
      <BankFilters filters={filters} setFilters={setFilters} />
      <DataTable table={table} onRowEnter={(row) => navigateEdit("bankstatement", row.id)} />
    </ListView>
  );
};
